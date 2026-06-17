import { useMemo } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { OrgSelector } from '@/components/OrgSelector';
import { useSelectedOrg } from '@/hooks/useSelectedOrg';
import {
  useGap,
  statusFromMaturity,
  gapStatusBadge,
  type GapStatus,
} from '@/lib/gapAnalysis';

function priorityLabel(status: GapStatus): string {
  if (status === 'NON CONFORME') return 'Priorité haute';
  if (status === 'PARTIEL') return 'Priorité moyenne';
  return '';
}

function cardTint(status: GapStatus): string {
  if (status === 'NON CONFORME') return 'bg-red-50 border-red-200';
  if (status === 'PARTIEL') return 'bg-amber-50 border-amber-200';
  return 'bg-slate-50 border-slate-200';
}

export function RoadmapPage() {
  const [orgId, setOrgId] = useSelectedOrg();
  const { reqs } = useGap(orgId);

  const actionItems = useMemo(
    () =>
      reqs
        .map((r) => ({ ...r, status: statusFromMaturity(r.maturite) }))
        .filter((r) => r.status !== 'CONFORME')
        .sort((a, b) => a.maturite - b.maturite),
    [reqs],
  );

  const nonConform = actionItems.filter((i) => i.status === 'NON CONFORME').length;
  const partial = actionItems.filter((i) => i.status === 'PARTIEL').length;

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <PageHeader
          title="Feuille de route"
          description="Plan d'actions priorisé basé sur les écarts de conformité NIS2"
        />
        <OrgSelector value={orgId} onChange={setOrgId} />
      </div>

      {!orgId ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <p className="text-slate-500 text-sm">
            Sélectionnez une organisation pour afficher la feuille de route.
          </p>
        </div>
      ) : actionItems.length === 0 ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-8 text-center shadow-sm">
          <p className="text-emerald-700 font-medium">Félicitations — aucun écart à corriger !</p>
          <p className="text-emerald-600 text-sm mt-1">
            Toutes les exigences évaluées sont conformes.
          </p>
        </div>
      ) : (
        <>
          <div className="mb-4 flex gap-4 text-sm">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
              <span className="text-slate-600">{nonConform} non conformes</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
              <span className="text-slate-600">{partial} partiels</span>
            </span>
          </div>

          <div className="space-y-3">
            {actionItems.map((item, idx) => (
              <div
                key={item.id}
                className={`rounded-xl border p-4 shadow-sm transition-colors duration-300 ${cardTint(item.status)}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white border border-slate-200 text-xs font-bold text-slate-500">
                      {idx + 1}
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="font-mono text-xs text-slate-400">{item.ref}</span>
                        <span className="text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded px-1.5 py-0.5">
                          {item.domaine}
                        </span>
                      </div>
                      <p className="font-semibold text-slate-800 text-sm">{item.exigence}</p>
                      {item.responsable && (
                        <p className="mt-1 text-xs text-slate-500">
                          Responsable : <span className="font-medium">{item.responsable}</span>
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span
                      className={`inline-flex items-center rounded px-2 py-1 text-[10px] font-bold tracking-wide ${gapStatusBadge[item.status]}`}
                    >
                      {item.status}
                    </span>
                    {priorityLabel(item.status) && (
                      <span className="text-[10px] text-slate-500 font-medium">
                        {priorityLabel(item.status)}
                      </span>
                    )}
                    <span className="text-[10px] text-slate-400">Maturité {item.maturite}/5</span>
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
