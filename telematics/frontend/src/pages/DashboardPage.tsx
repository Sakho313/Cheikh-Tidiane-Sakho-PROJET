import { useQuery } from '@tanstack/react-query';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { analyticsApi } from '@/api/analytics';
import { extractErrorMessage } from '@/api/client';
import { PageHeader, StatCard, Spinner, ErrorState, Card } from '@/components/ui';
import { formatNumber, scoreColor, severityColors } from '@/lib/labels';
import type { AlertSeverity } from '@/types';

const SEVERITIES: AlertSeverity[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

export default function DashboardPage(): JSX.Element {
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => analyticsApi.dashboard(),
  });

  if (isLoading) return <div className="grid place-items-center py-20"><Spinner /></div>;
  if (error || !data) return <ErrorState message={extractErrorMessage(error)} />;

  const sevData = SEVERITIES.map((s) => ({
    name: s,
    value: data.alerts.bySeverity[s] ?? 0,
    color: severityColors[s],
  }));

  return (
    <div>
      <PageHeader title="Tableau de bord" subtitle="Vue d'ensemble de la flotte" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Véhicules" value={formatNumber(data.vehicles.total)} hint={`${data.vehicles.byStatus.ACTIVE ?? 0} actifs`} />
        <StatCard label="Trajets en cours" value={formatNumber(data.activeTrips)} />
        <StatCard label="Alertes ouvertes" value={formatNumber(data.alerts.open)} accent="text-red-600" />
        <StatCard
          label="Score moyen conduite"
          value={formatNumber(data.avgDriverScore, 1)}
          accent=""
          hint="sur 100"
        />
        <StatCard label="Distance aujourd'hui" value={`${formatNumber(data.distanceTodayKm, 1)} km`} />
        <StatCard label="Coût carburant (mois)" value={`${formatNumber(data.fuelCostThisMonth)} XOF`} />
        <StatCard label="Conduite brusque (jour)" value={formatNumber(data.harshEventsToday)} accent="text-orange-600" />
        <StatCard
          label="Indice flotte"
          value={formatNumber(data.avgDriverScore, 0)}
          accent=""
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <h3 className="mb-4 text-sm font-semibold text-slate-700">Alertes ouvertes par sévérité</h3>
          <div style={{ width: '100%', height: 240 }}>
            <ResponsiveContainer>
              <BarChart data={sevData}>
                <XAxis dataKey="name" fontSize={12} />
                <YAxis allowDecimals={false} fontSize={12} />
                <Tooltip />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {sevData.map((d) => (
                    <Cell key={d.name} fill={d.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card>
          <h3 className="mb-2 text-sm font-semibold text-slate-700">Score moyen de la flotte</h3>
          <div className="flex h-[240px] flex-col items-center justify-center">
            <div
              className="text-6xl font-bold"
              style={{ color: scoreColor(data.avgDriverScore) }}
            >
              {formatNumber(data.avgDriverScore, 0)}
            </div>
            <p className="mt-2 text-sm text-slate-500">sur 100</p>
          </div>
        </Card>
      </div>
    </div>
  );
}
