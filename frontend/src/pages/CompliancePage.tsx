import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { complianceApi } from '@/api/compliance';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, StatCard } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { OrgSelector } from '@/components/OrgSelector';
import { LoadingBlock } from '@/components/ui/Spinner';
import { Table, THead, TBody, TR, TH, TD, EmptyRow } from '@/components/ui/Table';
import { useSelectedOrg } from '@/hooks/useSelectedOrg';
import {
  complianceStatusLabels,
  complianceStatusTone,
} from '@/lib/labels';
import type { ComplianceAssessment, ComplianceStatus } from '@/types';

function barColor(score: number): string {
  if (score >= 75) return 'bg-green-500';
  if (score >= 40) return 'bg-orange-400';
  return 'bg-red-500';
}

export function CompliancePage() {
  const [orgId, setOrgId] = useSelectedOrg();

  const scoreQuery = useQuery({
    queryKey: ['compliance-score', orgId],
    queryFn: () => complianceApi.getScore(orgId as string),
    enabled: Boolean(orgId),
  });

  const assessmentsQuery = useQuery({
    queryKey: ['compliance-assessments', orgId],
    queryFn: () => complianceApi.getAssessments(orgId as string),
    enabled: Boolean(orgId),
  });

  const controlsQuery = useQuery({
    queryKey: ['compliance-controls'],
    queryFn: () => complianceApi.getControls(),
  });

  // Merge controls with their assessment (if any) so every control is shown.
  const rows = useMemo(() => {
    const controls = controlsQuery.data ?? [];
    const assessments = assessmentsQuery.data ?? [];
    const byControl = new Map<string, ComplianceAssessment>();
    assessments.forEach((a) => byControl.set(a.controlId, a));
    return controls.map((control) => ({
      control,
      status: (byControl.get(control.id)?.status ?? 'PENDING') as ComplianceStatus,
    }));
  }, [controlsQuery.data, assessmentsQuery.data]);

  const score = scoreQuery.data;

  return (
    <div>
      <PageHeader
        title="Conformité NIS2"
        description="Suivi des mesures de sécurité de l'Article 21"
        actions={<OrgSelector value={orgId} onChange={setOrgId} />}
      />

      {!orgId ? (
        <Card>
          <p className="text-sm text-gray-500">Sélectionnez une organisation.</p>
        </Card>
      ) : scoreQuery.isLoading ? (
        <LoadingBlock />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard
              label="Score global"
              value={`${score?.overallScore ?? 0}%`}
              accent={barColor(score?.overallScore ?? 0).replace('bg-', 'text-')}
            />
            <StatCard label="Contrôles applicables" value={score?.applicableControls ?? 0} />
            <StatCard label="Contrôles conformes" value={score?.compliantControls ?? 0} />
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card title="Score par domaine">
              {score && Object.keys(score.domainScores).length > 0 ? (
                <ul className="space-y-3">
                  {Object.entries(score.domainScores).map(([domain, d]) => (
                    <li key={domain}>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="text-gray-700">{domain}</span>
                        <span className="font-medium text-gray-600">
                          {d.score}% ({d.compliant}/{d.total})
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                        <div
                          className={`h-full rounded-full ${barColor(d.score)}`}
                          style={{ width: `${d.score}%` }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-400">Aucune donnée de domaine.</p>
              )}
            </Card>

            <Card title="Répartition des statuts">
              {score ? (
                <ul className="space-y-2 text-sm">
                  {(Object.keys(score.statusBreakdown) as ComplianceStatus[]).map((status) => (
                    <li key={status} className="flex items-center justify-between">
                      <Badge tone={complianceStatusTone[status]}>
                        {complianceStatusLabels[status]}
                      </Badge>
                      <span className="font-medium text-gray-700">
                        {score.statusBreakdown[status]}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-400">Aucune donnée.</p>
              )}
            </Card>
          </div>

          <div className="mt-6">
            <h2 className="mb-3 text-sm font-semibold text-gray-600">Contrôles NIS2</h2>
            {controlsQuery.isLoading || assessmentsQuery.isLoading ? (
              <LoadingBlock />
            ) : (
              <Table>
                <THead>
                  <TR>
                    <TH>Article</TH>
                    <TH>Domaine</TH>
                    <TH>Exigence</TH>
                    <TH>Statut</TH>
                  </TR>
                </THead>
                <TBody>
                  {rows.length === 0 ? (
                    <EmptyRow colSpan={4} message="Aucun contrôle disponible." />
                  ) : (
                    rows.map(({ control, status }) => (
                      <TR key={control.id} className="hover:bg-gray-50">
                        <TD className="whitespace-nowrap font-mono text-xs text-gray-500">
                          {control.article}
                        </TD>
                        <TD className="font-medium text-gray-800">{control.domain}</TD>
                        <TD className="max-w-md text-gray-600">{control.requirement}</TD>
                        <TD>
                          <Badge tone={complianceStatusTone[status]}>
                            {complianceStatusLabels[status]}
                          </Badge>
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
