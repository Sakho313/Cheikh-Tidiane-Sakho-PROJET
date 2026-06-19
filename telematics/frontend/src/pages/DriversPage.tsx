import { useQuery } from '@tanstack/react-query';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { driversApi } from '@/api/drivers';
import { analyticsApi } from '@/api/analytics';
import { extractErrorMessage } from '@/api/client';
import { PageHeader, Spinner, ErrorState, Table, Th, Td, Badge, Card, EmptyState } from '@/components/ui';
import { formatNumber, scoreColor } from '@/lib/labels';

export default function DriversPage(): JSX.Element {
  const driversQ = useQuery({ queryKey: ['drivers'], queryFn: () => driversApi.list({ limit: 100 }) });
  const scoresQ = useQuery({ queryKey: ['driverScores'], queryFn: () => analyticsApi.driverScores() });

  if (driversQ.isLoading) return <div className="grid place-items-center py-20"><Spinner /></div>;
  if (driversQ.error || !driversQ.data) return <ErrorState message={extractErrorMessage(driversQ.error)} />;

  const drivers = driversQ.data.data;
  const ranking = scoresQ.data?.drivers ?? [];
  const chartData = ranking.slice(0, 10).map((r) => ({
    name: `${r.firstName} ${r.lastName.charAt(0)}.`,
    score: r.score,
  }));

  return (
    <div>
      <PageHeader title="Chauffeurs" subtitle={`${drivers.length} chauffeur(s)`} />

      {chartData.length > 0 && (
        <Card className="mb-6">
          <h3 className="mb-4 text-sm font-semibold text-slate-700">
            Classement des scores de conduite
          </h3>
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer>
              <BarChart data={chartData} layout="vertical" margin={{ left: 40 }}>
                <XAxis type="number" domain={[0, 100]} fontSize={12} />
                <YAxis type="category" dataKey="name" width={80} fontSize={12} />
                <Tooltip />
                <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                  {chartData.map((d) => (
                    <Cell key={d.name} fill={scoreColor(d.score)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      {drivers.length === 0 ? (
        <EmptyState message="Aucun chauffeur." />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Nom</Th>
              <Th>Permis</Th>
              <Th>Téléphone</Th>
              <Th>Score</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {drivers.map((d) => (
              <tr key={d.id}>
                <Td className="font-medium text-slate-900">{`${d.firstName} ${d.lastName}`}</Td>
                <Td>{d.licenseNumber}</Td>
                <Td>{d.phone ?? '—'}</Td>
                <Td>
                  <Badge className="text-white" >
                    <span style={{ color: scoreColor(d.behaviorScore) }}>
                      {formatNumber(d.behaviorScore, 0)}
                    </span>
                  </Badge>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
}
