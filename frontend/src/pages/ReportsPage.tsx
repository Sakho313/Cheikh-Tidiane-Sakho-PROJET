import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { reportsApi } from '@/api/reports';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { OrgSelector } from '@/components/OrgSelector';
import { LoadingBlock } from '@/components/ui/Spinner';
import { Table, THead, TBody, TR, TH, TD, EmptyRow } from '@/components/ui/Table';
import { useSelectedOrg } from '@/hooks/useSelectedOrg';
import { extractErrorMessage } from '@/api/client';
import { reportTypeLabels, formatDateTime } from '@/lib/labels';
import type { ReportType } from '@/types';

const reportTypes: ReportType[] = ['COMPLIANCE', 'INCIDENT', 'RISK', 'AUDIT', 'EXECUTIVE'];

const reportTypeTone: Record<ReportType, 'green' | 'orange' | 'red' | 'blue' | 'gray'> = {
  COMPLIANCE: 'green',
  INCIDENT: 'red',
  RISK: 'orange',
  AUDIT: 'blue',
  EXECUTIVE: 'gray',
};

export function ReportsPage() {
  const [orgId, setOrgId] = useSelectedOrg();
  const queryClient = useQueryClient();
  const [selectedType, setSelectedType] = useState<ReportType>('EXECUTIVE');
  const [error, setError] = useState<string | null>(null);

  const listQuery = useQuery({
    queryKey: ['reports', orgId],
    queryFn: () => reportsApi.list(orgId as string, { limit: 100 }),
    enabled: Boolean(orgId),
  });

  const generateMutation = useMutation({
    mutationFn: () =>
      reportsApi.generate({ organizationId: orgId as string, type: selectedType }),
    onSuccess: () => {
      setError(null);
      void queryClient.invalidateQueries({ queryKey: ['reports', orgId] });
    },
    onError: (err) => setError(extractErrorMessage(err)),
  });

  const reports = listQuery.data?.data ?? [];

  return (
    <div>
      <PageHeader
        title="Rapports"
        description="Génération de rapports de conformité, incidents, risques et synthèses"
        actions={<OrgSelector value={orgId} onChange={setOrgId} />}
      />

      {!orgId ? (
        <Card>
          <p className="text-sm text-gray-500">Sélectionnez une organisation.</p>
        </Card>
      ) : (
        <>
          <Card title="Générer un rapport">
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <label htmlFor="report-type" className="form-label">
                  Type de rapport
                </label>
                <select
                  id="report-type"
                  className="form-input w-64"
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value as ReportType)}
                >
                  {reportTypes.map((type) => (
                    <option key={type} value={type}>
                      {reportTypeLabels[type]}
                    </option>
                  ))}
                </select>
              </div>
              <Button
                isLoading={generateMutation.isPending}
                onClick={() => generateMutation.mutate()}
              >
                Générer
              </Button>
            </div>
            {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
          </Card>

          <div className="mt-6">
            {listQuery.isLoading ? (
              <LoadingBlock />
            ) : (
              <Table>
                <THead>
                  <TR>
                    <TH>Titre</TH>
                    <TH>Type</TH>
                    <TH>Généré le</TH>
                    <TH>Par</TH>
                  </TR>
                </THead>
                <TBody>
                  {reports.length === 0 ? (
                    <EmptyRow colSpan={4} message="Aucun rapport généré." />
                  ) : (
                    reports.map((report) => (
                      <TR key={report.id} className="hover:bg-gray-50">
                        <TD className="font-medium text-gray-800">{report.title}</TD>
                        <TD>
                          <Badge tone={reportTypeTone[report.type]}>
                            {reportTypeLabels[report.type]}
                          </Badge>
                        </TD>
                        <TD className="whitespace-nowrap text-gray-600">
                          {formatDateTime(report.createdAt)}
                        </TD>
                        <TD className="text-gray-600">
                          {report.generatedBy
                            ? `${report.generatedBy.firstName} ${report.generatedBy.lastName}`
                            : '—'}
                        </TD>
                      </TR>
                    ))
                  )}
                </TBody>
              </Table>
            )}
          </div>
        </>
      )}
    </div>
  );
}
