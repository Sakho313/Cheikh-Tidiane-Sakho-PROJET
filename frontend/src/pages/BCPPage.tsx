import { PageHeader } from '@/components/ui/PageHeader';
import { OrgSelector } from '@/components/OrgSelector';
import { useSelectedOrg } from '@/hooks/useSelectedOrg';

const BCP_ELEMENTS = [
  {
    phase: 'Prévention',
    color: 'bg-emerald-500',
    items: [
      'Identification des services critiques',
      "Analyse d’impact sur l’activité (BIA)",
      'Définition des objectifs RTO / RPO',
    ],
  },
  {
    phase: 'Préparation',
    color: 'bg-blue-500',
    items: [
      "Plan de continuité d’activité (PCA)",
      'Plan de reprise informatique (PRA)',
      'Stratégies de sauvegarde et restauration',
    ],
  },
  {
    phase: 'Réponse',
    color: 'bg-amber-500',
    items: [
      "Procédures d’activation du PCA/PRA",
      'Cellule de crise et communication',
      'Basculement sur infrastructure de secours',
    ],
  },
  {
    phase: 'Reprise',
    color: 'bg-purple-500',
    items: [
      'Tests de reprise et exercices',
      'Retour à la normale (retour sur site)',
      'Bilan post-incident et amélioration',
    ],
  },
];

export function BCPPage() {
  const [orgId, setOrgId] = useSelectedOrg();

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <PageHeader
          title="PCA / PRA"
          description="Plan de continuité d'activité et plan de reprise après sinistre (NIS2 Art. 21(2)(c))"
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
                La gestion complète des plans PCA/PRA sera disponible prochainement.
              </p>
            </div>
          </div>

          {/* Cycle PCA */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {BCP_ELEMENTS.map((el, idx) => (
              <div key={el.phase} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className={`flex h-7 w-7 items-center justify-center rounded-full text-white text-xs font-bold ${el.color}`}
                  >
                    {idx + 1}
                  </div>
                  <h3 className="font-semibold text-slate-800">{el.phase}</h3>
                </div>
                <ul className="space-y-1.5">
                  {el.items.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-slate-600">
                      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-slate-300 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* RTO / RPO reminder */}
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-5 shadow-sm">
              <p className="text-xs font-medium text-blue-600 uppercase tracking-wider mb-1">
                RTO — Recovery Time Objective
              </p>
              <p className="text-2xl font-bold text-blue-800">À définir</p>
              <p className="text-xs text-blue-700 mt-1">
                Durée maximale d&apos;interruption acceptable par service critique.
              </p>
            </div>
            <div className="rounded-xl border border-purple-200 bg-purple-50 p-5 shadow-sm">
              <p className="text-xs font-medium text-purple-600 uppercase tracking-wider mb-1">
                RPO — Recovery Point Objective
              </p>
              <p className="text-2xl font-bold text-purple-800">À définir</p>
              <p className="text-xs text-purple-700 mt-1">
                Perte de données maximale acceptable (âge des sauvegardes).
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
