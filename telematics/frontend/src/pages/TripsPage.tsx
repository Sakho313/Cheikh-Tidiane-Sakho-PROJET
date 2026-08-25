import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { tripsApi } from '@/api/trips';
import { telemetryApi } from '@/api/telemetry';
import { extractErrorMessage } from '@/api/client';
import FleetMap from '@/components/map/FleetMap';
import { PageHeader, Spinner, ErrorState, Table, Th, Td, Badge, Card, EmptyState } from '@/components/ui';
import { tripStatusLabels, formatDate, formatNumber } from '@/lib/labels';
import type { Trip } from '@/types';
import type { MapPolyline } from '@/lib/maps/types';

function durationLabel(seconds: number): string {
  const m = Math.round(seconds / 60);
  if (m < 60) return `${m} min`;
  return `${Math.floor(m / 60)} h ${m % 60} min`;
}

export default function TripsPage(): JSX.Element {
  const [selected, setSelected] = useState<Trip | null>(null);

  const tripsQ = useQuery({ queryKey: ['trips'], queryFn: () => tripsApi.list({ limit: 100 }) });
  const posQ = useQuery({
    queryKey: ['trip-positions', selected?.id],
    queryFn: () =>
      telemetryApi.positions(selected!.vehicleId, {
        from: selected!.startTime,
        to: selected!.endTime ?? undefined,
        limit: 1000,
      }),
    enabled: !!selected,
  });

  if (tripsQ.isLoading) return <div className="grid place-items-center py-20"><Spinner /></div>;
  if (tripsQ.error || !tripsQ.data) return <ErrorState message={extractErrorMessage(tripsQ.error)} />;

  const polylines: MapPolyline[] = posQ.data
    ? [
        {
          id: 'track',
          points: posQ.data.data.map((p) => ({ lat: p.latitude, lng: p.longitude })),
          color: '#2563eb',
        },
      ]
    : [];

  return (
    <div>
      <PageHeader title="Trajets" subtitle={`${tripsQ.data.total} trajet(s)`} />
      <div className="grid gap-4 lg:grid-cols-[1fr_420px]">
        <div>
          {tripsQ.data.data.length === 0 ? (
            <EmptyState message="Aucun trajet." />
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Véhicule</Th>
                  <Th>Début</Th>
                  <Th>Distance</Th>
                  <Th>Durée</Th>
                  <Th>Statut</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tripsQ.data.data.map((t) => (
                  <tr
                    key={t.id}
                    onClick={() => setSelected(t)}
                    className={`cursor-pointer hover:bg-slate-50 ${selected?.id === t.id ? 'bg-blue-50' : ''}`}
                  >
                    <Td className="font-medium text-slate-900">{t.vehicle?.plate ?? '—'}</Td>
                    <Td>{formatDate(t.startTime)}</Td>
                    <Td>{formatNumber(t.distanceKm, 1)} km</Td>
                    <Td>{durationLabel(t.durationS)}</Td>
                    <Td>
                      <Badge>{tripStatusLabels[t.status]}</Badge>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </div>
        <Card className="overflow-hidden p-0">
          {selected ? (
            <div>
              <div className="border-b border-slate-100 p-4">
                <p className="font-semibold text-slate-800">{selected.vehicle?.plate}</p>
                <p className="text-xs text-slate-500">
                  {formatNumber(selected.distanceKm, 1)} km · max {formatNumber(selected.maxSpeedKmh)} km/h ·{' '}
                  {selected.harshEvents} événement(s)
                </p>
              </div>
              {posQ.isLoading ? (
                <div className="grid h-[400px] place-items-center"><Spinner /></div>
              ) : (
                <FleetMap polylines={polylines} height={400} />
              )}
            </div>
          ) : (
            <div className="grid h-[400px] place-items-center text-sm text-slate-400">
              Sélectionnez un trajet pour voir son tracé.
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
