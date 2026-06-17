import { useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { OrgSelector } from '@/components/OrgSelector';
import { useSelectedOrg } from '@/hooks/useSelectedOrg';
import { useOrganizations } from '@/hooks/useOrganizations';
import { entityTypeLabels } from '@/lib/labels';

const DOCUMENTS = [
  { id: 'bia', label: 'Business Impact Analysis (BIA)' },
  { id: 'carto', label: 'Cartographie des processus critiques' },
  { id: 'pca', label: "Plan de Continuité d'Activité (PCA)" },
  { id: 'pra', label: "Plan de Reprise d'Activité (PRA)" },
  { id: 'backup', label: 'Stratégie de sauvegarde (3-2-1, immuabilité)' },
  { id: 'tests', label: "Programme de tests et d'exercices" },
];

const SCENARIOS = [
  'Cyberattaque',
  'Rançongiciel',
  'Perte de datacenter',
  'Indisponibilité cloud',
  'Fuite de données',
  'Compromission Active Directory',
  'Rupture fournisseur',
];

function generateTemplate(docId: string, orgName: string, today: string): string {
  const header = `MODÈLE — ${docId.toUpperCase()} — ${orgName}  ·  Date : ${today}\n\n`;
  const sections: Record<string, string> = {
    bia: header +
      '1. Objet et périmètre\n' +
      '2. Rôles et responsabilités\n' +
      '3. Déroulé / étapes clés\n' +
      '4. Critères de déclenchement\n' +
      '5. Livrables et preuves\n' +
      '6. Indicateurs de suivi (KPI)\n' +
      '7. Modalités de test / révision\n\n' +
      '— Trame SAO Pilotage NIS2, à compléter avec vos éléments internes.',
    carto: header +
      '1. Liste des processus métier critiques\n' +
      '2. Dépendances SI (applications, serveurs, cloud)\n' +
      '3. Dépendances humaines (équipes clés)\n' +
      '4. Dépendances fournisseurs tiers\n' +
      '5. Flux et interconnexions\n' +
      '6. Points de défaillance uniques (SPOF)\n\n' +
      '— Trame SAO Pilotage NIS2, à compléter avec vos éléments internes.',
    pca: header +
      '1. Objectifs RTO / RPO par processus\n' +
      '2. Stratégies de continuité retenues\n' +
      '3. Procédures de déclenchement\n' +
      '4. Organisation de crise (cellule, rôles)\n' +
      '5. Ressources alternatives (sites, cloud, équipes)\n' +
      '6. Communication interne / externe\n' +
      '7. Retour à la normale\n\n' +
      '— Trame SAO Pilotage NIS2, à compléter avec vos éléments internes.',
    pra: header +
      '1. Périmètre SI couvert\n' +
      '2. RPO et RTO cibles par système\n' +
      '3. Architecture de reprise (site DR, cloud)\n' +
      '4. Procédures de bascule\n' +
      '5. Procédures de restauration depuis sauvegardes\n' +
      '6. Tests de reprise et fréquence\n' +
      '7. Critères de retour en production\n\n' +
      '— Trame SAO Pilotage NIS2, à compléter avec vos éléments internes.',
    backup: header +
      '1. Règle 3-2-1 : 3 copies, 2 supports, 1 hors site\n' +
      '2. Immuabilité des sauvegardes (WORM)\n' +
      '3. Fréquence et rétention par type de données\n' +
      '4. Chiffrement des sauvegardes\n' +
      '5. Tests de restauration (fréquence, résultats)\n' +
      '6. Supervision et alertes\n\n' +
      '— Trame SAO Pilotage NIS2, à compléter avec vos éléments internes.',
    tests: header +
      '1. Calendrier annuel des exercices\n' +
      '2. Types d\'exercices (table-top, simulation, DR drill)\n' +
      '3. Scénarios testés\n' +
      '4. Participants et rôles\n' +
      '5. Critères de succès\n' +
      '6. Bilan et plan d\'amélioration\n\n' +
      '— Trame SAO Pilotage NIS2, à compléter avec vos éléments internes.',
  };
  return sections[docId] ?? header + '— Trame à définir.';
}

function generateScenario(scenario: string, orgName: string, today: string): string {
  return `SCÉNARIO — ${scenario.toUpperCase()}\nOrganisation : ${orgName}  ·  Date : ${today}\n\n` +
    `1. Description du scénario\n   ${scenario} — impact potentiel sur les services essentiels.\n\n` +
    `2. Déclenchement PCA/PRA\n   Critères d'activation, seuils de décision, responsable.\n\n` +
    `3. Actions immédiates (0-4h)\n   Isolation, notification, activation cellule de crise.\n\n` +
    `4. Actions à court terme (4-24h)\n   Bascule sur infrastructure de secours, communication.\n\n` +
    `5. Actions à moyen terme (24h-72h)\n   Reprise progressive, notification autorités NIS2 si applicable.\n\n` +
    `6. Retour à la normale\n   Critères de levée du PCA, bilan post-incident.\n\n` +
    `— Trame SAO Pilotage NIS2, à compléter avec vos éléments internes.`;
}

export function BCPPage() {
  const [orgId, setOrgId] = useSelectedOrg();
  const { data: orgsPage } = useOrganizations();
  const orgs = orgsPage?.data;
  const selectedOrg = orgs?.find((o) => o.id === orgId);

  const [activeTemplate, setActiveTemplate] = useState<string | null>(null);
  const [templateContent, setTemplateContent] = useState('');

  const today = new Date().toISOString().slice(0, 10);
  const orgName = selectedOrg
    ? `${selectedOrg.name} · Entité ${entityTypeLabels[selectedOrg.entityType]}`
    : 'Organisation';

  function showDoc(docId: string) {
    setTemplateContent(generateTemplate(docId, orgName, today));
    setActiveTemplate(docId);
  }

  function showScenario(scenario: string) {
    setTemplateContent(generateScenario(scenario, orgName, today));
    setActiveTemplate(`scenario-${scenario}`);
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <PageHeader
          title="PCA / PRA"
          description="Continuité et reprise d'activité"
        />
        <OrgSelector value={orgId} onChange={setOrgId} />
      </div>

      {!orgId ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <p className="text-slate-500 text-sm">Sélectionnez une organisation.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Documents list */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="flex items-start justify-between px-5 py-4 border-b border-slate-100">
              <div>
                <h2 className="text-sm font-bold text-slate-800">
                  Continuité &amp; reprise d&apos;activité (PCA / PRA)
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Anticiper l&apos;indisponibilité des systèmes essentiels : BIA, plans, et tests
                  réguliers exigés par l&apos;article 21.2.c.
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-teal-50 border border-teal-200 px-2.5 py-0.5 text-xs font-semibold text-teal-700">
                Génération assistée
              </span>
            </div>

            <ul className="divide-y divide-slate-100">
              {DOCUMENTS.map((doc) => (
                <li
                  key={doc.id}
                  className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-50/50"
                >
                  <div className="flex items-center gap-3">
                    <span className="h-2 w-2 rounded-full bg-teal-500 shrink-0" />
                    <span className="text-sm text-slate-800">{doc.label}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => showDoc(doc.id)}
                    className="shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 hover:border-teal-300 hover:text-teal-700 transition-colors"
                  >
                    Générer un modèle
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Scenarios */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-sm font-bold text-slate-800">Scénarios de continuité</h2>
            <div className="flex flex-wrap gap-2">
              {SCENARIOS.map((sc) => (
                <button
                  key={sc}
                  type="button"
                  onClick={() => showScenario(sc)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                    activeTemplate === `scenario-${sc}`
                      ? 'border-teal-500 bg-teal-50 text-teal-700'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-teal-300 hover:text-teal-600'
                  }`}
                >
                  {sc}
                </button>
              ))}
            </div>
          </div>

          {/* Generated template */}
          {templateContent && (
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <pre className="text-xs text-slate-700 font-mono leading-relaxed whitespace-pre-wrap overflow-x-auto">
                {templateContent}
              </pre>
              <p className="mt-4 text-[11px] text-slate-400 border-t border-slate-100 pt-3">
                Ces modèles sont des <strong>trames de structure</strong> générées localement, prêtes à être
                complétées. La rédaction intégrale par IA se branche sur l&apos;API Claude via votre backend.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
