import { PageHeader } from '@/components/ui/PageHeader';
import { OrgSelector } from '@/components/OrgSelector';
import { useSelectedOrg } from '@/hooks/useSelectedOrg';
import { useOrganizations } from '@/hooks/useOrganizations';
import { entityTypeLabels } from '@/lib/labels';
import {
  useGap,
  globalMaturity,
  conformityRate,
  domainScores,
  statusFromMaturity,
} from '@/lib/gapAnalysis';
import { useEbios, openRisksCount } from '@/lib/ebios';
import { useRoadmap, openCount } from '@/lib/roadmap';

function KpiCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: 'red' | 'amber' | 'teal' | 'slate';
}) {
  const valueClass =
    accent === 'red'
      ? 'text-red-600'
      : accent === 'amber'
        ? 'text-amber-600'
        : accent === 'teal'
          ? 'text-teal-700'
          : 'text-slate-800';

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col gap-1">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</p>
      <p className={`text-3xl font-bold ${valueClass}`}>{value}</p>
      {sub && <p className="text-xs text-slate-400">{sub}</p>}
    </div>
  );
}

function DomainBar({ domaine, score }: { domaine: string; score: number }) {
  const color =
    score >= 60 ? 'bg-emerald-500' : score >= 40 ? 'bg-amber-400' : 'bg-red-400';

  return (
    <div className="flex items-center gap-3">
      <span className="w-40 shrink-0 truncate text-right text-xs text-slate-600">{domaine}</span>
      <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
        <div
          className={`h-full rounded-full ${color} transition-all duration-500`}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className="w-10 shrink-0 text-right text-xs font-semibold text-slate-700">
        {score}%
      </span>
    </div>
  );
}

export function ReportsPage() {
  const [orgId, setOrgId] = useSelectedOrg();

  const { data: orgsPage } = useOrganizations();
  const orgs = orgsPage?.data;
  const selectedOrg = orgs?.find((o) => o.id === orgId);

  const { reqs } = useGap(orgId);
  const { risks } = useEbios(orgId);
  const { actions } = useRoadmap(orgId);

  const maturity = globalMaturity(reqs);
  const conformity = conformityRate(reqs);
  const risksOpen = openRisksCount(risks);
  const actionsOpen = openCount(actions);

  const domains = domainScores(reqs).sort((a, b) => a.score - b.score);

  const today = new Date().toISOString().slice(0, 10);
  const orgLabel = selectedOrg
    ? `${selectedOrg.name} · Entité ${entityTypeLabels[selectedOrg.entityType]}`
    : '—';

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <PageHeader
          title="Rapport de conformité"
          description="Synthèse exportable de l'état de conformité"
        />
        <div className="flex items-center gap-3">
          <OrgSelector value={orgId} onChange={setOrgId} />
          {orgId && (
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="6 9 6 2 18 2 18 9" />
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                <rect x="6" y="14" width="12" height="8" />
              </svg>
              Imprimer / PDF
            </button>
          )}
        </div>
      </div>

      {!orgId ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <p className="text-slate-500 text-sm">Sélectionnez une organisation.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Report header */}
          <div className="rounded-xl border border-slate-200 bg-white px-6 py-5 shadow-sm">
            <h2 className="text-base font-bold text-slate-800">Rapport de conformité NIS2</h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Synthèse exportable — {orgLabel} — {today}
            </p>
          </div>

          {/* KPI cards */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <KpiCard
              label="Maturité globale"
              value={`${maturity}%`}
              sub="Moyenne pondérée 0-5"
              accent={maturity >= 60 ? 'teal' : maturity >= 40 ? 'amber' : 'red'}
            />
            <KpiCard
              label="Conformité"
              value={`${conformity}%`}
              sub="Exigences conformes"
              accent={conformity >= 60 ? 'teal' : conformity >= 30 ? 'amber' : 'red'}
            />
            <KpiCard
              label="Risques ouverts"
              value={risksOpen}
              sub="EBIOS RM non clôturés"
              accent={risksOpen === 0 ? 'teal' : risksOpen <= 3 ? 'amber' : 'red'}
            />
            <KpiCard
              label="Actions ouvertes"
              value={actionsOpen}
              sub="Feuille de route"
              accent={actionsOpen === 0 ? 'teal' : actionsOpen <= 3 ? 'amber' : 'red'}
            />
          </div>

          {/* Domain bars */}
          <div className="rounded-xl border border-slate-200 bg-white px-6 py-5 shadow-sm">
            <h3 className="mb-4 text-sm font-bold text-slate-800">Maturité par domaine</h3>
            {domains.length === 0 ? (
              <p className="text-xs text-slate-400">Aucune donnée disponible.</p>
            ) : (
              <div className="space-y-2.5">
                {domains.map((d) => (
                  <DomainBar key={d.domaine} domaine={d.domaine} score={d.score} />
                ))}
              </div>
            )}
          </div>

          {/* Non-conform list */}
          {reqs.some((r) => statusFromMaturity(r.maturite) !== 'CONFORME') && (
            <div className="rounded-xl border border-slate-200 bg-white px-6 py-5 shadow-sm">
              <h3 className="mb-4 text-sm font-bold text-slate-800">
                Exigences non conformes / partielles
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      {['Réf.', 'Domaine', 'Exigence', 'Maturité', 'Statut'].map((h) => (
                        <th
                          key={h}
                          className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {reqs
                      .filter((r) => statusFromMaturity(r.maturite) !== 'CONFORME')
                      .sort((a, b) => a.maturite - b.maturite)
                      .map((r) => {
                        const status = statusFromMaturity(r.maturite);
                        const badge =
                          status === 'NON CONFORME'
                            ? 'bg-red-50 text-red-600 border-red-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200';
                        return (
                          <tr key={r.id} className="hover:bg-slate-50/50">
                            <td className="px-3 py-2 font-mono text-slate-500">{r.ref}</td>
                            <td className="px-3 py-2 text-slate-600">{r.domaine}</td>
                            <td className="px-3 py-2 text-slate-700">{r.exigence}</td>
                            <td className="px-3 py-2 text-center font-semibold text-slate-700">
                              {r.maturite}/5
                            </td>
                            <td className="px-3 py-2">
                              <span
                                className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold ${badge}`}
                              >
                                {status}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Footer */}
          <p className="text-center text-[11px] text-slate-400 pb-2">
            Document indicatif fondé sur les données saisies. Référentiels : article 21 directive
            (UE) 2022/2555 et ReCyF (ANSSI). La détermination du statut d'assujettissement relève
            de l'ANSSI.
          </p>
        </div>
      )}
    </div>
  );
}
