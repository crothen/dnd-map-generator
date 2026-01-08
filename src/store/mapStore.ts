import { create } from 'zustand';
import { generateMap, generateSeed } from '../generation';
import type { MapConfig, MapData, ViewMode, GenerationProgress, MapType, MapSize } from '../types';
import { DEFAULT_MAP_CONFIG } from '../constants';

interface MapState {
  // Map data
  mapData: MapData | null;
  isGenerating: boolean;
  generationProgress: GenerationProgress | null;
  error: string | null;

  // Configuration
  config: MapConfig;

  // View state
  viewMode: ViewMode;
  zoom: number;
  panX: number;
  panY: number;
  showGrid: boolean;
  showLabels: boolean;
  showRivers: boolean;
  showSettlements: boolean;

  // Actions
  setConfig: (config: Partial<MapConfig>) => void;
  setMapType: (mapType: MapType) => void;
  setMapSize: (mapSize: MapSize) => void;
  setSeed: (seed: string) => void;
  randomizeSeed: () => void;
  generate: () => Promise<void>;
  setViewMode: (mode: ViewMode) => void;
  setZoom: (zoom: number) => void;
  setPan: (x: number, y: number) => void;
  resetView: () => void;
  toggleGrid: () => void;
  toggleLabels: () => void;
  toggleRivers: () => void;
  toggleSettlements: () => void;
}

export const useMapStore = create<MapState>((set, get) => ({
  // Initial state
  mapData: null,
  isGenerating: false,
  generationProgress: null,
  error: null,

  config: { ...DEFAULT_MAP_CONFIG, seed: generateSeed() },

  viewMode: 'illustrated',
  zoom: 1,
  panX: 0,
  panY: 0,
  showGrid: false,
  showLabels: true,
  showRivers: true,
  showSettlements: true,

  // Configuration actions
  setConfig: (config) => {
    set((state) => ({
      config: { ...state.config, ...config },
    }));
  },

  setMapType: (mapType) => {
    set((state) => ({
      config: { ...state.config, mapType },
    }));
  },

  setMapSize: (mapSize) => {
    set((state) => ({
      config: { ...state.config, mapSize },
    }));
  },

  setSeed: (seed) => {
    set((state) => ({
      config: { ...state.config, seed },
    }));
  },

  randomizeSeed: () => {
    set((state) => ({
      config: { ...state.config, seed: generateSeed() },
    }));
  },

  // Generation
  generate: async () => {
    const { config } = get();

    set({
      isGenerating: true,
      error: null,
      generationProgress: { phase: 'Starting', progress: 0, message: 'Initializing...' },
    });

    try {
      const mapData = await generateMap({
        config,
        onProgress: (progress) => {
          set({ generationProgress: progress });
        },
      });

      set({
        mapData,
        isGenerating: false,
        generationProgress: null,
      });
    } catch (err) {
      set({
        isGenerating: false,
        error: err instanceof Error ? err.message : 'Unknown error occurred',
        generationProgress: null,
      });
    }
  },

  // View actions
  setViewMode: (viewMode) => {
    set({ viewMode });
  },

  setZoom: (zoom) => {
    set({ zoom: Math.max(0.1, Math.min(10, zoom)) });
  },

  setPan: (panX, panY) => {
    set({ panX, panY });
  },

  resetView: () => {
    set({ zoom: 1, panX: 0, panY: 0 });
  },

  toggleGrid: () => {
    set((state) => ({ showGrid: !state.showGrid }));
  },

  toggleLabels: () => {
    set((state) => ({ showLabels: !state.showLabels }));
  },

  toggleRivers: () => {
    set((state) => ({ showRivers: !state.showRivers }));
  },

  toggleSettlements: () => {
    set((state) => ({ showSettlements: !state.showSettlements }));
  },
}));
