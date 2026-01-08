import { useMapStore } from '../../store/mapStore';
import { VIEW_MODE_LABELS } from '../../constants';
import type { ViewMode } from '../../types';

export function ViewControls() {
  const viewMode = useMapStore((state) => state.viewMode);
  const showGrid = useMapStore((state) => state.showGrid);
  const showLabels = useMapStore((state) => state.showLabels);
  const showRivers = useMapStore((state) => state.showRivers);
  const showSettlements = useMapStore((state) => state.showSettlements);
  const mapData = useMapStore((state) => state.mapData);

  const setViewMode = useMapStore((state) => state.setViewMode);
  const toggleGrid = useMapStore((state) => state.toggleGrid);
  const toggleLabels = useMapStore((state) => state.toggleLabels);
  const toggleRivers = useMapStore((state) => state.toggleRivers);
  const toggleSettlements = useMapStore((state) => state.toggleSettlements);
  const resetView = useMapStore((state) => state.resetView);

  if (!mapData) return null;

  return (
    <div className="bg-parchment-100 p-4 rounded-lg shadow-lg border border-parchment-300">
      <h2 className="text-xl font-fantasy text-parchment-900 mb-4">View Options</h2>

      {/* View Mode Selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-parchment-800 mb-2">
          View Mode
        </label>
        <div className="grid grid-cols-2 gap-2">
          {(['illustrated', 'heightmap', 'biome', 'political', 'temperature', 'precipitation'] as ViewMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-3 py-2 text-sm rounded-md transition-colors ${
                viewMode === mode
                  ? 'bg-forest-600 text-white'
                  : 'bg-white hover:bg-parchment-200 text-parchment-800 border border-parchment-300'
              }`}
            >
              {VIEW_MODE_LABELS[mode]}
            </button>
          ))}
        </div>
      </div>

      {/* Layer Toggles */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-parchment-800 mb-2">
          Layers
        </label>
        <div className="space-y-2">
          <ToggleSwitch label="Rivers" checked={showRivers} onChange={toggleRivers} />
          <ToggleSwitch label="Settlements" checked={showSettlements} onChange={toggleSettlements} />
          <ToggleSwitch label="Labels" checked={showLabels} onChange={toggleLabels} />
          <ToggleSwitch label="Grid" checked={showGrid} onChange={toggleGrid} />
        </div>
      </div>

      {/* Reset View Button */}
      <button
        onClick={resetView}
        className="w-full py-2 px-4 bg-parchment-200 hover:bg-parchment-300 text-parchment-800 rounded-md transition-colors flex items-center justify-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
        Reset View
      </button>
    </div>
  );
}

function ToggleSwitch({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex items-center justify-between cursor-pointer">
      <span className="text-sm text-parchment-700">{label}</span>
      <button
        onClick={onChange}
        className={`relative w-10 h-5 rounded-full transition-colors ${
          checked ? 'bg-forest-500' : 'bg-parchment-300'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </label>
  );
}
