import { useState } from 'react';
import { ID_TO_BIOME, getBiomeColor } from '../../generation/climate/biomes';

const BIOME_LABELS: Record<string, string> = {
  ocean: 'Ocean',
  beach: 'Beach',
  grassland: 'Grassland',
  forest: 'Forest',
  rainforest: 'Rainforest',
  desert: 'Desert',
  tundra: 'Tundra',
  snow: 'Snow',
  mountain: 'Mountain',
  swamp: 'Swamp',
  lake: 'Lake',
};

export function MapLegend() {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="absolute bottom-4 right-4 bg-slate-800/90 backdrop-blur-sm rounded-lg shadow-lg border border-slate-700 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="w-full px-3 py-2 flex items-center justify-between text-parchment-100 hover:bg-slate-700/50 transition-colors"
      >
        <span className="text-sm font-medium">Terrain</span>
        <svg
          className={`w-4 h-4 transition-transform ${isCollapsed ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Legend Items */}
      {!isCollapsed && (
        <div className="px-3 pb-3 grid grid-cols-2 gap-x-4 gap-y-1">
          {ID_TO_BIOME.map((biome, idx) => (
            <div key={biome} className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded border border-slate-600 flex-shrink-0"
                style={{ backgroundColor: getBiomeColor(idx) }}
              />
              <span className="text-xs text-parchment-200 whitespace-nowrap">
                {BIOME_LABELS[biome] || biome}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
