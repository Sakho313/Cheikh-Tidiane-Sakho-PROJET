import { useQuery } from '@tanstack/react-query';
import { fuelApi } from '@/api/fuel';
import { extractErrorMessage } from '@/api/client';
import { PageHeader, Spinner, ErrorState, Table, Th, Td, Card, StatCard, EmptyState, Badge } from '@/components/ui';
import { fuelTypeLabels, formatDate, formatNumber } from '@/lib/labels';

export default function FuelPage(): JSX.Element {
  const recordsQ = useQuery({ queryKey: ['fuel'], queryFn: () => fuelApi.list({ limit: 100 }) });
  const statsQ = useQuery({ queryKey: ['fuel-stats'], queryFn: () => fuelApi.stats() });
  const theftQ = useQuery({ queryKey: ['fuel-theft'], queryFn: () => fuelApi.theftDetection() });

  if (recordsQ.isLoading) return <div className="grid place-items-center py-20"><Spinner /></div>;
  if (recordsQ.error || !recordsQ.data) return <ErrorState message={extractErrorMessage(recordsQ.error)} />;

  const stats = statsQ.data;
  const theft = theftQ.data ?? [];

  return (
    <div>
      <PageHeader title="Carburant" subtitle="Pleins, consommation et détection de vol" />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Total litres" value={formatNumber(stats?.totalLiters ?? 0, 1)} />
        <StatCard label="Coût total" value={`${formatNumber(stats?.totalCost ?? 0)} XOF`} />
        <StatCard
          label="Alertes vol carburant"
          value={formatNumber(theft.length)}
          accent={theft.length > 0 ? 'text-red-600' : 'text-slate-900'}
        />
      </div>

      {theft.length > 0 && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <h3 className="mb-3 text-sm font-semibold text-red-800">⚠️ Vols de carburant suspectés</h3>
          <ul className="space-y-1 text-sm text-red-700">
            {theft.slice(0, 10).map((t, i) => (
              <li key={i}>
                {formatDate(t.timestamp)} · véhicule {t.vehicleId.slice(0, 8)} · chute de{' '}
                {formatNumber(t.dropLiters, 1)} L ({t.type})
              </li>
            ))}
          </ul>
        </Card>
      )}

      {recordsQ.data.data.length === 0 ? (
        <EmptyState message="Aucun enregistrement de carburant." />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Date</Th>
              <Th>Type</Th>
              <Th>Litres</Th>
              <Th>Coût</Th>
              <Th>Station</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {recordsQ.data.data.map((r) => (
              <tr key={r.id}>
                <Td>{formatDate(r.timestamp)}</Td>
                <Td>
                  <Badge>{fuelTypeLabels[r.type]}</Badge>
                </Td>
                <Td>{formatNumber(r.liters, 1)} L</Td>
                <Td>{r.totalCost ? `${formatNumber(r.totalCost)} ${r.currency}` : '—'}</Td>
                <Td>{r.stationName ?? '—'}</Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
}
