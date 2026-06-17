import { useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { OrgSelector } from '@/components/OrgSelector';
import { useSelectedOrg } from '@/hooks/useSelectedOrg';
import {
  useEbios,
  criticite,
  critColor,
  matrixBg,
  TRAITEMENTS,
  RISK_STATUTS,
  SCALE,
  ATELIERS,
  type EbiosRisk,
  type Gravity,
  type Vraisemblance,
  type Traitement,
  type RiskStatut,
} from '@/lib/ebios';

const emptyAdd = {
  scenario: '',
  source: '',
  gravity: 3 as Gravity,
  vraisemblance: 2 as Vraisemblance,
  traitement: 'Réduire' as Traitement,
  statut: 'Ouvert' as RiskStatut,
};

export function RisksPage() {
  const [orgId, setOrgId] = useSelectedOrg();
  const { risks, setRisks } = useEbios(orgId);
  const [add, setAdd] = useState(emptyAdd);

  function updateField<K extends keyof EbiosRisk>(id: string, field: K, value: EbiosRisk[K]) {
    setRisks(risks.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  }

  function deleteRisk(id: string) {
    setRisks(risks.filter((r) => r.id !== id));
  }

  function addRisk() {
    if (!add.scenario.trim()) return;
    setRisks([...risks, { ...add, id: Date.now().toString() }]);
    setAdd(emptyAdd);
  }

  const matrixCounts: Record<string, number> = {};
  risks.forEach((r) => {
    const k = `${r.gravity}-${r.vraisemblance}`;
    matrixCounts[k] = (matrixCounts[k] ?? 0) + 1;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <PageHeader
          title="Risques (EBIOS RM)"
          description="Registre des risques selon la méthode EBIOS RM"
        />
        <OrgSelector value={orgId} onChange={setOrgId} />
      </div>

      {!orgId ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <p className="text-slate-500 text-sm">Sélectionnez une organisation.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Risk register table */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="flex items-start justify-between px-5 py-4 border-b border-slate-100">
              <div>
                <h2 className="text-sm font-bold text-slate-800">Registre des risques — EBIOS RM</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Atelier 3 &amp; 4 : scénarios stratégiques et opérationnels. Criticité = Gravité ×
                  Vraisemblance.
                </p>
              </div>
              <span className="shrink-0 rounded-full border border-teal-200 bg-teal-50 px-2.5 py-0.5 text-xs font-semibold text-teal-700">
                {ATELIERS.length} ateliers
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    {['Scénario de risque', 'Source de risque', 'Gravité', 'Vrais.', 'Criticité', 'Traitement', 'Statut', ''].map(
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
                  {risks.map((risk) => {
                    const score = criticite(risk.gravity, risk.vraisemblance);
                    return (
                      <tr key={risk.id} className="hover:bg-slate-50/50">
                        <td className="px-3 py-2.5 min-w-[220px]">
                          <input
                            className="w-full rounded border border-transparent bg-transparent px-1 py-0.5 text-sm text-slate-800 hover:border-slate-300 focus:border-teal-400 focus:outline-none"
                            value={risk.scenario}
                            onChange={(e) => updateField(risk.id, 'scenario', e.target.value)}
                          />
                        </td>
                        <td className="px-3 py-2.5 min-w-[140px]">
                          <input
                            className="w-full rounded border border-transparent bg-transparent px-1 py-0.5 text-sm text-slate-700 hover:border-slate-300 focus:border-teal-400 focus:outline-none"
                            value={risk.source}
                            onChange={(e) => updateField(risk.id, 'source', e.target.value)}
                          />
                        </td>
                        <td className="px-3 py-2.5">
                          <select
                            className="rounded border border-slate-200 bg-white px-2 py-0.5 text-sm focus:outline-none"
                            value={risk.gravity}
                            onChange={(e) =>
                              updateField(risk.id, 'gravity', Number(e.target.value) as Gravity)
                            }
                          >
                            {SCALE.map((n) => (
                              <option key={n} value={n}>{n}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-2.5">
                          <select
                            className="rounded border border-slate-200 bg-white px-2 py-0.5 text-sm focus:outline-none"
                            value={risk.vraisemblance}
                            onChange={(e) =>
                              updateField(risk.id, 'vraisemblance', Number(e.target.value) as Vraisemblance)
                            }
                          >
                            {SCALE.map((n) => (
                              <option key={n} value={n}>{n}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-2.5">
                          <span
                            className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-colors duration-300 ${critColor(score)}`}
                          >
                            {score}
                          </span>
                        </td>
                        <td className="px-3 py-2.5">
                          <select
                            className="rounded border border-slate-200 bg-white px-2 py-0.5 text-sm focus:outline-none"
                            value={risk.traitement}
                            onChange={(e) =>
                              updateField(risk.id, 'traitement', e.target.value as Traitement)
                            }
                          >
                            {TRAITEMENTS.map((t) => (
                              <option key={t}>{t}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-2.5">
                          <select
                            className="rounded border border-slate-200 bg-white px-2 py-0.5 text-sm focus:outline-none"
                            value={risk.statut}
                            onChange={(e) =>
                              updateField(risk.id, 'statut', e.target.value as RiskStatut)
                            }
                          >
                            {RISK_STATUTS.map((s) => (
                              <option key={s}>{s}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          <button
                            type="button"
                            onClick={() => deleteRisk(risk.id)}
                            className="text-slate-300 hover:text-red-500 transition-colors"
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
                    );
                  })}

                  {/* Add row */}
                  <tr className="bg-slate-50/40">
                    <td className="px-3 py-2">
                      <input
                        placeholder="Nouveau scénario"
                        className="w-full rounded border border-slate-200 bg-white px-2 py-1 text-sm placeholder:text-slate-400 focus:border-teal-400 focus:outline-none"
                        value={add.scenario}
                        onChange={(e) => setAdd({ ...add, scenario: e.target.value })}
                        onKeyDown={(e) => e.key === 'Enter' && addRisk()}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        placeholder="Source"
                        className="w-full rounded border border-slate-200 bg-white px-2 py-1 text-sm placeholder:text-slate-400 focus:border-teal-400 focus:outline-none"
                        value={add.source}
                        onChange={(e) => setAdd({ ...add, source: e.target.value })}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <select
                        className="rounded border border-slate-200 bg-white px-2 py-1 text-sm focus:outline-none"
                        value={add.gravity}
                        onChange={(e) => setAdd({ ...add, gravity: Number(e.target.value) as Gravity })}
                      >
                        {SCALE.map((n) => <option key={n} value={n}>{n}</option>)}
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <select
                        className="rounded border border-slate-200 bg-white px-2 py-1 text-sm focus:outline-none"
                        value={add.vraisemblance}
                        onChange={(e) =>
                          setAdd({ ...add, vraisemblance: Number(e.target.value) as Vraisemblance })
                        }
                      >
                        {SCALE.map((n) => <option key={n} value={n}>{n}</option>)}
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${critColor(add.gravity * add.vraisemblance)}`}
                      >
                        {add.gravity * add.vraisemblance}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <select
                        className="rounded border border-slate-200 bg-white px-2 py-1 text-sm focus:outline-none"
                        value={add.traitement}
                        onChange={(e) => setAdd({ ...add, traitement: e.target.value as Traitement })}
                      >
                        {TRAITEMENTS.map((t) => <option key={t}>{t}</option>)}
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <select
                        className="rounded border border-slate-200 bg-white px-2 py-1 text-sm focus:outline-none"
                        value={add.statut}
                        onChange={(e) => setAdd({ ...add, statut: e.target.value as RiskStatut })}
                      >
                        {RISK_STATUTS.map((s) => <option key={s}>{s}</option>)}
                      </select>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <button
                        type="button"
                        onClick={addRisk}
                        className="rounded-lg bg-teal-600 px-3 py-1 text-xs font-semibold text-white hover:bg-teal-700 transition-colors"
                      >
                        Ajouter
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Matrix + Ateliers */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="mb-1 text-sm font-bold text-slate-800">Matrice de criticité</h2>
              <p className="mb-4 text-xs text-slate-500">Gravité (→) × Vraisemblance (↑)</p>

              <div className="space-y-1">
                <div className="flex gap-1 pl-8">
                  {[1, 2, 3, 4].map((g) => (
                    <div key={g} className="flex-1 text-center text-[10px] font-semibold text-slate-500">
                      G{g}
                    </div>
                  ))}
                </div>
                {([4, 3, 2, 1] as Vraisemblance[]).map((v) => (
                  <div key={v} className="flex items-center gap-1">
                    <div className="w-7 text-center text-[10px] font-semibold text-slate-500">V{v}</div>
                    {([1, 2, 3, 4] as Gravity[]).map((g) => {
                      const count = matrixCounts[`${g}-${v}`] ?? 0;
                      return (
                        <div
                          key={g}
                          className={`flex-1 flex items-center justify-center h-14 rounded text-sm font-bold text-white ${matrixBg(g, v)}`}
                        >
                          {count > 0 ? count : ''}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="mb-4 text-sm font-bold text-slate-800">Les 5 ateliers EBIOS RM</h2>
              <ul className="space-y-3">
                {ATELIERS.map((atelier) => (
                  <li key={atelier} className="flex items-start gap-3 text-sm text-slate-700">
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-teal-500" />
                    {atelier}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
