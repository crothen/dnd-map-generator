/**
 * Clamp a value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Linear interpolation between two values
 */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Smooth step interpolation (Hermite)
 */
export function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

/**
 * Smoother step interpolation (Perlin)
 */
export function smootherstep(edge0: number, edge1: number, x: number): number {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * t * (t * (t * 6 - 15) + 10);
}

/**
 * Normalize a value from one range to another
 */
export function normalize(
  value: number,
  inMin: number,
  inMax: number,
  outMin: number = 0,
  outMax: number = 1
): number {
  return ((value - inMin) / (inMax - inMin)) * (outMax - outMin) + outMin;
}

/**
 * Calculate Euclidean distance between two points
 */
export function distance(x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calculate Manhattan distance between two points
 */
export function manhattanDistance(x1: number, y1: number, x2: number, y2: number): number {
  return Math.abs(x2 - x1) + Math.abs(y2 - y1);
}

/**
 * Convert 2D coordinates to 1D index
 */
export function coordToIndex(x: number, y: number, width: number): number {
  return y * width + x;
}

/**
 * Convert 1D index to 2D coordinates
 */
export function indexToCoord(index: number, width: number): { x: number; y: number } {
  return {
    x: index % width,
    y: Math.floor(index / width),
  };
}

/**
 * Calculate gradient at a point using neighboring values
 */
export function gradient(
  data: Float32Array,
  x: number,
  y: number,
  width: number,
  height: number
): { dx: number; dy: number } {
  const left = x > 0 ? data[coordToIndex(x - 1, y, width)] : data[coordToIndex(x, y, width)];
  const right = x < width - 1 ? data[coordToIndex(x + 1, y, width)] : data[coordToIndex(x, y, width)];
  const up = y > 0 ? data[coordToIndex(x, y - 1, width)] : data[coordToIndex(x, y, width)];
  const down = y < height - 1 ? data[coordToIndex(x, y + 1, width)] : data[coordToIndex(x, y, width)];

  return {
    dx: (right - left) / 2,
    dy: (down - up) / 2,
  };
}

/**
 * Apply Gaussian blur to a 2D array
 */
export function gaussianBlur(
  data: Float32Array,
  width: number,
  height: number,
  radius: number = 1
): Float32Array {
  const result = new Float32Array(data.length);
  const kernel = createGaussianKernel(radius);
  const kernelSize = radius * 2 + 1;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let sum = 0;
      let weightSum = 0;

      for (let ky = -radius; ky <= radius; ky++) {
        for (let kx = -radius; kx <= radius; kx++) {
          const nx = clamp(x + kx, 0, width - 1);
          const ny = clamp(y + ky, 0, height - 1);
          const weight = kernel[(ky + radius) * kernelSize + (kx + radius)];
          sum += data[coordToIndex(nx, ny, width)] * weight;
          weightSum += weight;
        }
      }

      result[coordToIndex(x, y, width)] = sum / weightSum;
    }
  }

  return result;
}

/**
 * Create a Gaussian kernel
 */
function createGaussianKernel(radius: number): Float32Array {
  const size = radius * 2 + 1;
  const kernel = new Float32Array(size * size);
  const sigma = radius / 3;
  const s = 2 * sigma * sigma;
  let sum = 0;

  for (let y = -radius; y <= radius; y++) {
    for (let x = -radius; x <= radius; x++) {
      const r = x * x + y * y;
      const value = Math.exp(-r / s) / (Math.PI * s);
      kernel[(y + radius) * size + (x + radius)] = value;
      sum += value;
    }
  }

  // Normalize
  for (let i = 0; i < kernel.length; i++) {
    kernel[i] /= sum;
  }

  return kernel;
}

/**
 * Find local minima in a heightmap
 */
export function findLocalMinima(
  data: Float32Array,
  width: number,
  height: number
): { x: number; y: number }[] {
  const minima: { x: number; y: number }[] = [];

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const current = data[coordToIndex(x, y, width)];
      let isMinimum = true;

      for (let dy = -1; dy <= 1 && isMinimum; dy++) {
        for (let dx = -1; dx <= 1 && isMinimum; dx++) {
          if (dx === 0 && dy === 0) continue;
          if (data[coordToIndex(x + dx, y + dy, width)] < current) {
            isMinimum = false;
          }
        }
      }

      if (isMinimum) {
        minima.push({ x, y });
      }
    }
  }

  return minima;
}
