import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reportsApi } from '@/api/reports';
import { apiClient, extractErrorMessage } from '@/api/client';
import { PageHeader, Spinner, ErrorState, Table, Th, Td, Badge, Button, Card, EmptyState } from '@/components/ui';
import { formatDate } from '@/lib/labels';
import type { ReportType } from '@/types';

const REPORT_TYPES: Array<{ value: ReportType; label: string }> = [
  { value: 'EXECUTIVE', label: 'Synthèse exécutive' },
  { value: 'DRIVER_BEHAVIOR', label: 'Comportement de conduite' },
  { value: 'FUEL', label: 'Carburant' },
  { value: 'FLEET_UTILIZATION', label: 'Utilisation de la flotte' },
  { value: 'TRIP', label: 'Trajets' },
  { value: 'SAFETY', label: 'Sécurité' },
  { value: 'MAINTENANCE', label: 'Entretien' },
];

export default function ReportsPage(): JSX.Element {
  const qc = useQueryClient();
  const [type, setType] = useState<ReportType>('EXECUTIVE');

  const listQ = useQuery({ queryKey: ['reports'], queryFn: () => reportsApi.list({ limit: 100 }) });
  const gen = useMutation({
    mutationFn: () => reportsApi.generate({ type }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reports'] }),
  });

  async function download(id: string, format: 'csv' | 'xlsx' | 'pdf'): Promise<void> {
    const res = await apiClient.get(`/reports/${id}/export`, {
      params: { format },
      responseType: 'blob',
    });
    const url = URL.createObjectURL(res.data as Blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rapport-${id}.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <PageHeader title="Rapports" subtitle="Génération et export (CSV / Excel / PDF)" />

      <Card className="mb-6">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Type de rapport</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as ReportType)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            >
              {REPORT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <Button onClick={() => gen.mutate()} disabled={gen.isPending}>
            {gen.isPending ? 'Génération…' : 'Générer'}
          </Button>
          {gen.isError && <ErrorState message={extractErrorMessage(gen.error)} />}
        </div>
      </Card>

      {listQ.isLoading ? (
        <div className="grid place-items-center py-20"><Spinner /></div>
      ) : listQ.error || !listQ.data ? (
        <ErrorState message={extractErrorMessage(listQ.error)} />
      ) : listQ.data.data.length === 0 ? (
        <EmptyState message="Aucun rapport généré." />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Titre</Th>
              <Th>Type</Th>
              <Th>Généré le</Th>
              <Th>Export</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {listQ.data.data.map((r) => (
              <tr key={r.id}>
                <Td className="font-medium text-slate-900">{r.title}</Td>
                <Td>
                  <Badge>{r.type}</Badge>
                </Td>
                <Td>{formatDate(r.createdAt)}</Td>
                <Td>
                  <div className="flex gap-2">
                    {(['csv', 'xlsx', 'pdf'] as const).map((f) => (
                      <Button key={f} variant="ghost" onClick={() => void download(r.id, f)}>
                        {f.toUpperCase()}
                      </Button>
                    ))}
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
