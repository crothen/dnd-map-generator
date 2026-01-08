import { coordToIndex } from '../../utils/math';
import type { BiomeType } from '../../types';
import { SeededRandom } from '../../utils/random';
import { createNoise2D } from 'simplex-noise';

export interface BiomeOptions {
  width: number;
  height: number;
  heightmap: Float32Array;
  temperature: Float32Array;
  moisture: Float32Array;
  seaLevel: number;
  seed: string; // Add seed to options
}

// Biome type enum values for Uint8Array storage
export const BIOME_IDS: Record<BiomeType, number> = {
  ocean: 0,
  beach: 1,
  grassland: 2,
  forest: 3,
  rainforest: 4,
  desert: 5,
  tundra: 6,
  snow: 7,
  mountain: 8,
  swamp: 9,
  lake: 10,
};

export const ID_TO_BIOME: BiomeType[] = [
  'ocean',
  'beach',
  'grassland',
  'forest',
  'rainforest',
  'desert',
  'tundra',
  'snow',
  'mountain',
  'swamp',
  'lake',
];

/**
 * Assign biomes based on elevation, temperature, and moisture
 * Uses a Whittaker-style biome classification
 */
export function generateBiomes(options: BiomeOptions): Uint8Array {
  const { width, height, heightmap, temperature, moisture, seaLevel, seed } = options;
  const biomes = new Uint8Array(width * height);

  // Use seeded random for deterministic jitter
  const rng = new SeededRandom(seed + '_biomes');
  const noise = createNoise2D(() => rng.next());

  const beachLevel = seaLevel + 0.03;
  const mountainLevel = 0.7;
  const snowLevel = 0.85;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = coordToIndex(x, y, width);

      // Jitter inputs to break up strict bands
      // Noise scale is medium frequency for localized patches (not pixelated)
      const jitterT = noise(x / 60, y / 60) * 0.08; // +/- 0.08 temperature
      const jitterM = noise(x / 60 + 100, y / 60 + 100) * 0.08; // +/- 0.08 moisture

      const elevation = heightmap[idx];
      // Clamp inputs after jitter to keep them valid
      const temp = Math.max(0, Math.min(1, temperature[idx] + jitterT));
      const moist = Math.max(0, Math.min(1, moisture[idx] + jitterM));

      // Coastal variation:
      // Occasionally allow forests/cliffs to touch the water by virtually increasing elevation check for "beach"
      // If noise is high, beach threshold drops, making it harder to be a beach
      const beachNoise = noise(x / 20, y / 20);
      const beachThreshold = beachLevel - (beachNoise > 0.6 ? 0.02 : 0); // Shrink beach in some spots

      biomes[idx] = classifyBiome(elevation, temp, moist, seaLevel, beachThreshold, mountainLevel, snowLevel);
    }
  }

  return biomes;
}

/**
 * Classify a single cell's biome based on its characteristics
 */
function classifyBiome(
  elevation: number,
  temperature: number,
  moisture: number,
  seaLevel: number,
  beachLevel: number,
  mountainLevel: number,
  snowLevel: number
): number {
  // Ocean
  if (elevation < seaLevel) {
    return BIOME_IDS.ocean;
  }

  // Beach (near sea level)
  if (elevation < beachLevel) {
    return BIOME_IDS.beach;
  }

  // High mountains with snow
  if (elevation > snowLevel || (elevation > mountainLevel && temperature < 0.2)) {
    return BIOME_IDS.snow;
  }

  // Mountain
  if (elevation > mountainLevel) {
    return BIOME_IDS.mountain;
  }

  // Land biomes based on temperature and moisture
  // Cold regions
  if (temperature < 0.2) {
    if (moisture > 0.5) {
      return BIOME_IDS.snow;
    }
    return BIOME_IDS.tundra;
  }

  // Cool regions
  if (temperature < 0.4) {
    if (moisture > 0.6) {
      return BIOME_IDS.forest;
    }
    if (moisture > 0.3) {
      return BIOME_IDS.grassland;
    }
    return BIOME_IDS.tundra;
  }

  // Temperate regions
  if (temperature < 0.7) {
    if (moisture > 0.8) {
      if (elevation < seaLevel + 0.1) {
        return BIOME_IDS.swamp;
      }
      return BIOME_IDS.forest;
    }
    if (moisture > 0.4) {
      return BIOME_IDS.forest;
    }
    if (moisture > 0.2) {
      return BIOME_IDS.grassland;
    }
    return BIOME_IDS.desert;
  }

  // Hot regions
  if (moisture > 0.7) {
    if (elevation < seaLevel + 0.1) {
      return BIOME_IDS.swamp;
    }
    return BIOME_IDS.rainforest;
  }
  if (moisture > 0.4) {
    return BIOME_IDS.forest;
  }
  if (moisture > 0.2) {
    return BIOME_IDS.grassland;
  }
  return BIOME_IDS.desert;
}

/**
 * Get biome color for rendering
 */
export function getBiomeColor(biomeId: number): string {
  const colors: Record<number, string> = {
    [BIOME_IDS.ocean]: '#006994',
    [BIOME_IDS.beach]: '#e8d68c',
    [BIOME_IDS.grassland]: '#8db360',
    [BIOME_IDS.forest]: '#228b22',
    [BIOME_IDS.rainforest]: '#006400',
    [BIOME_IDS.desert]: '#edc9af',
    [BIOME_IDS.tundra]: '#c9d4c5',
    [BIOME_IDS.snow]: '#fffafa',
    [BIOME_IDS.mountain]: '#8b8589',
    [BIOME_IDS.swamp]: '#2f4f2f',
    [BIOME_IDS.lake]: '#4169e1',
  };

  return colors[biomeId] || '#000000';
}

/**
 * Get biome name
 */
export function getBiomeName(biomeId: number): string {
  return ID_TO_BIOME[biomeId] || 'unknown';
}
