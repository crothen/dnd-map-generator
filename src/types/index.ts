// Map Types
export type MapType =
  | 'island'
  | 'archipelago'
  | 'peninsula'
  | 'continent'
  | 'inland'
  | 'coastal'
  | 'isthmus'
  | 'atoll'
  | 'delta'
  | 'fjord'
  | 'great-lake';

export type MapSize = 'local' | 'regional' | 'kingdom' | 'continental';

export type ViewMode =
  | 'illustrated'
  | 'heightmap'
  | 'topographic'
  | 'satellite'
  | 'political'
  | 'physical'
  | 'temperature'
  | 'precipitation'
  | 'biome';

export type BiomeType =
  | 'ocean'
  | 'beach'
  | 'grassland'
  | 'forest'
  | 'rainforest'
  | 'desert'
  | 'tundra'
  | 'snow'
  | 'mountain'
  | 'swamp'
  | 'lake';

export type SettlementSize =
  | 'thorp'
  | 'hamlet'
  | 'village'
  | 'small_town'
  | 'large_town'
  | 'small_city'
  | 'large_city'
  | 'metropolis';

// Map Configuration
export interface MapConfig {
  seed: string;
  mapType: MapType;
  mapSize: MapSize;
  width: number;
  height: number;
  seaLevel: number;
  roughness: number;
  waterCoverage: number;
  forestDensity: number;
  settlementDensity: number;
}

// Map Size Configurations
export const MAP_SIZE_CONFIG: Record<MapSize, { width: number; height: number; scale: string }> = {
  local: { width: 256, height: 256, scale: '5-10 miles' },
  regional: { width: 512, height: 512, scale: '50-100 miles' },
  kingdom: { width: 1024, height: 1024, scale: '200-500 miles' },
  continental: { width: 2048, height: 2048, scale: '1000+ miles' },
};

// Settlement
export interface Settlement {
  id: string;
  name: string;
  x: number;
  y: number;
  size: SettlementSize;
  population: number;
  type: string;
}

// Point of Interest
export interface PointOfInterest {
  id: string;
  name: string;
  x: number;
  y: number;
  type: string;
  description?: string;
}

// River
export interface RiverSegment {
  x: number;
  y: number;
  flow: number;
}

export interface River {
  id: string;
  name: string;
  segments: RiverSegment[];
}

// Road
export interface Road {
  id: string;
  name: string;
  points: { x: number; y: number }[];
  type: 'path' | 'road' | 'highway';
}

// Generated Map Data
export interface MapData {
  config: MapConfig;
  heightmap: Float32Array;
  moisture: Float32Array;
  temperature: Float32Array;
  biomes: Uint8Array;
  rivers: River[];
  settlements: Settlement[];
  pois: PointOfInterest[];
  roads: Road[];
}

// View State
export interface ViewState {
  mode: ViewMode;
  zoom: number;
  panX: number;
  panY: number;
  showGrid: boolean;
  showLabels: boolean;
}

// Generation Progress
export interface GenerationProgress {
  phase: string;
  progress: number;
  message: string;
}

// Export Options
export interface ExportOptions {
  format: 'png' | 'jpeg' | 'svg' | 'json';
  width: number;
  height: number;
  dpi: number;
  includeGrid: boolean;
  includeLabels: boolean;
}

// Biome Configuration
export interface BiomeConfig {
  name: string;
  color: string;
  minElevation: number;
  maxElevation: number;
  minMoisture: number;
  maxMoisture: number;
  minTemperature: number;
  maxTemperature: number;
}

export const BIOME_CONFIGS: Record<BiomeType, BiomeConfig> = {
  ocean: {
    name: 'Ocean',
    color: '#006994',
    minElevation: -1,
    maxElevation: 0.3,
    minMoisture: 0,
    maxMoisture: 1,
    minTemperature: -1,
    maxTemperature: 1,
  },
  beach: {
    name: 'Beach',
    color: '#e8d68c',
    minElevation: 0.3,
    maxElevation: 0.35,
    minMoisture: 0,
    maxMoisture: 1,
    minTemperature: -1,
    maxTemperature: 1,
  },
  grassland: {
    name: 'Grassland',
    color: '#8db360',
    minElevation: 0.35,
    maxElevation: 0.6,
    minMoisture: 0.2,
    maxMoisture: 0.5,
    minTemperature: 0.2,
    maxTemperature: 0.8,
  },
  forest: {
    name: 'Forest',
    color: '#228b22',
    minElevation: 0.35,
    maxElevation: 0.7,
    minMoisture: 0.5,
    maxMoisture: 0.8,
    minTemperature: 0.2,
    maxTemperature: 0.7,
  },
  rainforest: {
    name: 'Rainforest',
    color: '#006400',
    minElevation: 0.35,
    maxElevation: 0.6,
    minMoisture: 0.8,
    maxMoisture: 1,
    minTemperature: 0.6,
    maxTemperature: 1,
  },
  desert: {
    name: 'Desert',
    color: '#edc9af',
    minElevation: 0.35,
    maxElevation: 0.6,
    minMoisture: 0,
    maxMoisture: 0.2,
    minTemperature: 0.5,
    maxTemperature: 1,
  },
  tundra: {
    name: 'Tundra',
    color: '#c9d4c5',
    minElevation: 0.35,
    maxElevation: 0.7,
    minMoisture: 0.2,
    maxMoisture: 0.6,
    minTemperature: -1,
    maxTemperature: 0.2,
  },
  snow: {
    name: 'Snow',
    color: '#fffafa',
    minElevation: 0.8,
    maxElevation: 1,
    minMoisture: 0,
    maxMoisture: 1,
    minTemperature: -1,
    maxTemperature: 0.1,
  },
  mountain: {
    name: 'Mountain',
    color: '#8b8589',
    minElevation: 0.7,
    maxElevation: 1,
    minMoisture: 0,
    maxMoisture: 1,
    minTemperature: -1,
    maxTemperature: 1,
  },
  swamp: {
    name: 'Swamp',
    color: '#2f4f2f',
    minElevation: 0.3,
    maxElevation: 0.4,
    minMoisture: 0.8,
    maxMoisture: 1,
    minTemperature: 0.3,
    maxTemperature: 0.9,
  },
  lake: {
    name: 'Lake',
    color: '#4169e1',
    minElevation: 0.35,
    maxElevation: 0.5,
    minMoisture: 0.9,
    maxMoisture: 1,
    minTemperature: -1,
    maxTemperature: 1,
  },
};
