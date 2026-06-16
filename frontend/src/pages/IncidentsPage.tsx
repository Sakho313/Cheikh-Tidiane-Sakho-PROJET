import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { incidentsApi } from '@/api/incidents';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, StatCard } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { OrgSelector } from '@/components/OrgSelector';
import { LoadingBlock } from '@/components/ui/Spinner';
import { Table, THead, TBody, TR, TH, TD, EmptyRow } from '@/components/ui/Table';
import { useSelectedOrg } from '@/hooks/useSelectedOrg';
import { extractErrorMessage } from '@/api/client';
import {
  incidentSeverityLabels,
  incidentSeverityTone,
  incidentStatusLabels,
  incidentStatusTone,
  formatDateTime,
} from '@/lib/labels';

export function IncidentsPage() {
  const [orgId, setOrgId] = useSelectedOrg();
  const queryClient = useQueryClient();
  const [actionError, setActionError] = useState<string | null>(null);

  const listQuery = useQuery({
    queryKey: ['incidents', orgId],
    queryFn: () => incidentsApi.list(orgId as string, { limit: 100 }),
    enabled: Boolean(orgId),
  });

  const statsQuery = useQuery({
    queryKey: ['incident-stats', orgId],
    queryFn: () => incidentsApi.getStats(orgId as string),
    enabled: Boolean(orgId),
  });

  const reportMutation = useMutation({
    mutationFn: (id: string) => incidentsApi.reportToAuthority(id),
    onSuccess: () => {
      setActionError(null);
      void queryClient.invalidateQueries({ queryKey: ['incidents', orgId] });
      void queryClient.invalidateQueries({ queryKey: ['incident-stats', orgId] });
    },
    onError: (err) => setActionError(extractErrorMessage(err)),
  });

  const incidents = listQuery.data?.data ?? [];
  const stats = statsQuery.data;

  return (
    <div>
      <PageHeader
        title="Incidents de sécurité"
        description="Gestion du cycle de vie et notification réglementaire (Article 23)"
        actions={<OrgSelector value={orgId} onChange={setOrgId} />}
      />

      {!orgId ? (
        <Card>
          <p className="text-sm text-gray-500">Sélectionnez une organisation.</p>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard label="Total incidents" value={stats?.total ?? 0} />
            <StatCard
              label="Non notifiés à l'autorité"
              value={stats?.totalUnreported ?? 0}
              accent="text-orange-500"
            />
            <StatCard
              label="Critiques"
              value={stats?.bySeverity.find((s) => s.severity === 'CRITICAL')?.count ?? 0}
              accent="text-red-600"
            />
          </div>

          {actionError && (
            <div className="mt-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
              {actionError}
            </div>
          )}

          <div className="mt-6">
            {listQuery.isLoading ? (
              <LoadingBlock />
            ) : (
              <Table>
                <THead>
                  <TR>
                    <TH>Titre</TH>
                    <TH>Type</TH>
                    <TH>Sévérité</TH>
                    <TH>Statut</TH>
                    <TH>Détecté le</TH>
                    <TH>Autorité</TH>
                    <TH className="text-right">Action</TH>
                  </TR>
                </THead>
                <TBody>
                  {incidents.length === 0 ? (
                    <EmptyRow colSpan={7} message="Aucun incident enregistré." />
                  ) : (
                    incidents.map((incident) => (
                      <TR key={incident.id} className="hover:bg-gray-50">
                        <TD className="font-medium text-gray-800">{incident.title}</TD>
                        <TD className="text-gray-600">{incident.incidentType}</TD>
                        <TD>
                          <Badge tone={incidentSeverityTone[incident.severity]}>
                            {incidentSeverityLabels[incident.severity]}
                          </Badge>
                        </TD>
                        <TD>
                          <Badge tone={incidentStatusTone[incident.status]}>
                            {incidentStatusLabels[incident.status]}
                          </Badge>
                        </TD>
                        <TD className="whitespace-nowrap text-gray-600">
                          {formatDateTime(incident.detectedAt)}
                        </TD>
                        <TD>
                          {incident.reportedToAuthority ? (
                            <Badge tone="green">Notifiée</Badge>
                          ) : (
                            <Badge tone="gray">Non notifiée</Badge>
                          )}
                        </TD>
                        <TD className="text-right">
                          {!incident.reportedToAuthority && (
                            <Button
                              size="sm"
                              variant="secondary"
                              isLoading={
                                reportMutation.isPending &&
                                reportMutation.variables === incident.id
                              }
                              onClick={() => reportMutation.mutate(incident.id)}
                            >
                              Notifier l'autorité
                            </Button>
                          )}
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
