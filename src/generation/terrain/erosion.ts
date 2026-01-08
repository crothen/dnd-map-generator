import { clamp, coordToIndex, gradient } from '../../utils/math';
import { SeededRandom } from '../../utils/random';

export interface ErosionOptions {
  width: number;
  height: number;
  iterations: number;
  erosionRate: number;
  depositionRate: number;
  evaporationRate: number;
  sedimentCapacity: number;
  minSlope: number;
}

const DEFAULT_EROSION_OPTIONS: ErosionOptions = {
  width: 512,
  height: 512,
  iterations: 50000,
  erosionRate: 0.3,
  depositionRate: 0.3,
  evaporationRate: 0.02,
  sedimentCapacity: 4,
  minSlope: 0.01,
};

/**
 * Apply hydraulic erosion simulation to the heightmap
 * Uses particle-based erosion where water droplets flow downhill,
 * picking up and depositing sediment based on their speed and capacity
 */
export function applyErosion(
  heightmap: Float32Array,
  seed: string,
  options: Partial<ErosionOptions> = {}
): Float32Array {
  const opts = { ...DEFAULT_EROSION_OPTIONS, ...options };
  const { width, height, iterations } = opts;

  const result = new Float32Array(heightmap);
  const rng = new SeededRandom(seed + '_erosion');

  for (let i = 0; i < iterations; i++) {
    // Start droplet at random position
    let x = rng.range(0, width - 1);
    let y = rng.range(0, height - 1);
    let dirX = 0;
    let dirY = 0;
    let speed = 1;
    let water = 1;
    let sediment = 0;

    const maxSteps = 64;

    for (let step = 0; step < maxSteps; step++) {
      const intX = Math.floor(x);
      const intY = Math.floor(y);

      if (intX < 0 || intX >= width - 1 || intY < 0 || intY >= height - 1) {
        break;
      }

      // Calculate gradient at current position
      const grad = gradient(result, intX, intY, width, height);

      // Update direction with inertia
      const inertia = 0.3;
      dirX = dirX * inertia - grad.dx * (1 - inertia);
      dirY = dirY * inertia - grad.dy * (1 - inertia);

      // Normalize direction
      const len = Math.sqrt(dirX * dirX + dirY * dirY);
      if (len > 0) {
        dirX /= len;
        dirY /= len;
      } else {
        // Random direction if flat
        const angle = rng.range(0, Math.PI * 2);
        dirX = Math.cos(angle);
        dirY = Math.sin(angle);
      }

      // Move to new position
      const newX = x + dirX;
      const newY = y + dirY;

      if (newX < 0 || newX >= width - 1 || newY < 0 || newY >= height - 1) {
        break;
      }

      // Calculate height difference
      const oldHeight = getInterpolatedHeight(result, x, y, width, height);
      const newHeight = getInterpolatedHeight(result, newX, newY, width, height);
      const heightDiff = newHeight - oldHeight;

      // Calculate sediment capacity based on slope and speed
      const slope = Math.max(-heightDiff, opts.minSlope);
      const capacity = Math.max(slope * speed * water * opts.sedimentCapacity, 0);

      if (sediment > capacity || heightDiff > 0) {
        // Deposit sediment
        const depositAmount = heightDiff > 0
          ? Math.min(sediment, heightDiff)
          : (sediment - capacity) * opts.depositionRate;

        sediment -= depositAmount;
        depositSediment(result, x, y, width, height, depositAmount);
      } else {
        // Erode terrain
        const erodeAmount = Math.min(
          (capacity - sediment) * opts.erosionRate,
          -heightDiff
        );

        sediment += erodeAmount;
        erodeTerrain(result, x, y, width, height, erodeAmount);
      }

      // Update speed based on height difference
      speed = Math.sqrt(Math.max(0, speed * speed + heightDiff));

      // Evaporate water
      water *= (1 - opts.evaporationRate);

      if (water < 0.01) {
        break;
      }

      x = newX;
      y = newY;
    }
  }

  // Normalize result
  let min = Infinity;
  let max = -Infinity;
  for (let i = 0; i < result.length; i++) {
    min = Math.min(min, result[i]);
    max = Math.max(max, result[i]);
  }
  const range = max - min || 1;
  for (let i = 0; i < result.length; i++) {
    result[i] = clamp((result[i] - min) / range, 0, 1);
  }

  return result;
}

