import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { complianceApi } from '@/api/compliance';
import { OrgSelector } from '@/components/OrgSelector';
import { LoadingBlock } from '@/components/ui/Spinner';
import { Badge } from '@/components/ui/Badge';
import { PageHeader } from '@/components/ui/PageHeader';
import { useSelectedOrg } from '@/hooks/useSelectedOrg';
import { complianceStatusLabels, complianceStatusTone } from '@/lib/labels';
import type { ComplianceAssessment, ComplianceStatus } from '@/types';

const PRIORITY_ORDER: ComplianceStatus[] = [
  'NON_COMPLIANT',
  'PARTIAL',
  'PENDING',
  'NOT_APPLICABLE',
  'COMPLIANT',
];

function priorityLabel(status: ComplianceStatus): string {
  if (status === 'NON_COMPLIANT') return 'Priorité haute';
  if (status === 'PARTIAL') return 'Priorité moyenne';
  if (status === 'PENDING') return 'À planifier';
  return '';
}

function priorityColor(status: ComplianceStatus): string {
  if (status === 'NON_COMPLIANT') return 'bg-red-50 border-red-200';
  if (status === 'PARTIAL') return 'bg-amber-50 border-amber-200';
  return 'bg-slate-50 border-slate-200';
}

export function RoadmapPage() {
  const [orgId, setOrgId] = useSelectedOrg();

  const controlsQuery = useQuery({
    queryKey: ['compliance-controls'],
    queryFn: () => complianceApi.getControls(),
  });

  const assessmentsQuery = useQuery({
    queryKey: ['compliance-assessments', orgId],
    queryFn: () => complianceApi.getAssessments(orgId as string),
    enabled: Boolean(orgId),
  });

  const actionItems = useMemo(() => {
    if (!controlsQuery.data) return [];
    const byControl = new Map<string, ComplianceAssessment>();
    (assessmentsQuery.data ?? []).forEach((a) => byControl.set(a.controlId, a));

    return controlsQuery.data
      .map((control) => ({
        control,
        status: (byControl.get(control.id)?.status ?? 'PENDING') as ComplianceStatus,
        notes: byControl.get(control.id)?.notes ?? null,
        dueDate: byControl.get(control.id)?.dueDate ?? null,
      }))
      .filter((item) => item.status !== 'COMPLIANT' && item.status !== 'NOT_APPLICABLE')
      .sort(
        (a, b) =>
          PRIORITY_ORDER.indexOf(a.status) - PRIORITY_ORDER.indexOf(b.status),
      );
  }, [controlsQuery.data, assessmentsQuery.data]);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <PageHeader
            title="Feuille de route"
            description="Plan d'actions priorisé basé sur les écarts de conformité NIS2"
          />
        </div>
        <OrgSelector value={orgId} onChange={setOrgId} />
      </div>

      {!orgId ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <p className="text-slate-500 text-sm">
            Sélectionnez une organisation pour afficher la feuille de route.
          </p>
        </div>
      ) : controlsQuery.isLoading || assessmentsQuery.isLoading ? (
        <LoadingBlock />
      ) : actionItems.length === 0 ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-8 text-center shadow-sm">
          <p className="text-emerald-700 font-medium">
            Félicitations — aucun écart à corriger !
          </p>
          <p className="text-emerald-600 text-sm mt-1">
            Tous les contrôles applicables sont conformes.
          </p>
        </div>
      ) : (
        <>
          <div className="mb-4 flex gap-4 text-sm">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
              <span className="text-slate-600">
                {actionItems.filter((i) => i.status === 'NON_COMPLIANT').length} non conformes
              </span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
              <span className="text-slate-600">
                {actionItems.filter((i) => i.status === 'PARTIAL').length} partiels
              </span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-slate-400" />
              <span className="text-slate-600">
                {actionItems.filter((i) => i.status === 'PENDING').length} en attente
              </span>
            </span>
          </div>

          <div className="space-y-3">
            {actionItems.map(({ control, status, notes, dueDate }, idx) => (
              <div
                key={control.id}
                className={`rounded-xl border p-4 shadow-sm ${priorityColor(status)}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white border border-slate-200 text-xs font-bold text-slate-500">
                      {idx + 1}
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="font-mono text-xs text-slate-400">{control.article}</span>
                        <span className="text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded px-1.5 py-0.5">
                          {control.domain}
                        </span>
                      </div>
                      <p className="font-semibold text-slate-800 text-sm">{control.requirement}</p>
                      {notes && (
                        <p className="mt-1 text-xs text-slate-600 italic">{notes}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <Badge tone={complianceStatusTone[status]}>
                      {complianceStatusLabels[status]}
                    </Badge>
                    {priorityLabel(status) && (
                      <span className="text-[10px] text-slate-500 font-medium">
                        {priorityLabel(status)}
                      </span>
                    )}
                    {dueDate && (
                      <span className="text-[10px] text-slate-400">
                        Échéance : {new Date(dueDate).toLocaleDateString('fr-FR')}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
