import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { alertsApi } from '@/api/alerts';
import { extractErrorMessage } from '@/api/client';
import { PageHeader, Spinner, ErrorState, Table, Th, Td, Badge, Button, EmptyState } from '@/components/ui';
import { alertStatusLabels, severityClasses, formatDate } from '@/lib/labels';

export default function AlertsPage(): JSX.Element {
  const qc = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ['alerts'],
    queryFn: () => alertsApi.list({ limit: 100 }),
  });

  const ack = useMutation({
    mutationFn: (id: string) => alertsApi.acknowledge(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['alerts'] }),
  });
  const resolve = useMutation({
    mutationFn: (id: string) => alertsApi.resolve(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['alerts'] }),
  });

  if (isLoading) return <div className="grid place-items-center py-20"><Spinner /></div>;
  if (error || !data) return <ErrorState message={extractErrorMessage(error)} />;

  return (
    <div>
      <PageHeader title="Alertes" subtitle={`${data.total} alerte(s)`} />
      {data.data.length === 0 ? (
        <EmptyState message="Aucune alerte." />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Date</Th>
              <Th>Type</Th>
              <Th>Sévérité</Th>
              <Th>Message</Th>
              <Th>Statut</Th>
              <Th>Actions</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.data.map((a) => (
              <tr key={a.id}>
                <Td>{formatDate(a.timestamp)}</Td>
                <Td className="font-medium text-slate-900">{a.title}</Td>
                <Td>
                  <Badge className={severityClasses[a.severity]}>{a.severity}</Badge>
                </Td>
                <Td>{a.message ?? '—'}</Td>
                <Td>
                  <Badge>{alertStatusLabels[a.status]}</Badge>
                </Td>
                <Td>
                  <div className="flex gap-2">
                    {a.status === 'OPEN' && (
                      <Button variant="secondary" onClick={() => ack.mutate(a.id)}>
                        Acquitter
                      </Button>
                    )}
                    {a.status !== 'RESOLVED' && (
                      <Button variant="primary" onClick={() => resolve.mutate(a.id)}>
                        Résoudre
                      </Button>
                    )}
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
}