/**
 * Get bilinearly interpolated height at a floating-point position
 */
function getInterpolatedHeight(
  heightmap: Float32Array,
  x: number,
  y: number,
  width: number,
  height: number
): number {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const x1 = Math.min(x0 + 1, width - 1);
  const y1 = Math.min(y0 + 1, height - 1);

  const fx = x - x0;
  const fy = y - y0;

  const h00 = heightmap[coordToIndex(x0, y0, width)];
  const h10 = heightmap[coordToIndex(x1, y0, width)];
  const h01 = heightmap[coordToIndex(x0, y1, width)];
  const h11 = heightmap[coordToIndex(x1, y1, width)];

  const h0 = h00 * (1 - fx) + h10 * fx;
  const h1 = h01 * (1 - fx) + h11 * fx;

  return h0 * (1 - fy) + h1 * fy;
}

/**
 * Deposit sediment at a position, spreading to nearby cells
 */
function depositSediment(
  heightmap: Float32Array,
  x: number,
  y: number,
  width: number,
  height: number,
  amount: number
): void {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const x1 = Math.min(x0 + 1, width - 1);
  const y1 = Math.min(y0 + 1, height - 1);

  const fx = x - x0;
  const fy = y - y0;

  heightmap[coordToIndex(x0, y0, width)] += amount * (1 - fx) * (1 - fy);
  heightmap[coordToIndex(x1, y0, width)] += amount * fx * (1 - fy);
  heightmap[coordToIndex(x0, y1, width)] += amount * (1 - fx) * fy;
  heightmap[coordToIndex(x1, y1, width)] += amount * fx * fy;
}

/**
 * Erode terrain at a position, affecting nearby cells
 */
function erodeTerrain(
  heightmap: Float32Array,
  x: number,
  y: number,
  width: number,
  height: number,
  amount: number
): void {
  const radius = 2;
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);

  let totalWeight = 0;
  const weights: { idx: number; weight: number }[] = [];

  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      const nx = x0 + dx;
      const ny = y0 + dy;

      if (nx < 0 || nx >= width || ny < 0 || ny >= height) {
        continue;
      }

      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= radius) {
        const weight = Math.max(0, radius - dist) / radius;
        weights.push({ idx: coordToIndex(nx, ny, width), weight });
        totalWeight += weight;
      }
    }
  }

  for (const { idx, weight } of weights) {
    heightmap[idx] -= amount * (weight / totalWeight);
  }
}

/**
 * Apply thermal erosion (talus slope)
 * Material slides down if slope exceeds the angle of repose
 */
export function applyThermalErosion(
  heightmap: Float32Array,
  width: number,
  height: number,
  iterations: number = 10,
  talusAngle: number = 0.5
): Float32Array {
  const result = new Float32Array(heightmap);

  for (let iter = 0; iter < iterations; iter++) {
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = coordToIndex(x, y, width);
        const h = result[idx];

        // Check all neighbors
        let maxDiff = 0;
        let maxNeighbor = -1;

        const neighbors = [
          coordToIndex(x - 1, y, width),
          coordToIndex(x + 1, y, width),
          coordToIndex(x, y - 1, width),
          coordToIndex(x, y + 1, width),
        ];

        for (const nIdx of neighbors) {
          const diff = h - result[nIdx];
          if (diff > maxDiff && diff > talusAngle) {
            maxDiff = diff;
            maxNeighbor = nIdx;
          }
        }

        if (maxNeighbor >= 0) {
          const transfer = (maxDiff - talusAngle) * 0.5;
          result[idx] -= transfer;
          result[maxNeighbor] += transfer;
        }
      }
    }
  }

  return result;
}
