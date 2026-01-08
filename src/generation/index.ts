import { generateHeightmap } from './terrain/heightmap';
import { applyErosion, applyThermalErosion } from './terrain/erosion';
import { generateClimate } from './climate';
import { generateBiomes } from './climate/biomes';
import { generateRivers, carveRiversIntoHeightmap } from './hydrology/rivers';
import { generateSettlements } from './civilization/settlements';
import { applyNames } from './naming';
import { generateSeed } from '../utils/random';
import type { MapConfig, MapData, GenerationProgress, MapType, MapSize } from '../types';
import { MAP_SIZE_CONFIG, DEFAULT_MAP_CONFIG } from '../constants';

export interface GenerationOptions {
  config: Partial<MapConfig>;
  onProgress?: (progress: GenerationProgress) => void;
}

/**
 * Generate a complete map with all features
 */
export async function generateMap(options: GenerationOptions): Promise<MapData> {
  const { onProgress } = options;

  // Merge with defaults
  const config: MapConfig = {
    ...DEFAULT_MAP_CONFIG,
    ...options.config,
    seed: options.config.seed || generateSeed(),
  };

  // Apply map size dimensions
  const sizeConfig = MAP_SIZE_CONFIG[config.mapSize];
  config.width = sizeConfig.width;
  config.height = sizeConfig.height;

  const report = async (phase: string, progress: number, message: string) => {
    onProgress?.({ phase, progress, message });
    // Yield to allow UI to update
    await new Promise(resolve => setTimeout(resolve, 10));
  };

  // Phase 1: Generate heightmap
  await report('Heightmap', 0.1, 'Generating terrain...');
  let heightmap = generateHeightmap({
    width: config.width,
    height: config.height,
    seed: config.seed,
    mapType: config.mapType,
    seaLevel: config.seaLevel,
    roughness: config.roughness,
    waterCoverage: config.waterCoverage,
  });

  // Phase 2: Apply erosion
  await report('Erosion', 0.25, 'Simulating erosion...');
  heightmap = applyErosion(heightmap, config.seed, {
    width: config.width,
    height: config.height,
    iterations: Math.floor(config.width * config.height * 0.1),
  });

  // Apply thermal erosion for more realistic slopes
  heightmap = applyThermalErosion(heightmap, config.width, config.height, 5);

  // Phase 3: Generate climate
  await report('Climate', 0.4, 'Calculating climate...');
  const { temperature, moisture } = generateClimate({
    width: config.width,
    height: config.height,
    seed: config.seed,
    heightmap,
    seaLevel: config.seaLevel,
  });

  // Phase 4: Assign biomes
  await report('Biomes', 0.5, 'Distributing biomes...');
  const biomes = generateBiomes({
    width: config.width,
    height: config.height,
    heightmap,
    temperature,
    moisture,
    seaLevel: config.seaLevel,
    seed: config.seed,
  });

  // Phase 5: Generate rivers
  await report('Rivers', 0.6, 'Carving rivers...');
  const riverCount = Math.floor(config.width / 50);
  const rivers = generateRivers({
    width: config.width,
    height: config.height,
    seed: config.seed,
    heightmap,
    moisture,
    seaLevel: config.seaLevel,
    riverCount,
    minRiverLength: 15,
  });

  // Carve rivers into heightmap
  carveRiversIntoHeightmap(heightmap, rivers, config.width);

  // Phase 6: Place settlements
  await report('Settlements', 0.75, 'Placing settlements...');
  const settlements = generateSettlements({
    width: config.width,
    height: config.height,
    seed: config.seed,
    heightmap,
    moisture,
    biomes,
    rivers,
    seaLevel: config.seaLevel,
    density: config.settlementDensity,
  });

  // Phase 7: Generate names
  await report('Names', 0.9, 'Generating names...');
  applyNames(config.seed, settlements, rivers);

  // Done
  report('Complete', 1, 'Map generation complete!');

  return {
    config,
    heightmap,
    moisture,
    temperature,
    biomes,
    rivers,
    settlements,
    pois: [],
    roads: [],
  };
}

/**
 * Quick generate with minimal options
 */
export function quickGenerate(
  mapType: MapType = 'island',
  mapSize: MapSize = 'regional'
): Promise<MapData> {
  return generateMap({
    config: {
      mapType,
      mapSize,
    },
  });
}

// Re-export types and utilities
export type { GenerationProgress, MapConfig, MapData };
export { generateSeed };
