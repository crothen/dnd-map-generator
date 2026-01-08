import { SeededRandom } from '../../utils/random';
import { coordToIndex } from '../../utils/math';
import type { River, RiverSegment } from '../../types';

export interface RiverOptions {
  width: number;
  height: number;
  seed: string;
  heightmap: Float32Array;
  moisture: Float32Array;
  seaLevel: number;
  riverCount: number;
  minRiverLength: number;
}

/**
 * Generate rivers that flow from high elevations to the sea
 */
export function generateRivers(options: RiverOptions): River[] {
  const {
    width,
    height,
    seed,
    heightmap,
    moisture,
    seaLevel,
    riverCount,
    minRiverLength,
  } = options;

  const rng = new SeededRandom(seed + '_rivers');
  const rivers: River[] = [];
  const usedCells = new Set<number>();

  // Find potential river sources (high elevation, high moisture areas)
  const sources = findRiverSources(width, height, heightmap, moisture, seaLevel, rng, riverCount * 3);

  for (const source of sources) {
    if (rivers.length >= riverCount) break;

    const river = traceRiver(
      source.x,
      source.y,
      width,
      height,
      heightmap,
      seaLevel,
      usedCells,
      rng
    );

    if (river.segments.length >= minRiverLength) {
      river.id = rng.uuid();
      river.name = ''; // Will be named later
      rivers.push(river);

      // Mark cells as used
      for (const seg of river.segments) {
        usedCells.add(coordToIndex(Math.floor(seg.x), Math.floor(seg.y), width));
      }
    }
  }

  // Calculate river flow (cumulative)
  for (const river of rivers) {
    calculateRiverFlow(river);
  }

  return rivers;
}

/**
 * Find suitable river source locations
 */
function findRiverSources(
  width: number,
  height: number,
  heightmap: Float32Array,
  moisture: Float32Array,
  seaLevel: number,
  rng: SeededRandom,
  count: number
): { x: number; y: number; score: number }[] {
  const candidates: { x: number; y: number; score: number }[] = [];

  // Sample the map for potential sources
  const sampleStep = Math.max(4, Math.floor(width / 50));

  for (let y = sampleStep; y < height - sampleStep; y += sampleStep) {
    for (let x = sampleStep; x < width - sampleStep; x += sampleStep) {
      const idx = coordToIndex(x, y, width);
      const elevation = heightmap[idx];
      const moist = moisture[idx];

      // River sources should be at high elevation with decent moisture
      if (elevation > seaLevel + 0.3 && elevation < 0.9) {
        const score = elevation * 0.5 + moist * 0.5 + rng.next() * 0.2;
        candidates.push({ x, y, score });
      }
    }
  }

  // Sort by score and return top candidates
  candidates.sort((a, b) => b.score - a.score);
  return candidates.slice(0, count);
}

/**
 * Trace a river from source to sea using gradient descent
 */
function traceRiver(
  startX: number,
  startY: number,
  width: number,
  height: number,
  heightmap: Float32Array,
  seaLevel: number,
  usedCells: Set<number>,
  rng: SeededRandom
): River {
  const segments: RiverSegment[] = [];
  let x = startX;
  let y = startY;
  const maxSteps = width + height;
  let lastIdx = -1;

  for (let step = 0; step < maxSteps; step++) {
    const intX = Math.floor(x);
    const intY = Math.floor(y);

    if (intX < 1 || intX >= width - 1 || intY < 1 || intY >= height - 1) {
      break;
    }

    const idx = coordToIndex(intX, intY, width);
    const elevation = heightmap[idx];

    // Reached the ocean
    if (elevation < seaLevel) {
      segments.push({ x, y, flow: 1 });
      break;
    }

    // Avoid already-used cells (except for joins)
    if (usedCells.has(idx) && idx !== lastIdx) {
      break;
    }

    segments.push({ x, y, flow: 1 });
    lastIdx = idx;

    // Find the steepest descent direction
    const { nextX, nextY } = findSteepestDescent(intX, intY, width, height, heightmap, rng);

    if (nextX === intX && nextY === intY) {
      // Stuck in local minimum - try to escape
      const escaped = escapeLocalMinimum(intX, intY, width, height, heightmap, seaLevel);
      if (escaped) {
        x = escaped.x;
        y = escaped.y;
      } else {
        break;
      }
    } else {
      x = nextX + (rng.next() - 0.5) * 0.3;
      y = nextY + (rng.next() - 0.5) * 0.3;
    }
  }

  return { id: '', name: '', segments };
}

