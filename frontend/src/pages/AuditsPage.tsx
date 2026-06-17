import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/ui/PageHeader';
import { OrgSelector } from '@/components/OrgSelector';
import { useSelectedOrg } from '@/hooks/useSelectedOrg';
import {
  useGap,
  statusFromMaturity,
  gapStatusBadge,
  type GapStatus,
  type GapRequirement,
} from '@/lib/gapAnalysis';

// Clicking a conformity badge cycles the control through the three states,
// writing a representative maturity back so the change syncs to the gap
// analysis, the dashboard and the report.
const STATUS_ORDER: GapStatus[] = ['NON CONFORME', 'PARTIEL', 'CONFORME'];
const STATUS_TO_MATURITY: Record<GapStatus, number> = {
  'NON CONFORME': 1,
  PARTIEL: 3,
  CONFORME: 5,
};

export function AuditsPage() {
  const [orgId, setOrgId] = useSelectedOrg();
  const navigate = useNavigate();
  const { reqs, setReqs } = useGap(orgId);

  function cycleStatus(req: GapRequirement) {
    const current = statusFromMaturity(req.maturite);
    const next = STATUS_ORDER[(STATUS_ORDER.indexOf(current) + 1) % STATUS_ORDER.length];
    setReqs(
      reqs.map((r) =>
        r.id === req.id ? { ...r, maturite: STATUS_TO_MATURITY[next] } : r,
      ),
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <PageHeader title="Audit NIS2" description="Contrôles de conformité NIS2" />
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
              <h2 className="text-sm font-bold text-slate-800">Contrôles de conformité NIS2</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Cochez les contrôles satisfaits — la conformité reflète l&apos;analyse d&apos;écart.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/reports')}
              className="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-600 hover:border-teal-300 hover:text-teal-700 transition-colors"
            >
              Rapport →
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {['Domaine', 'Contrôle', 'Réf.', 'Conforme'].map((h) => (
                    <th
                      key={h}
                      className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reqs.map((req) => {
                  const status = statusFromMaturity(req.maturite);
                  return (
                    <tr key={req.id} className="hover:bg-slate-50/50">
                      <td className="px-5 py-3.5 text-slate-700 whitespace-nowrap">{req.domaine}</td>
                      <td className="px-5 py-3.5 text-slate-600">{req.exigence}</td>
                      <td className="px-5 py-3.5 font-mono text-xs text-slate-400 whitespace-nowrap">
                        {req.ref}
                      </td>
                      <td className="px-5 py-3.5">
                        <button
                          type="button"
                          onClick={() => cycleStatus(req)}
                          title="Cliquer pour changer le statut"
                          className={`inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide transition-colors duration-300 hover:opacity-80 ${gapStatusBadge[status]}`}
                        >
                          {status}
                        </button>
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
