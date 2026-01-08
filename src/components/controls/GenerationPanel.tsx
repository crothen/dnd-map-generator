import { useMapStore } from '../../store/mapStore';
import { MAP_TYPE_LABELS, MAP_SIZE_LABELS } from '../../constants';
import type { MapType, MapSize } from '../../types';

export function GenerationPanel() {
  const config = useMapStore((state) => state.config);
  const isGenerating = useMapStore((state) => state.isGenerating);
  const generationProgress = useMapStore((state) => state.generationProgress);

  const setMapType = useMapStore((state) => state.setMapType);
  const setMapSize = useMapStore((state) => state.setMapSize);
  const setConfig = useMapStore((state) => state.setConfig); // Add setConfig
  const setSeed = useMapStore((state) => state.setSeed);
  const randomizeSeed = useMapStore((state) => state.randomizeSeed);
  const generate = useMapStore((state) => state.generate);

  return (
    <div className="bg-parchment-100 p-4 rounded-lg shadow-lg border border-parchment-300">
      <h2 className="text-xl font-fantasy text-parchment-900 mb-4">Map Configuration</h2>

      {/* Map Type Selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-parchment-800 mb-1">
          Landmass Type
        </label>
        <select
          value={config.mapType}
          onChange={(e) => setMapType(e.target.value as MapType)}
          disabled={isGenerating}
          className="w-full px-3 py-2 bg-white border border-parchment-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-forest-500 focus:border-forest-500"
        >
          {Object.entries(MAP_TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* Map Size Selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-parchment-800 mb-1">
          Map Size
        </label>
        <select
          value={config.mapSize}
          onChange={(e) => setMapSize(e.target.value as MapSize)}
          disabled={isGenerating}
          className="w-full px-3 py-2 bg-white border border-parchment-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-forest-500 focus:border-forest-500"
        >
          {Object.entries(MAP_SIZE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* Water Coverage Slider */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-1">
          <label className="block text-sm font-medium text-parchment-800">
            Water Level
          </label>
          <span className="text-xs text-parchment-600">
            {Math.round(config.waterCoverage * 100)}%
          </span>
        </div>
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={config.waterCoverage}
          onChange={(e) => setConfig({ waterCoverage: parseFloat(e.target.value) })}
          disabled={isGenerating}
          className="w-full h-2 bg-parchment-300 rounded-lg appearance-none cursor-pointer accent-forest-600"
        />
      </div>

      {/* Seed Input */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-parchment-800 mb-1">
          Seed
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={config.seed}
            onChange={(e) => setSeed(e.target.value)}
            disabled={isGenerating}
            className="flex-1 px-3 py-2 bg-white border border-parchment-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-forest-500 focus:border-forest-500"
            placeholder="Enter seed..."
          />
          <button
            onClick={randomizeSeed}
            disabled={isGenerating}
            className="px-3 py-2 bg-parchment-200 hover:bg-parchment-300 border border-parchment-400 rounded-md transition-colors"
            title="Randomize seed"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {/* Generate Button */}
      <button
        onClick={generate}
        disabled={isGenerating}
        className="w-full py-3 px-4 bg-forest-600 hover:bg-forest-700 disabled:bg-forest-400 text-white font-medium rounded-md shadow transition-colors flex items-center justify-center gap-2"
      >
        {isGenerating ? (
          <>
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Generating...
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            Generate Map
          </>
        )}
      </button>

      {/* Progress Bar */}
      {isGenerating && generationProgress && (
        <div className="mt-4">
          <div className="flex justify-between text-sm text-parchment-700 mb-1">
            <span>{generationProgress.phase}</span>
            <span>{Math.round(generationProgress.progress * 100)}%</span>
          </div>
          <div className="h-2 bg-parchment-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-forest-500 transition-all duration-300"
              style={{ width: `${generationProgress.progress * 100}%` }}
            />
          </div>
          <p className="text-xs text-parchment-600 mt-1">{generationProgress.message}</p>
        </div>
      )}
    </div>
  );
}
