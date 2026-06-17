import { PageHeader } from '@/components/ui/PageHeader';
import { OrgSelector } from '@/components/OrgSelector';
import { useSelectedOrg } from '@/hooks/useSelectedOrg';
import {
  useGap,
  MATURITY_LEVELS,
  statusFromMaturity,
  gapStatusBadge,
  gapSelectTint,
  type GapRequirement,
} from '@/lib/gapAnalysis';

export function CompliancePage() {
  const [orgId, setOrgId] = useSelectedOrg();
  const { reqs, setReqs } = useGap(orgId);

  function updateField<K extends keyof GapRequirement>(
    id: string,
    field: K,
    value: GapRequirement[K],
  ) {
    setReqs(reqs.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <PageHeader
          title="Gouvernance & Gap"
          description="Analyse d'écart sur les mesures de l'article 21 et le ReCyF"
        />
        <OrgSelector value={orgId} onChange={setOrgId} />
      </div>

      {!orgId ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <p className="text-slate-500 text-sm">Sélectionnez une organisation.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="flex items-start justify-between px-5 py-4 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-800">Analyse d'écart (Gap Analysis)</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Évaluez la maturité de chaque exigence — les statuts et KPI se mettent à jour
                automatiquement.
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-teal-400 px-2.5 py-0.5 text-xs font-bold text-slate-900">
              Niveaux 0-5
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {['Domaine', 'Réf.', 'Exigence', 'Maturité', 'Statut', 'Responsable', 'Preuve'].map(
                    (h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reqs.map((req) => {
                  const status = statusFromMaturity(req.maturite);
                  return (
                    <tr key={req.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{req.domaine}</td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-400 whitespace-nowrap">
                        {req.ref}
                      </td>
                      <td className="px-4 py-3 text-slate-800 min-w-[220px] max-w-sm">
                        {req.exigence}
                      </td>
                      <td className="px-4 py-3">
                        <select
                          className={`rounded-lg border bg-white px-2.5 py-1.5 text-sm font-medium transition-colors duration-300 focus:outline-none focus:ring-1 focus:ring-teal-400 ${gapSelectTint[status]}`}
                          value={req.maturite}
                          onChange={(e) =>
                            updateField(req.id, 'maturite', Number(e.target.value))
                          }
                        >
                          {MATURITY_LEVELS.map((lvl) => (
                            <option key={lvl.value} value={lvl.value}>
                              {lvl.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded px-2 py-1 text-[10px] font-bold tracking-wide transition-colors duration-300 ${gapStatusBadge[status]}`}
                        >
                          {status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <input
                          className="w-32 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-700 focus:border-teal-400 focus:outline-none focus:ring-1 focus:ring-teal-400"
                          value={req.responsable}
                          onChange={(e) => updateField(req.id, 'responsable', e.target.value)}
                          placeholder="—"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          className="w-32 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-700 focus:border-teal-400 focus:outline-none focus:ring-1 focus:ring-teal-400"
                          value={req.preuve}
                          onChange={(e) => updateField(req.id, 'preuve', e.target.value)}
                          placeholder="—"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
