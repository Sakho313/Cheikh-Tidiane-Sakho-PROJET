import { useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { OrgSelector } from '@/components/OrgSelector';
import { useSelectedOrg } from '@/hooks/useSelectedOrg';
import { useGap } from '@/lib/gapAnalysis';
import {
  useRoadmap,
  generateFromGap,
  PRIORITES,
  STATUTS,
  type RoadmapAction,
  type ActionPriorite,
  type ActionStatut,
} from '@/lib/roadmap';

const emptyAdd = {
  action: '',
  responsable: '',
  echeance: new Date().toISOString().slice(0, 10),
};

export function RoadmapPage() {
  const [orgId, setOrgId] = useSelectedOrg();
  const { actions, setActions } = useRoadmap(orgId);
  const { reqs } = useGap(orgId);
  const [add, setAdd] = useState(emptyAdd);

  function updateField<K extends keyof RoadmapAction>(
    id: string,
    field: K,
    value: RoadmapAction[K],
  ) {
    setActions(actions.map((a) => (a.id === id ? { ...a, [field]: value } : a)));
  }

  function deleteAction(id: string) {
    setActions(actions.filter((a) => a.id !== id));
  }

  function addAction() {
    if (!add.action.trim()) return;
    setActions([
      ...actions,
      {
        id: Date.now().toString(),
        action: add.action,
        module: 'Gouvernance',
        responsable: add.responsable,
        echeance: add.echeance,
        priorite: 'Moyenne',
        statut: 'À faire',
        kpi: '',
      },
    ]);
    setAdd(emptyAdd);
  }

  function generate() {
    const generated = generateFromGap(reqs);
    const existingIds = new Set(actions.map((a) => a.id));
    const toAdd = generated.filter((g) => !existingIds.has(g.id));
    if (toAdd.length > 0) setActions([...actions, ...toAdd]);
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <PageHeader
          title="Feuille de route"
          description="Plan de remédiation jusqu'à la conformité"
        />
        <OrgSelector value={orgId} onChange={setOrgId} />
      </div>

      {!orgId ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <p className="text-slate-500 text-sm">Sélectionnez une organisation.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="flex flex-wrap items-start justify-between gap-3 px-5 py-4 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-800">Plan de remédiation</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Objectifs, responsables, échéances, KPI et preuves jusqu'à la conformité.
              </p>
            </div>
            <button
              type="button"
              onClick={generate}
              className="shrink-0 inline-flex items-center gap-2 rounded-lg bg-teal-700 px-3.5 py-2 text-sm font-semibold text-white hover:bg-teal-800 transition-colors"
            >
              + Générer depuis les écarts
              <span className="rounded bg-teal-500/40 px-1.5 py-0.5 text-[10px] font-bold tracking-wide">
                IA
              </span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {['Action', 'Module', 'Resp.', 'Échéance', 'Priorité', 'Statut', 'KPI', ''].map(
                    (h) => (
                      <th
                        key={h}
                        className="px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {actions.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50/50 align-top">
                    <td className="px-3 py-3 min-w-[200px]">
                      <input
                        className="w-full rounded border border-transparent bg-transparent px-1 py-0.5 text-sm font-medium text-slate-800 hover:border-slate-300 focus:border-teal-400 focus:outline-none"
                        value={a.action}
                        onChange={(e) => updateField(a.id, 'action', e.target.value)}
                      />
                    </td>
                    <td className="px-3 py-3">
                      <input
                        className="w-24 rounded border border-transparent bg-transparent px-1 py-0.5 text-sm text-slate-600 hover:border-slate-300 focus:border-teal-400 focus:outline-none"
                        value={a.module}
                        onChange={(e) => updateField(a.id, 'module', e.target.value)}
                      />
                    </td>
                    <td className="px-3 py-3">
                      <input
                        className="w-20 rounded border border-transparent bg-transparent px-1 py-0.5 text-sm text-slate-600 hover:border-slate-300 focus:border-teal-400 focus:outline-none"
                        value={a.responsable}
                        onChange={(e) => updateField(a.id, 'responsable', e.target.value)}
                      />
                    </td>
                    <td className="px-3 py-3">
                      <input
                        type="date"
                        className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-700 focus:border-teal-400 focus:outline-none focus:ring-1 focus:ring-teal-400"
                        value={a.echeance}
                        onChange={(e) => updateField(a.id, 'echeance', e.target.value)}
                      />
                    </td>
                    <td className="px-3 py-3">
                      <select
                        className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-700 focus:border-teal-400 focus:outline-none"
                        value={a.priorite}
                        onChange={(e) =>
                          updateField(a.id, 'priorite', e.target.value as ActionPriorite)
                        }
                      >
                        {PRIORITES.map((p) => (
                          <option key={p}>{p}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-3">
                      <select
                        className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-700 focus:border-teal-400 focus:outline-none"
                        value={a.statut}
                        onChange={(e) =>
                          updateField(a.id, 'statut', e.target.value as ActionStatut)
                        }
                      >
                        {STATUTS.map((s) => (
                          <option key={s}>{s}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-3">
                      <input
                        className="w-32 rounded border border-transparent bg-transparent px-1 py-0.5 text-sm text-slate-600 hover:border-slate-300 focus:border-teal-400 focus:outline-none"
                        value={a.kpi}
                        onChange={(e) => updateField(a.id, 'kpi', e.target.value)}
                        placeholder="—"
                      />
                    </td>
                    <td className="px-3 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => deleteAction(a.id)}
                        className="text-slate-300 hover:text-red-500 transition-colors"
                        aria-label="Supprimer"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                          <path d="M10 11v6 M14 11v6" />
                          <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}

                {/* Add row */}
                <tr className="bg-slate-50/40">
                  <td className="px-3 py-3" colSpan={3}>
                    <input
                      placeholder="Nouvelle action"
                      className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm placeholder:text-slate-400 focus:border-teal-400 focus:outline-none"
                      value={add.action}
                      onChange={(e) => setAdd({ ...add, action: e.target.value })}
                      onKeyDown={(e) => e.key === 'Enter' && addAction()}
                    />
                  </td>
                  <td className="px-3 py-3" colSpan={2}>
                    <input
                      placeholder="Responsable"
                      className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm placeholder:text-slate-400 focus:border-teal-400 focus:outline-none"
                      value={add.responsable}
                      onChange={(e) => setAdd({ ...add, responsable: e.target.value })}
                    />
                  </td>
                  <td className="px-3 py-3">
                    <input
                      type="date"
                      className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-700 focus:border-teal-400 focus:outline-none"
                      value={add.echeance}
                      onChange={(e) => setAdd({ ...add, echeance: e.target.value })}
                    />
                  </td>
                  <td className="px-3 py-3 text-right" colSpan={2}>
                    <button
                      type="button"
                      onClick={addAction}
                      className="rounded-lg bg-teal-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-teal-700 transition-colors"
                    >
                      Ajouter
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
