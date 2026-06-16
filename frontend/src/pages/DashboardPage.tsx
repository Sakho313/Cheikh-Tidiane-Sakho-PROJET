import { useQuery } from '@tanstack/react-query';
import { organizationsApi } from '@/api/organizations';
import { complianceApi } from '@/api/compliance';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard, Card } from '@/components/ui/Card';
import { OrgSelector } from '@/components/OrgSelector';
import { LoadingBlock } from '@/components/ui/Spinner';
import { Badge } from '@/components/ui/Badge';
import { useSelectedOrg } from '@/hooks/useSelectedOrg';
import {
  formatDate,
  incidentSeverityLabels,
  incidentSeverityTone,
  incidentStatusLabels,
} from '@/lib/labels';
import { incidentsApi } from '@/api/incidents';

function scoreAccent(score: number): string {
  if (score >= 75) return 'text-green-600';
  if (score >= 40) return 'text-orange-500';
  return 'text-red-600';
}

export function DashboardPage() {
  const [orgId, setOrgId] = useSelectedOrg();

  const statsQuery = useQuery({
    queryKey: ['org-stats', orgId],
    queryFn: () => organizationsApi.getStats(orgId as string),
    enabled: Boolean(orgId),
  });

  const scoreQuery = useQuery({
    queryKey: ['compliance-score', orgId],
    queryFn: () => complianceApi.getScore(orgId as string),
    enabled: Boolean(orgId),
  });

  const incidentStatsQuery = useQuery({
    queryKey: ['incident-stats', orgId],
    queryFn: () => incidentsApi.getStats(orgId as string),
    enabled: Boolean(orgId),
  });

  const stats = statsQuery.data;
  const score = scoreQuery.data;

  return (
    <div>
      <PageHeader
        title="Tableau de bord"
        description="Vue d'ensemble de la posture de conformité NIS2"
        actions={<OrgSelector value={orgId} onChange={setOrgId} />}
      />

      {!orgId ? (
        <Card>
          <p className="text-sm text-gray-500">
            Sélectionnez une organisation pour afficher ses indicateurs.
          </p>
        </Card>
      ) : statsQuery.isLoading || scoreQuery.isLoading ? (
        <LoadingBlock />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Score de conformité"
              value={`${score?.overallScore ?? 0}%`}
              hint={`${score?.compliantControls ?? 0} / ${score?.applicableControls ?? 0} contrôles conformes`}
              accent={scoreAccent(score?.overallScore ?? 0)}
            />
            <StatCard
              label="Incidents"
              value={stats?.incidents.total ?? 0}
              hint={`${incidentStatsQuery.data?.totalUnreported ?? 0} non notifié(s)`}
            />
            <StatCard label="Risques" value={stats?.risks.total ?? 0} hint="Risques recensés" />
            <StatCard label="Audits" value={stats?.audits.total ?? 0} hint="Audits enregistrés" />
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card title="Conformité par domaine">
              {score && Object.keys(score.domainScores).length > 0 ? (
                <ul className="space-y-3">
                  {Object.entries(score.domainScores)
                    .sort((a, b) => b[1].score - a[1].score)
                    .map(([domain, d]) => (
                      <li key={domain}>
                        <div className="mb-1 flex items-center justify-between text-sm">
                          <span className="text-gray-700">{domain}</span>
                          <span className="font-medium text-gray-600">{d.score}%</span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                          <div
                            className={`h-full rounded-full ${
                              d.score >= 75
                                ? 'bg-green-500'
                                : d.score >= 40
                                  ? 'bg-orange-400'
                                  : 'bg-red-500'
                            }`}
                            style={{ width: `${d.score}%` }}
                          />
                        </div>
                      </li>
                    ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-400">Aucune évaluation de conformité enregistrée.</p>
              )}
            </Card>

            <Card title="Incidents récents">
              {incidentStatsQuery.data && incidentStatsQuery.data.recentIncidents.length > 0 ? (
                <ul className="divide-y divide-gray-100">
                  {incidentStatsQuery.data.recentIncidents.map((inc) => (
                    <li key={inc.id} className="flex items-center justify-between py-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-gray-700">{inc.title}</p>
                        <p className="text-xs text-gray-400">
                          {incidentStatusLabels[inc.status]} · {formatDate(inc.detectedAt)}
                        </p>
                      </div>
                      <Badge tone={incidentSeverityTone[inc.severity]}>
                        {incidentSeverityLabels[inc.severity]}
                      </Badge>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-400">Aucun incident récent.</p>
              )}
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