/**
 * Find the direction of steepest descent from a point
 */
function findSteepestDescent(
  x: number,
  y: number,
  width: number,
  height: number,
  heightmap: Float32Array,
  rng: SeededRandom
): { nextX: number; nextY: number } {
  const currentHeight = heightmap[coordToIndex(x, y, width)];
  let lowestHeight = currentHeight;
  let nextX = x;
  let nextY = y;

  // Check 8 neighbors
  const neighbors = [
    { dx: -1, dy: 0 },
    { dx: 1, dy: 0 },
    { dx: 0, dy: -1 },
    { dx: 0, dy: 1 },
    { dx: -1, dy: -1 },
    { dx: 1, dy: -1 },
    { dx: -1, dy: 1 },
    { dx: 1, dy: 1 },
  ];

  // Shuffle neighbors for some randomness in equal cases
  rng.shuffle(neighbors);

  for (const { dx, dy } of neighbors) {
    const nx = x + dx;
    const ny = y + dy;

    if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;

    const neighborHeight = heightmap[coordToIndex(nx, ny, width)];
    if (neighborHeight < lowestHeight) {
      lowestHeight = neighborHeight;
      nextX = nx;
      nextY = ny;
    }
  }

  return { nextX, nextY };
}

/**
 * Try to escape a local minimum by finding a path to lower elevation
 */
function escapeLocalMinimum(
  x: number,
  y: number,
  width: number,
  height: number,
  heightmap: Float32Array,
  seaLevel: number
): { x: number; y: number } | null {
  // Simple BFS to find a path to lower elevation or sea
  const queue: { x: number; y: number; depth: number }[] = [{ x, y, depth: 0 }];
  const visited = new Set<number>();
  const startHeight = heightmap[coordToIndex(x, y, width)];
  const maxDepth = 20;

  while (queue.length > 0) {
    const current = queue.shift()!;

    if (current.depth > maxDepth) continue;

    const idx = coordToIndex(current.x, current.y, width);
    if (visited.has(idx)) continue;
    visited.add(idx);

    const currentHeight = heightmap[idx];

    // Found lower ground or sea
    if (currentHeight < startHeight || currentHeight < seaLevel) {
      return { x: current.x, y: current.y };
    }

    // Add neighbors
    const neighbors = [
      { dx: -1, dy: 0 },
      { dx: 1, dy: 0 },
      { dx: 0, dy: -1 },
      { dx: 0, dy: 1 },
    ];

    for (const { dx, dy } of neighbors) {
      const nx = current.x + dx;
      const ny = current.y + dy;

      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        queue.push({ x: nx, y: ny, depth: current.depth + 1 });
      }
    }
  }

  return null;
}

/**
 * Calculate cumulative flow for river (wider near mouth)
 */
function calculateRiverFlow(river: River): void {
  const length = river.segments.length;
  for (let i = 0; i < length; i++) {
    // Flow increases toward the end (mouth)
    river.segments[i].flow = 0.3 + (i / length) * 0.7;
  }
}

/**
 * Carve rivers into the heightmap (optional visual enhancement)
 */
export function carveRiversIntoHeightmap(
  heightmap: Float32Array,
  rivers: River[],
  width: number,
  carveDepth: number = 0.02
): void {
  for (const river of rivers) {
    for (const segment of river.segments) {
      const x = Math.floor(segment.x);
      const y = Math.floor(segment.y);

      if (x >= 0 && x < width && y >= 0 && y < heightmap.length / width) {
        const idx = coordToIndex(x, y, width);
        const carve = carveDepth * segment.flow;
        heightmap[idx] = Math.max(0, heightmap[idx] - carve);
      }
    }
  }
}
