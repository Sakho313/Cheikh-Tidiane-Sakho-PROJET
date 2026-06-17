import { PageHeader } from '@/components/ui/PageHeader';
import { OrgSelector } from '@/components/OrgSelector';
import { useSelectedOrg } from '@/hooks/useSelectedOrg';
import { Badge } from '@/components/ui/Badge';

const SUPPLIER_REQUIREMENTS = [
  {
    area: 'Évaluation des risques fournisseurs',
    article: 'Art. 21(2)(d)',
    status: 'PENDING' as const,
    desc: 'Évaluer les pratiques de sécurité des fournisseurs directs et prestataires.',
  },
  {
    area: 'Exigences contractuelles',
    article: 'Art. 21(2)(d)',
    status: 'PENDING' as const,
    desc: 'Intégrer des clauses de sécurité dans les contrats fournisseurs.',
  },
  {
    area: 'Surveillance continue',
    article: 'Art. 21(2)(d)',
    status: 'PENDING' as const,
    desc: 'Mettre en place un processus de surveillance continue des fournisseurs critiques.',
  },
  {
    area: 'Plan de sortie / substitution',
    article: 'Art. 21(2)(c)',
    status: 'PENDING' as const,
    desc: "Définir des plans de sortie en cas de défaillance d'un fournisseur critique.",
  },
];

const RISK_TIERS = [
  { tier: 'Critique', color: 'bg-red-100 border-red-300', badge: 'red' as const, desc: 'Fournisseurs dont la défaillance stopperait les services essentiels.' },
  { tier: 'Élevé', color: 'bg-orange-100 border-orange-300', badge: 'orange' as const, desc: 'Fournisseurs avec accès aux systèmes ou données sensibles.' },
  { tier: 'Standard', color: 'bg-slate-100 border-slate-300', badge: 'gray' as const, desc: 'Fournisseurs à faible impact sur la continuité opérationnelle.' },
];

export function SuppliersPage() {
  const [orgId, setOrgId] = useSelectedOrg();

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <PageHeader
          title="Fournisseurs"
          description="Gestion du risque tiers et sécurité de la chaîne d'approvisionnement (NIS2 Art. 21(2)(d))"
        />
        <OrgSelector value={orgId} onChange={setOrgId} />
      </div>

      {!orgId ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <p className="text-slate-500 text-sm">Sélectionnez une organisation.</p>
        </div>
      ) : (
        <>
          <div className="mb-6 rounded-xl border border-teal-200 bg-teal-50 p-4 flex items-start gap-3">
            <span className="text-teal-500 text-lg shrink-0">ℹ</span>
            <div>
              <p className="text-sm font-semibold text-teal-800">Module en cours de développement</p>
              <p className="text-xs text-teal-700 mt-0.5">
                La gestion de l&apos;inventaire des fournisseurs sera disponible prochainement.
              </p>
            </div>
          </div>

          {/* Risk tiers */}
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {RISK_TIERS.map((tier) => (
              <div key={tier.tier} className={`rounded-xl border p-4 shadow-sm ${tier.color}`}>
                <div className="flex items-center gap-2 mb-2">
                  <Badge tone={tier.badge}>{tier.tier}</Badge>
                </div>
                <p className="text-xs text-slate-600">{tier.desc}</p>
              </div>
            ))}
          </div>

          {/* NIS2 requirements checklist */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <h2 className="text-sm font-semibold text-slate-700">
                Exigences NIS2 — Chaîne d&apos;approvisionnement
              </h2>
            </div>
            <ul className="divide-y divide-slate-50">
              {SUPPLIER_REQUIREMENTS.map((req) => (
                <li key={req.area} className="flex items-start gap-4 px-5 py-4">
                  <div className="mt-0.5 h-4 w-4 shrink-0 rounded border-2 border-slate-300" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-0.5">
                      <p className="font-semibold text-slate-800 text-sm">{req.area}</p>
                      <span className="font-mono text-[10px] text-slate-400">{req.article}</span>
                    </div>
                    <p className="text-xs text-slate-500">{req.desc}</p>
                  </div>
                  <Badge tone="gray">En attente</Badge>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
