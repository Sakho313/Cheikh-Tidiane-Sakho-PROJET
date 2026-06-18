import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/ui/PageHeader';
import { OrgSelector } from '@/components/OrgSelector';
import { useSelectedOrg } from '@/hooks/useSelectedOrg';
import { useOrganizations } from '@/hooks/useOrganizations';
import { entityTypeLabels } from '@/lib/labels';
import { useGap, globalMaturity, conformityRate, nonConformCount } from '@/lib/gapAnalysis';
import { useEbios, openRisksCount, criticalRisksCount } from '@/lib/ebios';
import { useRoadmap, openCount, overdueCount } from '@/lib/roadmap';
import { useSuppliers, pendingEvaluationCount } from '@/lib/suppliers';
import { useVulns, criticalOpenCount } from '@/lib/vulnerabilities';

const GOVERNANCE_CHECKS = [
  { id: 'g1', label: "L'organe de direction a approuvé la politique de sécurité (PSSI)" },
  { id: 'g2', label: "L'organe de direction a été informé des risques cyber majeurs" },
  { id: 'g3', label: "Les membres de la direction ont suivi une formation NIS2" },
  { id: 'g4', label: "Le RSSI rend compte directement à la direction générale" },
  { id: 'g5', label: "Un budget cybersécurité dédié a été validé pour l'exercice" },
  { id: 'g6', label: "La direction a approuvé le plan de réponse aux incidents" },
  { id: 'g7', label: "Un comité de sécurité se réunit au minimum trimestriellement" },
];

const CALENDAR = [
  { date: '2026-07-15', label: 'Comité de sécurité — revue risques T2', type: 'comite' },
  { date: '2026-09-01', label: 'Révision annuelle de la PSSI', type: 'review' },
  { date: '2026-10-01', label: 'Audit NIS2 externe programmé', type: 'audit' },
  { date: '2026-12-15', label: 'Exercice de gestion de crise (table top)', type: 'exercice' },
  { date: '2027-01-31', label: "Rapport annuel de conformité NIS2 à l'ANSSI", type: 'regulatory' },
];

const calTypeBadge: Record<string, string> = {
  comite: 'bg-teal-50 text-teal-700 border-teal-200',
  review: 'bg-blue-50 text-blue-700 border-blue-200',
  audit: 'bg-purple-50 text-purple-700 border-purple-200',
  exercice: 'bg-amber-50 text-amber-700 border-amber-200',
  regulatory: 'bg-red-50 text-red-700 border-red-200',
};

function daysUntil(dateStr: string): number {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
}

function maturityLevel(m: number): { label: string; color: string; bg: string } {
  if (m >= 80) return { label: 'CONFORME', color: 'text-emerald-700', bg: 'bg-emerald-500' };
  if (m >= 60) return { label: 'EN BONNE VOIE', color: 'text-teal-700', bg: 'bg-teal-500' };
  if (m >= 40) return { label: 'EN PROGRESSION', color: 'text-amber-700', bg: 'bg-amber-500' };
  if (m >= 20) return { label: 'PARTIEL', color: 'text-orange-700', bg: 'bg-orange-500' };
  return { label: 'NON CONFORME', color: 'text-red-700', bg: 'bg-red-500' };
}

function ExecCard({
  label, value, sub, link, accent = 'text-slate-800',
}: {
  label: string; value: string | number; sub?: string; link?: string; accent?: string;
}) {
  const content = (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">{label}</p>
      <p className={`mt-1 text-4xl font-bold ${accent}`}>{value}</p>
      {sub && <p className="mt-1 text-xs text-slate-400">{sub}</p>}
      {link && <p className="mt-2 text-xs font-semibold text-teal-600">Voir le détail →</p>}
    </div>
  );
  return link ? <Link to={link}>{content}</Link> : content;
}

