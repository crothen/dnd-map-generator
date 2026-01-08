import { SeededRandom } from '../../utils/random';
import { coordToIndex, distance } from '../../utils/math';
import type { Settlement, SettlementSize, River } from '../../types';
import { SETTLEMENT_POPULATIONS } from '../../constants';

export interface SettlementOptions {
  width: number;
  height: number;
  seed: string;
  heightmap: Float32Array;
  moisture: Float32Array;
  biomes: Uint8Array;
  rivers: River[];
  seaLevel: number;
  density: number; // 0-1, affects number of settlements
}

// Biome IDs (must match biomes.ts)
const BIOME_OCEAN = 0;
const BIOME_BEACH = 1;
const BIOME_MOUNTAIN = 8;
const BIOME_SNOW = 7;

/**
 * Generate settlements based on terrain suitability
 */
export function generateSettlements(options: SettlementOptions): Settlement[] {
  const {
    width,
    height,
    seed,
    heightmap,
    moisture,
    biomes,
    rivers,
    seaLevel,
    density,
  } = options;

  const rng = new SeededRandom(seed + '_settlements');
  const settlements: Settlement[] = [];

  // Calculate suitability scores for all land cells
  const suitability = calculateSuitability(width, height, heightmap, moisture, biomes, rivers, seaLevel);

  // Determine number of settlements based on map size and density
  const mapArea = width * height;
  const landCells = countLandCells(biomes);
  const baseCount = Math.floor((landCells / mapArea) * density * 50);
  const settlementCount = Math.max(3, Math.min(baseCount, 100));

  // Place settlements using weighted random selection
  const placedPositions: { x: number; y: number }[] = [];
  const minDistance = Math.sqrt(mapArea / settlementCount) * 0.5;

  for (let attempt = 0; attempt < settlementCount * 10 && settlements.length < settlementCount; attempt++) {
    // Find a suitable location
    const location = findSettlementLocation(
      width,
      height,
      suitability,
      placedPositions,
      minDistance,
      rng
    );

    if (location) {
      const size = determineSettlementSize(
        location.x,
        location.y,
        width,
        suitability,
        rivers,
        biomes,
        seaLevel,
        rng
      );

      const settlement: Settlement = {
        id: rng.uuid(),
        name: '', // Will be named later
        x: location.x,
        y: location.y,
        size,
        population: generatePopulation(size, rng),
        type: determineSettlementType(location.x, location.y, width, biomes, rivers, seaLevel, heightmap),
      };

      settlements.push(settlement);
      placedPositions.push(location);
    }
  }

  // Sort by population (largest first)
  settlements.sort((a, b) => b.population - a.population);

  return settlements;
}

/**
 * Calculate suitability score for each cell
 */
function calculateSuitability(
  width: number,
  height: number,
  heightmap: Float32Array,
  moisture: Float32Array,
  biomes: Uint8Array,
  rivers: River[],
  _seaLevel: number
): Float32Array {
  const suitability = new Float32Array(width * height);

  // Create river proximity map
  const riverProximity = new Float32Array(width * height);
  for (const river of rivers) {
    for (const segment of river.segments) {
      const rx = Math.floor(segment.x);
      const ry = Math.floor(segment.y);
      const radius = 10;

      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const nx = rx + dx;
          const ny = ry + dy;
          if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
            const dist = Math.sqrt(dx * dx + dy * dy);
            const value = Math.max(0, 1 - dist / radius);
            const idx = coordToIndex(nx, ny, width);
            riverProximity[idx] = Math.max(riverProximity[idx], value);
          }
        }
      }
    }
  }

  // Create coast proximity map
  const coastProximity = new Float32Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = coordToIndex(x, y, width);
      if (biomes[idx] === BIOME_OCEAN) continue;

      // Check neighbors for ocean
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
            if (biomes[coordToIndex(nx, ny, width)] === BIOME_OCEAN) {
              coastProximity[idx] = 1;
            }
          }
        }
      }
    }
  }

  // Calculate suitability for each cell
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = coordToIndex(x, y, width);
      const biome = biomes[idx];

      // Ocean and extreme biomes are unsuitable
      if (biome === BIOME_OCEAN || biome === BIOME_MOUNTAIN || biome === BIOME_SNOW) {
        suitability[idx] = 0;
        continue;
      }

      const elevation = heightmap[idx];
      const moist = moisture[idx];

      // Base suitability from terrain
      let score = 0.5;

      // Prefer moderate elevations
      const elevationScore = 1 - Math.abs(elevation - 0.4) * 2;
      score += elevationScore * 0.2;

      // Prefer areas with water access
      score += riverProximity[idx] * 0.3;
      score += coastProximity[idx] * 0.25;

      // Prefer areas with good moisture (for agriculture)
      score += moist * 0.1;

      // Beach bonus for ports
      if (biome === BIOME_BEACH) {
        score += 0.15;
      }

      suitability[idx] = Math.max(0, Math.min(1, score));
    }
  }

  return suitability;
}

