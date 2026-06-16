import { useQuery } from '@tanstack/react-query';
import { auditsApi } from '@/api/audits';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, StatCard } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { OrgSelector } from '@/components/OrgSelector';
import { LoadingBlock } from '@/components/ui/Spinner';
import { Table, THead, TBody, TR, TH, TD, EmptyRow } from '@/components/ui/Table';
import { useSelectedOrg } from '@/hooks/useSelectedOrg';
import { auditStatusLabels, auditStatusTone, auditTypeLabels, formatDate } from '@/lib/labels';

export function AuditsPage() {
  const [orgId, setOrgId] = useSelectedOrg();

  const listQuery = useQuery({
    queryKey: ['audits', orgId],
    queryFn: () => auditsApi.list(orgId as string, { limit: 100 }),
    enabled: Boolean(orgId),
  });

  const statsQuery = useQuery({
    queryKey: ['audit-stats', orgId],
    queryFn: () => auditsApi.getStats(orgId as string),
    enabled: Boolean(orgId),
  });

  const audits = listQuery.data?.data ?? [];
  const stats = statsQuery.data;

  return (
    <div>
      <PageHeader
        title="Audits"
        description="Audits internes, externes, réglementaires et fournisseurs"
        actions={<OrgSelector value={orgId} onChange={setOrgId} />}
      />

      {!orgId ? (
        <Card>
          <p className="text-sm text-gray-500">Sélectionnez une organisation.</p>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatCard label="Total audits" value={stats?.total ?? 0} />
            <StatCard
              label="En cours"
              value={stats?.byStatus.find((s) => s.status === 'IN_PROGRESS')?.count ?? 0}
              accent="text-orange-500"
            />
            <StatCard
              label="Terminés"
              value={stats?.byStatus.find((s) => s.status === 'COMPLETED')?.count ?? 0}
              accent="text-green-600"
            />
            <StatCard
              label="Constats critiques"
              value={stats?.findings.bySeverity.find((s) => s.severity === 'CRITICAL')?.count ?? 0}
              accent="text-red-600"
            />
          </div>

          <div className="mt-6">
            {listQuery.isLoading ? (
              <LoadingBlock />
            ) : (
              <Table>
                <THead>
                  <TR>
                    <TH>Titre</TH>
                    <TH>Type</TH>
                    <TH>Statut</TH>
                    <TH>Début</TH>
                    <TH>Fin</TH>
                    <TH>Constats</TH>
                  </TR>
                </THead>
                <TBody>
                  {audits.length === 0 ? (
                    <EmptyRow colSpan={6} message="Aucun audit enregistré." />
                  ) : (
                    audits.map((audit) => (
                      <TR key={audit.id} className="hover:bg-gray-50">
                        <TD className="font-medium text-gray-800">{audit.title}</TD>
                        <TD className="text-gray-600">{auditTypeLabels[audit.type]}</TD>
                        <TD>
                          <Badge tone={auditStatusTone[audit.status]}>
                            {auditStatusLabels[audit.status]}
                          </Badge>
                        </TD>
                        <TD className="whitespace-nowrap text-gray-600">
                          {formatDate(audit.startDate)}
                        </TD>
                        <TD className="whitespace-nowrap text-gray-600">
                          {formatDate(audit.endDate)}
                        </TD>
                        <TD className="font-semibold text-gray-700">
                          {audit._count?.findings ?? audit.findings?.length ?? 0}
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
