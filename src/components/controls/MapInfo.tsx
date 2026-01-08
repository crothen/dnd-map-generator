import { useMapStore } from '../../store/mapStore';
import { MAP_SIZE_CONFIG } from '../../types';

export function MapInfo() {
  const mapData = useMapStore((state) => state.mapData);

  if (!mapData) return null;

  const { config, settlements, rivers } = mapData;
  const sizeConfig = MAP_SIZE_CONFIG[config.mapSize];

  const totalPopulation = settlements.reduce((sum, s) => sum + s.population, 0);
  const settlementsBySize = settlements.reduce(
    (acc, s) => {
      acc[s.size] = (acc[s.size] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <div className="bg-parchment-100 p-4 rounded-lg shadow-lg border border-parchment-300">
      <h2 className="text-xl font-fantasy text-parchment-900 mb-4">Map Information</h2>

      <div className="space-y-3 text-sm">
        <InfoRow label="Seed" value={config.seed} />
        <InfoRow label="Dimensions" value={`${config.width} x ${config.height}`} />
        <InfoRow label="Scale" value={sizeConfig.scale} />

        <div className="border-t border-parchment-300 pt-3">
          <InfoRow label="Settlements" value={settlements.length.toString()} />
          <InfoRow label="Total Population" value={totalPopulation.toLocaleString()} />
          <InfoRow label="Rivers" value={rivers.length.toString()} />
        </div>

        {settlements.length > 0 && (
          <div className="border-t border-parchment-300 pt-3">
            <p className="text-parchment-600 mb-2">Settlement Breakdown:</p>
            {Object.entries(settlementsBySize)
              .sort((a, b) => b[1] - a[1])
              .map(([size, count]) => (
                <InfoRow
                  key={size}
                  label={formatSettlementSize(size)}
                  value={count.toString()}
                  indent
                />
              ))}
          </div>
        )}

        {settlements.length > 0 && (
          <div className="border-t border-parchment-300 pt-3">
            <p className="text-parchment-600 mb-2">Largest Settlements:</p>
            {settlements.slice(0, 5).map((s) => (
              <InfoRow
                key={s.id}
                label={s.name}
                value={s.population.toLocaleString()}
                indent
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function InfoRow({
  label,
  value,
  indent = false,
}: {
  label: string;
  value: string;
  indent?: boolean;
}) {
  return (
    <div className={`flex justify-between ${indent ? 'pl-2' : ''}`}>
      <span className="text-parchment-600">{label}</span>
      <span className="text-parchment-900 font-medium">{value}</span>
    </div>
  );
}

function formatSettlementSize(size: string): string {
  return size
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
