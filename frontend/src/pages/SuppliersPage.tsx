import { useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { OrgSelector } from '@/components/OrgSelector';
import { useSelectedOrg } from '@/hooks/useSelectedOrg';
import {
  useSuppliers,
  CRITICITES,
  RISQUES,
  EVALUATIONS,
  type Supplier,
  type SupplierCriticite,
  type SupplierRisque,
  type SupplierEvaluation,
} from '@/lib/suppliers';

const emptyAdd = {
  nom: '',
  criticite: 'Critique' as SupplierCriticite,
  niveauRisque: 'Faible' as SupplierRisque,
  evaluation: 'À évaluer' as SupplierEvaluation,
};

const criticiteBadge: Record<SupplierCriticite, string> = {
  Critique: 'bg-red-50 text-red-600 border-red-200',
  Importante: 'bg-orange-50 text-orange-600 border-orange-200',
  Standard: 'bg-slate-50 text-slate-600 border-slate-200',
  Faible: 'bg-slate-50 text-slate-400 border-slate-200',
};

const risqueBadge: Record<SupplierRisque, string> = {
  Élevé: 'bg-red-50 text-red-600 border-red-200',
  Moyen: 'bg-amber-50 text-amber-600 border-amber-200',
  Faible: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

const evaluationBadge: Record<SupplierEvaluation, string> = {
  'À évaluer': 'bg-slate-50 text-slate-500 border-slate-200',
  'En cours': 'bg-teal-50 text-teal-700 border-teal-200',
  Évalué: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

export function SuppliersPage() {
  const [orgId, setOrgId] = useSelectedOrg();
  const { suppliers, setSuppliers } = useSuppliers(orgId);
  const [add, setAdd] = useState(emptyAdd);

  function updateField<K extends keyof Supplier>(id: string, field: K, value: Supplier[K]) {
    setSuppliers(suppliers.map((s) => (s.id === id ? { ...s, [field]: value } : s)));
  }

  function deleteSupplier(id: string) {
    setSuppliers(suppliers.filter((s) => s.id !== id));
  }

  function addSupplier() {
    if (!add.nom.trim()) return;
    setSuppliers([
      ...suppliers,
      { id: Date.now().toString(), ...add },
    ]);
    setAdd(emptyAdd);
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <PageHeader
          title="Fournisseurs"
          description="Évaluation de la sécurité des tiers"
        />
        <OrgSelector value={orgId} onChange={setOrgId} />
      </div>

      {!orgId ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <p className="text-slate-500 text-sm">Sélectionnez une organisation.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-800">Évaluation des fournisseurs (tiers)</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Sécurité de la chaîne d&apos;approvisionnement — exigence de l&apos;article 21.2.d.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {['Fournisseur', 'Criticité', 'Niveau de risque', 'Évaluation', ''].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {suppliers.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/50 align-middle">
                    {/* Nom */}
                    <td className="px-4 py-3 min-w-[180px]">
                      <input
                        className="w-full rounded border border-transparent bg-transparent px-1 py-0.5 text-sm text-slate-800 hover:border-slate-300 focus:border-teal-400 focus:outline-none"
                        value={s.nom}
                        onChange={(e) => updateField(s.id, 'nom', e.target.value)}
                      />
                    </td>

                    {/* Criticité */}
                    <td className="px-4 py-3">
                      <select
                        className={`rounded-lg border px-2 py-1.5 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-teal-400 ${criticiteBadge[s.criticite]}`}
                        value={s.criticite}
                        onChange={(e) =>
                          updateField(s.id, 'criticite', e.target.value as SupplierCriticite)
                        }
                      >
                        {CRITICITES.map((c) => (
                          <option key={c}>{c}</option>
                        ))}
                      </select>
                    </td>

                    {/* Niveau de risque */}
                    <td className="px-4 py-3">
                      <select
                        className={`rounded-lg border px-2 py-1.5 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-teal-400 ${risqueBadge[s.niveauRisque]}`}
                        value={s.niveauRisque}
                        onChange={(e) =>
                          updateField(s.id, 'niveauRisque', e.target.value as SupplierRisque)
                        }
                      >
                        {RISQUES.map((r) => (
                          <option key={r}>{r}</option>
                        ))}
                      </select>
                    </td>

                    {/* Évaluation */}
                    <td className="px-4 py-3">
                      <select
                        className={`rounded-lg border px-2 py-1.5 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-teal-400 ${evaluationBadge[s.evaluation]}`}
                        value={s.evaluation}
                        onChange={(e) =>
                          updateField(s.id, 'evaluation', e.target.value as SupplierEvaluation)
                        }
                      >
                        {EVALUATIONS.map((ev) => (
                          <option key={ev}>{ev}</option>
                        ))}
                      </select>
                    </td>

                    {/* Delete */}
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => deleteSupplier(s.id)}
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
                  <td className="px-4 py-3">
                    <input
                      placeholder="Fournisseur"
                      className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm placeholder:text-slate-400 focus:border-teal-400 focus:outline-none"
                      value={add.nom}
                      onChange={(e) => setAdd({ ...add, nom: e.target.value })}
                      onKeyDown={(e) => e.key === 'Enter' && addSupplier()}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <select
                      className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-700 focus:border-teal-400 focus:outline-none"
                      value={add.criticite}
                      onChange={(e) => setAdd({ ...add, criticite: e.target.value as SupplierCriticite })}
                    >
                      {CRITICITES.map((c) => <option key={c}>{c}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-700 focus:border-teal-400 focus:outline-none"
                      value={add.niveauRisque}
                      onChange={(e) => setAdd({ ...add, niveauRisque: e.target.value as SupplierRisque })}
                    >
                      {RISQUES.map((r) => <option key={r}>{r}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-700 focus:border-teal-400 focus:outline-none"
                      value={add.evaluation}
                      onChange={(e) => setAdd({ ...add, evaluation: e.target.value as SupplierEvaluation })}
                    >
                      {EVALUATIONS.map((ev) => <option key={ev}>{ev}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={addSupplier}
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
