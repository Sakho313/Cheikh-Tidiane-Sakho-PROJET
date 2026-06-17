import { Link } from 'react-router-dom';
import { OrgSelector } from '@/components/OrgSelector';
import { useSelectedOrg } from '@/hooks/useSelectedOrg';
import {
  useGap,
  globalMaturity,
  conformityRate,
  domainScores,
} from '@/lib/gapAnalysis';
import { useEbios, openRisksCount, criticalRisksCount } from '@/lib/ebios';

// Operational coverage KPIs (not captured in the gap table) — demo values.
const MFA_COVERAGE = 62;
const EDR_COVERAGE = 48;
const EXERCISES_DONE = 2;

// ── Circular gauge (arc style like the screenshot) ───────────────────────────
function MaturityGauge({ score }: { score: number }) {
  // Draw an arc from ~200° to 340° (lower half arc)
  const R = 58;
  const cx = 70;
  const cy = 75;
  const startAngle = -220; // degrees
  const endAngle = 40;
  const totalSpan = endAngle - startAngle; // 260°

  function polarToXY(angle: number, r: number) {
    const rad = (angle * Math.PI) / 180;
    return {
      x: cx + r * Math.cos(rad),
      y: cy + r * Math.sin(rad),
    };
  }

  function describeArc(start: number, end: number) {
    const s = polarToXY(start, R);
    const e = polarToXY(end, R);
    const large = end - start > 180 ? 1 : 0;
    return `M ${s.x} ${s.y} A ${R} ${R} 0 ${large} 1 ${e.x} ${e.y}`;
  }

  const filledEnd = startAngle + (score / 100) * totalSpan;

  return (
    <div className="flex items-center justify-center">
      <div className="relative w-36 h-32">
        <svg viewBox="0 0 140 120" className="w-full h-full">
          {/* Track */}
          <path
            d={describeArc(startAngle, endAngle)}
            fill="none"
            stroke="#e2e8f0"
            strokeWidth="10"
            strokeLinecap="round"
          />
          {/* Fill — orange/amber like screenshot */}
          <path
            d={describeArc(startAngle, filledEnd)}
            fill="none"
            stroke="#f59e0b"
            strokeWidth="10"
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center pb-2">
          <span className="text-3xl font-bold text-slate-800">{score}%</span>
          <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
            Maturité
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Coverage bar ──────────────────────────────────────────────────────────────
function CoverageBar({
  label,
  value,
  max = 100,
  unit = '%',
  color = 'bg-amber-400',
}: {
  label: string;
  value: number;
  max?: number;
  unit?: string;
  color?: string;
}) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1">
        <span className="text-slate-700">{label}</span>
        <span className="font-semibold text-slate-800">
          {value}
          {unit !== '%' ? '' : '%'}
          {unit !== '%' && (
            <span className="text-slate-500 font-normal ml-0.5">{unit}</span>
          )}
        </span>
      </div>
      <div className="h-2 w-full rounded-full bg-slate-200">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// ── Domain bar (right panel) ──────────────────────────────────────────────────
function DomainRow({ domain, score }: { domain: string; score: number }) {
  const color =
    score < 30 ? 'bg-red-500' : score < 60 ? 'bg-amber-400' : 'bg-emerald-500';
  return (
    <div className="flex items-center gap-3">
      <span className="w-36 shrink-0 text-xs text-slate-700 truncate">{domain}</span>
      <div className="flex-1 h-2 rounded-full bg-slate-100">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${score}%` }} />
      </div>
      <span className="w-8 text-right text-xs font-semibold text-slate-500">{score}%</span>
    </div>
  );
}

// ── Priority actions (demo data) ─────────────────────────────────────────────
type ActionPriorite = 'HAUTE' | 'MOYENNE' | 'BASSE';
type ActionStatut = 'EN COURS' | 'À FAIRE' | 'TERMINÉ';

interface PriorityAction {
  action: string;
  responsable: string;
  echeance: string;
  priorite: ActionPriorite;
  statut: ActionStatut;
}

const PRIORITY_ACTIONS: PriorityAction[] = [
  { action: "Tester le circuit de notification d'incident", responsable: 'RSSI', echeance: '2026-07-31', priorite: 'HAUTE', statut: 'EN COURS' },
  { action: 'Constituer le registre des fournisseurs critiques', responsable: 'Achats', echeance: '2026-08-15', priorite: 'HAUTE', statut: 'À FAIRE' },
  { action: 'Généraliser le MFA aux comptes à privilèges', responsable: 'DSI', echeance: '2026-09-30', priorite: 'MOYENNE', statut: 'EN COURS' },
  { action: 'Réaliser un exercice de gestion de crise (Table Top)', responsable: 'RSSI', echeance: '2026-10-15', priorite: 'MOYENNE', statut: 'À FAIRE' },
  { action: "Mettre à jour l'analyse de risque EBIOS RM", responsable: 'RSSI', echeance: '2026-07-20', priorite: 'HAUTE', statut: 'EN COURS' },
];

const prioriteBadge: Record<ActionPriorite, string> = {
  HAUTE: 'bg-red-50 text-red-600 border border-red-200',
  MOYENNE: 'bg-amber-50 text-amber-700 border border-amber-200',
  BASSE: 'bg-slate-50 text-slate-600 border border-slate-200',
};

const statutBadge: Record<ActionStatut, string> = {
  'EN COURS': 'bg-teal-50 text-teal-700 border border-teal-200',
  'À FAIRE': 'bg-slate-50 text-slate-500 border border-slate-200',
  TERMINÉ: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
};

// ── Page ─────────────────────────────────────────────────────────────────────
export function DashboardPage() {
  const [orgId, setOrgId] = useSelectedOrg();
  const { reqs } = useGap(orgId);
  const { risks } = useEbios(orgId);

  // Maturity + conformity derived from the live gap-analysis data.
  const maturity = globalMaturity(reqs);
  const conformity = conformityRate(reqs);

  // Risk KPIs from the live EBIOS register.
  const openRisks = openRisksCount(risks);
  const criticalRisks = criticalRisksCount(risks);

  // Operational coverage (demo constants).
  const mfaScore = MFA_COVERAGE;
  const edrScore = EDR_COVERAGE;
  const exercisesCount = EXERCISES_DONE;

  // Priority actions overdue vs. open.
  const today = new Date();
  const overdueCount = PRIORITY_ACTIONS.filter(
    (a) => a.statut !== 'TERMINÉ' && new Date(a.echeance) < today,
  ).length;
  const openActionsCount = PRIORITY_ACTIONS.filter((a) => a.statut !== 'TERMINÉ').length;

  // Domains sorted weakest first.
  const domainEntries = domainScores(reqs)
    .map((d) => [d.domaine, d.score] as [string, number])
    .sort((a, b) => a[1] - b[1]);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Page title + org selector */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Tableau de bord</h1>
          <p className="mt-0.5 text-sm text-slate-500">Vue consolidée du pilotage NIS2</p>
        </div>
        <OrgSelector value={orgId} onChange={setOrgId} />
      </div>

      {!orgId ? (
        <div className="rounded-xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <p className="text-slate-500">
            Sélectionnez une organisation pour afficher le tableau de bord.
          </p>
        </div>
      ) : (
        <>
          {/* ── Top 4 stat cards ── */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 mb-6">
            {/* 1 — Maturité (dark teal card) */}
            <div
              className="rounded-xl p-5 shadow-sm text-white"
              style={{ backgroundColor: '#0d4a3a' }}
            >
              <p className="text-xs font-semibold uppercase tracking-wider text-white/60 mb-1">
                Maturité NIS2 globale
              </p>
              <p className="text-4xl font-bold">{maturity}%</p>
              <p className="mt-1 text-xs text-white/50">moyenne art. 21 + ReCyF</p>
            </div>

            {/* 2 — Taux de conformité */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                Taux de conformité
              </p>
              <p className={`text-4xl font-bold ${conformity === 0 ? 'text-red-500' : 'text-emerald-600'}`}>
                {conformity}%
              </p>
              <p className="mt-1 text-xs text-slate-400">exigences conformes</p>
            </div>

            {/* 3 — Risques ouverts */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                Risques ouverts
              </p>
              <p className="text-4xl font-bold text-slate-800">
                {openRisks}
                <span
                  className={`ml-2 text-base font-semibold ${criticalRisks > 0 ? 'text-red-500' : 'text-red-400'}`}
                >
                  · {criticalRisks} critique{criticalRisks > 1 ? 's' : ''}
                </span>
              </p>
              <p className="mt-1 text-xs text-slate-400">registre EBIOS RM</p>
            </div>

            {/* 4 — Actions en retard */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                Actions en retard
              </p>
              <p className={`text-4xl font-bold ${overdueCount > 0 ? 'text-red-500' : 'text-emerald-600'}`}>
                {overdueCount}
              </p>
              <p className="mt-1 text-xs text-slate-400">{openActionsCount} actions ouvertes</p>
            </div>
          </div>

          {/* ── Bottom panels ── */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* Left — Maturité & couverture */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-base font-bold text-slate-800">Maturité &amp; couverture</h2>
              <p className="text-xs text-slate-400 mb-5">État de préparation global</p>

              <div className="flex items-center gap-6">
                <MaturityGauge score={maturity} />
                <div className="flex-1 space-y-4 min-w-0">
                  <CoverageBar
                    label="Couverture MFA"
                    value={mfaScore}
                    color="bg-amber-400"
                  />
                  <CoverageBar
                    label="Couverture EDR"
                    value={edrScore}
                    color="bg-amber-400"
                  />
                  <CoverageBar
                    label="Exercices réalisés (année)"
                    value={exercisesCount}
                    max={Math.max(exercisesCount, 5)}
                    unit=" ex."
                    color="bg-teal-500"
                  />
                </div>
              </div>
            </div>

            {/* Right — Maturité par domaine */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between mb-1">
                <div>
                  <h2 className="text-base font-bold text-slate-800">Maturité par domaine</h2>
                  <p className="text-xs text-slate-400">Les plus faibles en premier</p>
                </div>
                <Link
                  to="/compliance"
                  className="text-xs font-semibold text-teal-600 hover:text-teal-700 whitespace-nowrap"
                >
                  Détail →
                </Link>
              </div>

              {domainEntries.length === 0 ? (
                <p className="mt-4 text-sm text-slate-400">
                  Aucune évaluation enregistrée.
                </p>
              ) : (
                <div className="mt-4 space-y-3">
                  {domainEntries.map(([domain, score]) => (
                    <DomainRow key={domain} domain={domain} score={score} />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Actions prioritaires ── */}
          <div className="mt-4 rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="flex items-start justify-between px-6 py-5">
              <div>
                <h2 className="text-base font-bold text-slate-800">Actions prioritaires</h2>
                <p className="text-xs text-slate-400">Échéances et statuts</p>
              </div>
              <Link
                to="/roadmap"
                className="shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-teal-600 hover:border-teal-300 hover:text-teal-700 transition-colors whitespace-nowrap"
              >
                Feuille de route →
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-y border-slate-100">
                    {['Action', 'Responsable', 'Échéance', 'Priorité', 'Statut'].map((h) => (
                      <th key={h} className="px-6 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {PRIORITY_ACTIONS.map((a) => (
                    <tr key={a.action} className="hover:bg-slate-50/50">
                      <td className="px-6 py-3.5 font-medium text-slate-800">{a.action}</td>
                      <td className="px-6 py-3.5 text-slate-600">{a.responsable}</td>
                      <td className="px-6 py-3.5 text-slate-600 whitespace-nowrap">{a.echeance}</td>
                      <td className="px-6 py-3.5">
                        <span className={`inline-flex items-center rounded px-2 py-0.5 text-[10px] font-bold tracking-wide ${prioriteBadge[a.priorite]}`}>
                          {a.priorite}
                        </span>
                      </td>
                      <td className="px-6 py-3.5">
                        <span className={`inline-flex items-center rounded px-2 py-0.5 text-[10px] font-bold tracking-wide ${statutBadge[a.statut]}`}>
                          {a.statut}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
