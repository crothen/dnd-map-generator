import { useEffect, useRef, useState } from 'react';
import { MapRenderer } from '../../canvas/MapRenderer';
import { useMapStore } from '../../store/mapStore';
import { MapLegend } from './MapLegend';

export function MapCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<MapRenderer | null>(null);
  const [isReady, setIsReady] = useState(false);

  const mapData = useMapStore((state) => state.mapData);
  const viewMode = useMapStore((state) => state.viewMode);
  const showRivers = useMapStore((state) => state.showRivers);
  const showSettlements = useMapStore((state) => state.showSettlements);
  const showLabels = useMapStore((state) => state.showLabels);
  const showGrid = useMapStore((state) => state.showGrid);
  const isGenerating = useMapStore((state) => state.isGenerating);
  const generationProgress = useMapStore((state) => state.generationProgress);

  // Initialize renderer
  useEffect(() => {
    if (!containerRef.current) return;

    const renderer = new MapRenderer({
      container: containerRef.current,
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
    });

    rendererRef.current = renderer;

    renderer.init().then(() => {
      setIsReady(true);
    });

    // Handle resize
    const handleResize = () => {
      if (containerRef.current) {
        renderer.resize(
          containerRef.current.clientWidth,
          containerRef.current.clientHeight
        );
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      rendererRef.current = null;
      setIsReady(false);
      renderer.destroy();
    };
  }, []);

  // Update map data
  useEffect(() => {
    if (isReady && rendererRef.current && mapData) {
      rendererRef.current.setMapData(mapData);
    }
  }, [isReady, mapData]);

  // Update view mode
  useEffect(() => {
    if (isReady && rendererRef.current) {
      rendererRef.current.setViewMode(viewMode);
    }
  }, [isReady, viewMode]);

  // Update visibility toggles
  useEffect(() => {
    if (isReady && rendererRef.current) {
      rendererRef.current.setShowRivers(showRivers);
    }
  }, [isReady, showRivers]);

  useEffect(() => {
    if (isReady && rendererRef.current) {
      rendererRef.current.setShowSettlements(showSettlements);
    }
  }, [isReady, showSettlements]);

  useEffect(() => {
    if (isReady && rendererRef.current) {
      rendererRef.current.setShowLabels(showLabels);
    }
  }, [isReady, showLabels]);

  useEffect(() => {
    if (isReady && rendererRef.current) {
      rendererRef.current.setShowGrid(showGrid);
    }
  }, [isReady, showGrid]);

  return (
    <div className="relative w-full h-full" style={{ minHeight: '400px' }}>
      <div
        ref={containerRef}
        className="w-full h-full bg-slate-900"
      />

      {/* Loading Overlay */}
      {isGenerating && (
        <div className="absolute inset-0 bg-slate-900/80 flex flex-col items-center justify-center">
          {/* Spinner */}
          <div className="relative w-20 h-20 mb-6">
            <div className="absolute inset-0 border-4 border-parchment-200/20 rounded-full" />
            <div className="absolute inset-0 border-4 border-transparent border-t-forest-500 rounded-full animate-spin" />
            <div className="absolute inset-2 border-4 border-transparent border-t-forest-400 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
          </div>

          {/* Progress Info */}
          {generationProgress && (
            <div className="text-center max-w-xs">
              <p className="text-parchment-100 font-medium mb-2">
                {generationProgress.phase}
              </p>

              {/* Progress Bar */}
              <div className="w-64 h-2 bg-slate-700 rounded-full overflow-hidden mb-2">
                <div
                  className="h-full bg-gradient-to-r from-forest-600 to-forest-400 transition-all duration-300"
                  style={{ width: `${generationProgress.progress * 100}%` }}
                />
              </div>

              <p className="text-parchment-300 text-sm">
                {generationProgress.message}
              </p>
              <p className="text-parchment-400 text-xs mt-1">
                {Math.round(generationProgress.progress * 100)}%
              </p>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {!isGenerating && !mapData && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-parchment-400">
          <svg className="w-16 h-16 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
          <p className="text-lg">No map generated</p>
          <p className="text-sm opacity-75">Configure options and click Generate Map</p>
        </div>
      )}

      {/* Terrain Legend */}
      {!isGenerating && mapData && <MapLegend />}
    </div>
  );
}
