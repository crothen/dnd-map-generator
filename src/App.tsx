import { MapCanvas } from './components/map/MapCanvas';
import { GenerationPanel } from './components/controls/GenerationPanel';
import { ViewControls } from './components/controls/ViewControls';
import { MapInfo } from './components/controls/MapInfo';
import { ExportButton } from './components/export/ExportButton';
import { useMapStore } from './store/mapStore';

export function App() {
  const error = useMapStore((state) => state.error);

  return (
    <div className="h-screen bg-slate-900 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-parchment-900 text-parchment-100 py-4 px-6 shadow-lg">
        <div className="max-w-screen-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <svg className="w-8 h-8 text-forest-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            <div>
              <h1 className="text-2xl font-fantasy font-bold">D&D Realm Cartographer</h1>
              <p className="text-sm text-parchment-300">Procedural Fantasy Map Generator</p>
            </div>
          </div>

          <nav className="flex items-center gap-4 text-sm">
            <span className="text-parchment-400">Pan: Click + Drag</span>
            <span className="text-parchment-400">Zoom: Scroll</span>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex min-h-0">
        {/* Sidebar */}
        <aside className="w-80 bg-slate-800 p-4 space-y-4 overflow-y-auto custom-scrollbar flex-shrink-0">
          <GenerationPanel />
          <ViewControls />
          <MapInfo />
          <ExportButton />
        </aside>

        {/* Map Area */}
        <div className="flex-1 relative">
          {/* Error Message */}
          {error && (
            <div className="absolute top-4 left-4 right-4 bg-red-900/90 text-red-100 px-4 py-3 rounded-lg shadow-lg z-20">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{error}</span>
              </div>
            </div>
          )}

          {/* Map Canvas */}
          <MapCanvas />
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-800 text-parchment-400 py-2 px-6 text-sm text-center">
        D&D Realm Cartographer - Procedural Fantasy Map Generator
      </footer>
    </div>
  );
}