export function DirectionPage() {
  const [orgId, setOrgId] = useSelectedOrg();
  const { data: orgsPage } = useOrganizations();
  const orgs = orgsPage?.data;
  const selectedOrg = orgs?.find((o) => o.id === orgId);

  const { reqs } = useGap(orgId);
  const { risks } = useEbios(orgId);
  const { actions } = useRoadmap(orgId);
  const { suppliers } = useSuppliers(orgId);
  const { vulns } = useVulns(orgId);

  const maturity = globalMaturity(reqs);
  const conformity = conformityRate(reqs);
  const openRisks = openRisksCount(risks);
  const critRisks = criticalRisksCount(risks);
  const nonConform = nonConformCount(reqs);
  const openActions = openCount(actions);
  const overdue = overdueCount(actions);
  const suppliersPending = pendingEvaluationCount(suppliers);
  const critVulns = criticalOpenCount(vulns);

  const level = maturityLevel(maturity);

  const [checks, setChecks] = useState<Set<string>>(new Set());
  function toggle(id: string) {
    setChecks((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }

  const today = new Date().toISOString().slice(0, 10);
  const orgLabel = selectedOrg
    ? `${selectedOrg.name} · Entité ${entityTypeLabels[selectedOrg.entityType]}`
    : '—';

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-0.5">
            <PageHeader title="Tableau de bord Direction" description="" />
            <span className="rounded-full border border-teal-200 bg-teal-50 px-2.5 py-0.5 text-xs font-bold text-teal-700">
              Art. 20 NIS2
            </span>
          </div>
          <p className="text-sm text-slate-500">
            Synthèse exécutive — {orgLabel} — {today}
          </p>
        </div>
        <OrgSelector value={orgId} onChange={setOrgId} />
      </div>

      {!orgId ? (
        <div className="rounded-xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <p className="text-slate-500 text-sm">Sélectionnez une organisation.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {/* NIS2 compliance level banner */}
          <div className="rounded-xl overflow-hidden shadow-sm" style={{ background: 'linear-gradient(135deg, #0d2e26 0%, #0d4a3a 100%)' }}>
            <div className="px-6 py-5 flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-white/50 mb-1">
                  Niveau de conformité NIS2
                </p>
                <p className={`text-3xl font-black ${level.color.replace('text-', 'text-').replace('700', '300').replace('emerald', 'emerald').replace('teal', 'teal').replace('amber', 'amber').replace('orange', 'orange').replace('red', 'red')}`}
                  style={{ color: level.bg.includes('emerald') ? '#6ee7b7' : level.bg.includes('teal') ? '#5eead4' : level.bg.includes('amber') ? '#fcd34d' : level.bg.includes('orange') ? '#fdba74' : '#fca5a5' }}>
                  {level.label}
                </p>
                <p className="text-xs text-white/40 mt-1">
                  Directive (UE) 2022/2555 · Articles 20 &amp; 21 · ReCyF ANSSI
                </p>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <p className="text-4xl font-black text-white">{maturity}%</p>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-white/50 mt-0.5">Maturité</p>
                </div>
                <div className="h-12 w-px bg-white/10" />
                <div className="text-center">
                  <p className="text-4xl font-black text-white">{conformity}%</p>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-white/50 mt-0.5">Conformité</p>
                </div>
              </div>
            </div>
            {/* Progress bar */}
            <div className="h-1.5 bg-white/10">
              <div
                className={`h-full ${level.bg} transition-all duration-700`}
                style={{ width: `${maturity}%` }}
              />
            </div>
          </div>

          {/* 6 KPI cards */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
            <ExecCard
              label="Écarts non conformes"
              value={nonConform}
              sub={`sur ${reqs.length} exigences Art. 21`}
              link="/compliance"
              accent={nonConform > 5 ? 'text-red-600' : nonConform > 2 ? 'text-amber-600' : 'text-emerald-600'}
            />
            <ExecCard
              label="Risques critiques (EBIOS)"
              value={critRisks}
              sub={`${openRisks} risques ouverts au total`}
              link="/risks"
              accent={critRisks > 0 ? 'text-red-600' : 'text-emerald-600'}
            />
            <ExecCard
              label="Actions en retard"
              value={overdue}
              sub={`${openActions} actions ouvertes — feuille de route`}
              link="/roadmap"
              accent={overdue > 0 ? 'text-red-600' : 'text-emerald-600'}
            />
            <ExecCard
              label="Vulnérabilités critiques"
              value={critVulns}
              sub="CVSS ≥ 9 non patchées"
              link="/vulnerabilities"
              accent={critVulns > 0 ? 'text-red-600' : 'text-emerald-600'}
            />
            <ExecCard
              label="Fournisseurs à évaluer"
              value={suppliersPending}
              sub="Chaîne d'appro. — Art. 21.2.d"
              link="/suppliers"
              accent={suppliersPending > 2 ? 'text-amber-600' : 'text-emerald-600'}
            />
            <ExecCard
              label="Score NIS2 global"
              value={`${Math.round((maturity + conformity) / 2)}%`}
              sub="Indice composite maturité + conformité"
              accent={Math.round((maturity + conformity) / 2) >= 60 ? 'text-teal-700' : 'text-amber-600'}
            />
          </div>

          {/* Governance checklist + Calendar */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* Art. 20 checklist */}
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-slate-800">Obligations de gouvernance</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Article 20 — responsabilité de l&apos;organe de direction</p>
                </div>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                  {checks.size}/{GOVERNANCE_CHECKS.length}
                </span>
              </div>
              <ul className="divide-y divide-slate-100">
                {GOVERNANCE_CHECKS.map((item) => (
                  <li key={item.id} className="flex items-start gap-3 px-5 py-3.5 hover:bg-slate-50/50">
                    <input
                      type="checkbox"
                      id={`gov-${item.id}`}
                      checked={checks.has(item.id)}
                      onChange={() => toggle(item.id)}
                      className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 accent-teal-600"
                    />
                    <label
                      htmlFor={`gov-${item.id}`}
                      className={`text-sm cursor-pointer leading-snug ${checks.has(item.id) ? 'line-through text-slate-400' : 'text-slate-700'}`}
                    >
                      {item.label}
                    </label>
                    {checks.has(item.id) && (
                      <span className="ml-auto shrink-0 text-[10px] font-semibold text-emerald-600">✓</span>
                    )}
                  </li>
                ))}
              </ul>
              {/* Progress bar */}
              <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50">
                <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
                  <span>Progression Art. 20</span>
                  <span className="font-semibold text-teal-700">{Math.round((checks.size / GOVERNANCE_CHECKS.length) * 100)}%</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full bg-teal-500 transition-all duration-500"
                    style={{ width: `${(checks.size / GOVERNANCE_CHECKS.length) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Regulatory calendar */}
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100">
                <h2 className="text-sm font-bold text-slate-800">Calendrier réglementaire</h2>
                <p className="text-xs text-slate-500 mt-0.5">Prochaines échéances NIS2 et gouvernance</p>
              </div>
              <ul className="divide-y divide-slate-100">
                {CALENDAR.map((ev) => {
                  const days = daysUntil(ev.date);
                  return (
                    <li key={ev.date} className="flex items-start gap-3 px-5 py-3.5 hover:bg-slate-50/50">
                      <div className="shrink-0 text-center w-10">
                        <p className={`text-lg font-black leading-none ${days <= 30 ? 'text-red-600' : days <= 90 ? 'text-amber-600' : 'text-slate-500'}`}>
                          {days <= 0 ? '!' : days}
                        </p>
                        <p className="text-[9px] font-semibold uppercase text-slate-400">
                          {days <= 0 ? 'Passé' : 'jours'}
                        </p>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-slate-700 leading-snug">{ev.label}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{ev.date}</p>
                      </div>
                      <span className={`shrink-0 self-center rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase ${calTypeBadge[ev.type]}`}>
                        {ev.type}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          {/* Footer */}
          <p className="text-center text-[11px] text-slate-400">
            Directive (UE) 2022/2555 — Art. 20 : responsabilité de l&apos;organe de direction. Art. 21 : mesures de gestion des risques. Art. 23 : obligations de notification.
          </p>
        </div>
      )}
    </div>
  );
}