/**
 * Find a suitable location for a new settlement
 */
function findSettlementLocation(
  width: number,
  height: number,
  suitability: Float32Array,
  placedPositions: { x: number; y: number }[],
  minDistance: number,
  rng: SeededRandom
): { x: number; y: number } | null {
  // Use weighted random sampling
  const candidates: { x: number; y: number; weight: number }[] = [];

  const step = Math.max(2, Math.floor(width / 100));

  for (let y = step; y < height - step; y += step) {
    for (let x = step; x < width - step; x += step) {
      const idx = coordToIndex(x, y, width);
      const score = suitability[idx];

      if (score < 0.3) continue;

      // Check distance from existing settlements
      let tooClose = false;
      for (const pos of placedPositions) {
        if (distance(x, y, pos.x, pos.y) < minDistance) {
          tooClose = true;
          break;
        }
      }

      if (!tooClose) {
        candidates.push({ x, y, weight: score * score });
      }
    }
  }

  if (candidates.length === 0) return null;

  // Weighted random selection
  const totalWeight = candidates.reduce((sum, c) => sum + c.weight, 0);
  let random = rng.next() * totalWeight;

  for (const candidate of candidates) {
    random -= candidate.weight;
    if (random <= 0) {
      return { x: candidate.x, y: candidate.y };
    }
  }

  return candidates[candidates.length - 1];
}

/**
 * Determine settlement size based on location quality
 */
function determineSettlementSize(
  x: number,
  y: number,
  width: number,
  suitability: Float32Array,
  rivers: River[],
  biomes: Uint8Array,
  _seaLevel: number,
  rng: SeededRandom
): SettlementSize {
  const idx = coordToIndex(x, y, width);
  const score = suitability[idx];

  // Check for special conditions that favor larger settlements
  const nearRiverMouth = isNearRiverMouth(x, y, rivers, 20);
  const isCoastal = biomes[idx] === BIOME_BEACH;
  const nearMajorRiver = isNearMajorRiver(x, y, rivers, 15);

  let sizeScore = score;
  if (nearRiverMouth) sizeScore += 0.3;
  if (isCoastal) sizeScore += 0.2;
  if (nearMajorRiver) sizeScore += 0.15;

  // Random factor
  sizeScore += (rng.next() - 0.5) * 0.3;

  if (sizeScore > 0.9) return 'metropolis';
  if (sizeScore > 0.8) return 'large_city';
  if (sizeScore > 0.7) return 'small_city';
  if (sizeScore > 0.6) return 'large_town';
  if (sizeScore > 0.5) return 'small_town';
  if (sizeScore > 0.4) return 'village';
  if (sizeScore > 0.3) return 'hamlet';
  return 'thorp';
}

/**
 * Generate population based on settlement size
 */
function generatePopulation(size: SettlementSize, rng: SeededRandom): number {
  const range = SETTLEMENT_POPULATIONS[size];
  return rng.int(range.min, range.max);
}

/**
 * Determine settlement type based on surroundings
 */
function determineSettlementType(
  x: number,
  y: number,
  width: number,
  biomes: Uint8Array,
  rivers: River[],
  _seaLevel: number,
  heightmap: Float32Array
): string {
  const idx = coordToIndex(x, y, width);
  const biome = biomes[idx];
  const elevation = heightmap[idx];

  if (biome === BIOME_BEACH) {
    return 'port';
  }

  if (isNearMajorRiver(x, y, rivers, 10)) {
    return 'river_town';
  }

  if (elevation > 0.6) {
    return 'mountain_town';
  }

  // Check surrounding biomes
  // (simplified - could be expanded)
  return 'farming_village';
}

/**
 * Check if a location is near a river mouth
 */
function isNearRiverMouth(x: number, y: number, rivers: River[], maxDist: number): boolean {
  for (const river of rivers) {
    if (river.segments.length === 0) continue;
    const mouth = river.segments[river.segments.length - 1];
    if (distance(x, y, mouth.x, mouth.y) < maxDist) {
      return true;
    }
  }
  return false;
}

/**
 * Check if a location is near a major river
 */
function isNearMajorRiver(x: number, y: number, rivers: River[], maxDist: number): boolean {
  for (const river of rivers) {
    if (river.segments.length < 20) continue; // Only check longer rivers
    for (const segment of river.segments) {
      if (distance(x, y, segment.x, segment.y) < maxDist) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Count land cells (not ocean)
 */
function countLandCells(biomes: Uint8Array): number {
  let count = 0;
  for (let i = 0; i < biomes.length; i++) {
    if (biomes[i] !== BIOME_OCEAN) count++;
  }
  return count;
}
