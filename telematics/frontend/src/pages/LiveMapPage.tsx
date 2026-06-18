import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { telemetryApi } from '@/api/telemetry';
import { useLivePositions } from '@/hooks/useLivePositions';
import FleetMap from '@/components/map/FleetMap';
import { PageHeader, Spinner, ErrorState, Card } from '@/components/ui';
import { extractErrorMessage } from '@/api/client';
import { formatNumber } from '@/lib/labels';
import type { MapMarker } from '@/lib/maps/types';

export default function LiveMapPage(): JSX.Element {
  const { data, isLoading, error } = useQuery({
    queryKey: ['live'],
    queryFn: () => telemetryApi.live(),
    refetchInterval: 15_000,
  });
  const live = useLivePositions();

  const rows = useMemo(() => {
    if (!data) return [];
    return data.map((row) => {
      const lp = live.get(row.vehicle.id);
      const lat = lp?.latitude ?? row.position?.latitude ?? null;
      const lng = lp?.longitude ?? row.position?.longitude ?? null;
      const speed = lp?.speedKmh ?? row.position?.speedKmh ?? 0;
      return { vehicle: row.vehicle, lat, lng, speed };
    });
  }, [data, live]);

  const markers: MapMarker[] = useMemo(
    () =>
      rows
        .filter((r): r is typeof r & { lat: number; lng: number } => r.lat !== null && r.lng !== null)
        .map((r) => ({
          id: r.vehicle.id,
          lat: r.lat,
          lng: r.lng,
          label: `${r.vehicle.plate} — ${formatNumber(r.speed)} km/h`,
          color: r.speed > 3 ? '#16a34a' : '#64748b',
        })),
    [rows],
  );

  if (isLoading) return <div className="grid place-items-center py-20"><Spinner /></div>;
  if (error) return <ErrorState message={extractErrorMessage(error)} />;

  return (
    <div>
      <PageHeader title="Carte live" subtitle="Position des véhicules en temps réel (WebSocket)" />
      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        <Card className="overflow-hidden p-0">
          <FleetMap markers={markers} height="72vh" />
        </Card>
        <Card className="max-h-[72vh] overflow-y-auto">
          <h3 className="mb-3 text-sm font-semibold text-slate-700">
            Véhicules ({markers.length})
          </h3>
          <ul className="space-y-2">
            {rows.map((r) => (
              <li
                key={r.vehicle.id}
                className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2 text-sm"
              >
                <span className="font-medium text-slate-800">{r.vehicle.plate}</span>
                <span className={r.speed > 3 ? 'text-green-600' : 'text-slate-400'}>
                  {formatNumber(r.speed)} km/h
                </span>
              </li>
            ))}
            {rows.length === 0 && <li className="text-sm text-slate-400">Aucun véhicule localisé.</li>}
          </ul>
        </Card>
      </div>
    </div>
  );
}
