import { useState } from 'react';
import { saveAs } from 'file-saver';
import { useMapStore } from '../../store/mapStore';

export function ExportButton() {
  const mapData = useMapStore((state) => state.mapData);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (!mapData) return;

    setIsExporting(true);

    try {
      // Get the canvas element
      const canvas = document.querySelector('canvas');
      if (!canvas) {
        throw new Error('Canvas not found');
      }

      // Convert to blob
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create blob'));
          }
        }, 'image/png');
      });

      // Generate filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const filename = `map-${mapData.config.seed}-${timestamp}.png`;

      // Download
      saveAs(blob, filename);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export map. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportJSON = () => {
    if (!mapData) return;

    // Create a serializable version of the map data
    const exportData = {
      config: mapData.config,
      settlements: mapData.settlements,
      rivers: mapData.rivers.map((r) => ({
        id: r.id,
        name: r.name,
        segmentCount: r.segments.length,
      })),
      pois: mapData.pois,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `map-data-${mapData.config.seed}-${timestamp}.json`;

    saveAs(blob, filename);
  };

  if (!mapData) return null;

  return (
    <div className="bg-parchment-100 p-4 rounded-lg shadow-lg border border-parchment-300">
      <h2 className="text-xl font-fantasy text-parchment-900 mb-4">Export</h2>

      <div className="space-y-2">
        <button
          onClick={handleExport}
          disabled={isExporting}
          className="w-full py-2 px-4 bg-water-600 hover:bg-water-700 disabled:bg-water-400 text-white rounded-md transition-colors flex items-center justify-center gap-2"
        >
          {isExporting ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Exporting...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export as PNG
            </>
          )}
        </button>

        <button
          onClick={handleExportJSON}
          className="w-full py-2 px-4 bg-parchment-200 hover:bg-parchment-300 text-parchment-800 rounded-md transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Export Map Data (JSON)
        </button>
      </div>
    </div>
  );
}
