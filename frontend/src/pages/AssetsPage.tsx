import { PageHeader } from '@/components/ui/PageHeader';
import { OrgSelector } from '@/components/OrgSelector';
import { useSelectedOrg } from '@/hooks/useSelectedOrg';

const ASSET_CATEGORIES = [
  {
    label: 'Systèmes d\'information',
    icon: '🖥',
    examples: ['Serveurs', 'Postes de travail', 'Systèmes industriels (SCADA/ICS)'],
    color: 'bg-blue-50 border-blue-200',
  },
  {
    label: 'Réseaux & communications',
    icon: '🌐',
    examples: ['Firewalls', 'Routeurs', 'VPN', 'Commutateurs'],
    color: 'bg-teal-50 border-teal-200',
  },
  {
    label: 'Applications & services',
    icon: '⚙️',
    examples: ['ERP', 'Messagerie', 'Applications métier', 'Services cloud'],
    color: 'bg-purple-50 border-purple-200',
  },
  {
    label: 'Données sensibles',
    icon: '🗄',
    examples: ['Données personnelles', 'Données confidentielles', 'Sauvegardes'],
    color: 'bg-amber-50 border-amber-200',
  },
];

export function AssetsPage() {
  const [orgId, setOrgId] = useSelectedOrg();

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <PageHeader
          title="Actifs"
          description="Inventaire des actifs critiques et systèmes d'information (NIS2 Art. 21)"
        />
        <OrgSelector value={orgId} onChange={setOrgId} />
      </div>

      {!orgId ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <p className="text-slate-500 text-sm">Sélectionnez une organisation.</p>
        </div>
      ) : (
        <>
          {/* Coming soon notice */}
          <div className="mb-6 rounded-xl border border-teal-200 bg-teal-50 p-4 flex items-start gap-3">
            <span className="text-teal-500 text-lg shrink-0">ℹ</span>
            <div>
              <p className="text-sm font-semibold text-teal-800">Module en cours de développement</p>
              <p className="text-xs text-teal-700 mt-0.5">
                La gestion complète de l&apos;inventaire des actifs sera disponible prochainement.
                En attendant, les catégories ci-dessous illustrent la structure cible.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {ASSET_CATEGORIES.map((cat) => (
              <div
                key={cat.label}
                className={`rounded-xl border p-5 shadow-sm ${cat.color}`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">{cat.icon}</span>
                  <h3 className="font-semibold text-slate-800">{cat.label}</h3>
                </div>
                <ul className="space-y-1">
                  {cat.examples.map((ex) => (
                    <li key={ex} className="flex items-center gap-2 text-sm text-slate-600">
                      <span className="h-1 w-1 rounded-full bg-slate-400 shrink-0" />
                      {ex}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-700 mb-3">
              Exigences NIS2 relatives aux actifs
            </h2>
            <ul className="space-y-2 text-sm text-slate-600">
              <li className="flex items-start gap-2">
                <span className="mt-0.5 h-4 w-4 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500 shrink-0">
                  A
                </span>
                <span>
                  <strong>Art. 21(2)(i)</strong> — Politique de gestion des actifs et contrôle
                  d&apos;accès basé sur le principe de moindre privilège.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 h-4 w-4 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500 shrink-0">
                  B
                </span>
                <span>
                  <strong>Art. 21(2)(e)</strong> — Sécurité dans l&apos;acquisition, le
                  développement et la maintenance des systèmes.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 h-4 w-4 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500 shrink-0">
                  C
                </span>
                <span>
                  <strong>Art. 21(2)(a)</strong> — Identification des actifs dans le cadre de
                  l&apos;analyse des risques.
                </span>
              </li>
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
