// Default map configuration
export const DEFAULT_MAP_CONFIG = {
  seed: '',
  mapType: 'island' as const,
  mapSize: 'regional' as const,
  width: 512,
  height: 512,
  seaLevel: 0.35,
  roughness: 0.6,
  waterCoverage: 0.4,
  forestDensity: 0.5,
  settlementDensity: 0.3,
};

// Generation phases
export const GENERATION_PHASES = [
  'Initializing',
  'Generating Heightmap',
  'Applying Erosion',
  'Calculating Climate',
  'Distributing Biomes',
  'Carving Rivers',
  'Placing Settlements',
  'Generating Names',
  'Finalizing',
] as const;

// View mode labels
export const VIEW_MODE_LABELS = {
  illustrated: 'Illustrated',
  heightmap: 'Heightmap',
  topographic: 'Topographic',
  satellite: 'Satellite',
  political: 'Political',
  physical: 'Physical',
  temperature: 'Temperature',
  precipitation: 'Precipitation',
  biome: 'Biome',
} as const;

// Map type labels
export const MAP_TYPE_LABELS = {
  island: 'Island',
  archipelago: 'Archipelago',
  peninsula: 'Peninsula',
  continent: 'Continent',
  inland: 'Inland Region',
  coastal: 'Coastal Region',
  isthmus: 'Isthmus',
  atoll: 'Atoll',
  delta: 'Delta',
  fjord: 'Fjord Coast',
  'great-lake': 'Great Lake',
} as const;

// Map size labels
export const MAP_SIZE_LABELS = {
  local: 'Local (5-10 miles)',
  regional: 'Regional (50-100 miles)',
  kingdom: 'Kingdom (200-500 miles)',
  continental: 'Continental (1000+ miles)',
} as const;

// Map size configurations
export const MAP_SIZE_CONFIG = {
  local: { width: 256, height: 256, scale: '5-10 miles' },
  regional: { width: 512, height: 512, scale: '50-100 miles' },
  kingdom: { width: 1024, height: 1024, scale: '200-500 miles' },
  continental: { width: 2048, height: 2048, scale: '1000+ miles' },
} as const;

// Settlement population ranges
export const SETTLEMENT_POPULATIONS = {
  thorp: { min: 20, max: 80 },
  hamlet: { min: 81, max: 400 },
  village: { min: 401, max: 900 },
  small_town: { min: 901, max: 2000 },
  large_town: { min: 2001, max: 5000 },
  small_city: { min: 5001, max: 12000 },
  large_city: { min: 12001, max: 25000 },
  metropolis: { min: 25001, max: 100000 },
} as const;

// Color palettes for different view modes
export const COLOR_PALETTES = {
  heightmap: {
    deep: '#000033',
    shallow: '#0066aa',
    shore: '#4488bb',
    lowland: '#88aa55',
    midland: '#447722',
    highland: '#885533',
    mountain: '#997766',
    peak: '#ffffff',
  },
  temperature: {
    freezing: '#0000ff',
    cold: '#00aaff',
    cool: '#00ffff',
    mild: '#00ff00',
    warm: '#ffff00',
    hot: '#ff8800',
    scorching: '#ff0000',
  },
  precipitation: {
    arid: '#ffeecc',
    dry: '#ddcc88',
    moderate: '#88aa44',
    wet: '#448844',
    rainforest: '#226644',
  },
} as const;

// Noise parameters for different terrain types
export const NOISE_PARAMS = {
  continental: { octaves: 6, persistence: 0.5, lacunarity: 2.0, scale: 200 },
  regional: { octaves: 5, persistence: 0.55, lacunarity: 2.0, scale: 100 },
  detail: { octaves: 4, persistence: 0.6, lacunarity: 2.0, scale: 50 },
  moisture: { octaves: 4, persistence: 0.5, lacunarity: 2.0, scale: 150 },
} as const;
