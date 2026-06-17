import { useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { OrgSelector } from '@/components/OrgSelector';
import { useSelectedOrg } from '@/hooks/useSelectedOrg';
import { useOrganizations } from '@/hooks/useOrganizations';
import { entityTypeLabels } from '@/lib/labels';

const DOCUMENTS = [
  { id: 'cellule', label: 'Cellule de crise & organigramme' },
  { id: 'escalade', label: "Procédures et plans d'escalade" },
  { id: 'maincourante', label: 'Main courante / journal de crise' },
  { id: 'fiches', label: 'Fiches réflexes par rôle' },
  { id: 'annuaire', label: 'Annuaire de crise & moyens de repli' },
  { id: 'communication', label: 'Plan de communication de crise' },
];

const EXERCICES = ['Table Top Exercise', 'War Game', 'Simulation de crise', 'Cyber Range'];

function generateTemplate(docId: string, orgName: string, today: string): string {
  const header = `MODÈLE — GESTION DE CRISE — ${orgName}  ·  Date : ${today}\n\n`;
  const sections: Record<string, string> = {
    cellule:
      header +
      '1. Composition de la cellule de crise\n' +
      '   - Directeur de crise (décision)\n' +
      '   - RSSI / coordinateur cyber\n' +
      '   - DSI / responsable technique\n' +
      '   - Communication / juridique / RH\n' +
      '   - Métiers impactés\n' +
      '2. Organigramme et suppléants\n' +
      '3. Critères de déclenchement et niveaux d\'alerte\n' +
      '4. Salle de crise (physique / virtuelle) et moyens\n' +
      '5. Cadence des points de situation\n' +
      '6. Conditions de levée de la cellule\n\n' +
      '— Trame SAO Pilotage NIS2, à compléter avec vos éléments internes.',
    escalade:
      header +
      '1. Niveaux de gravité (G1 à G4) et seuils\n' +
      '2. Matrice d\'escalade (qui alerte qui, sous quel délai)\n' +
      '3. Circuits de décision et délégations\n' +
      '4. Critères de passage en gestion de crise\n' +
      '5. Notification réglementaire NIS2 (24h / 72h / 1 mois)\n' +
      '6. Coordonnées d\'astreinte 24/7\n\n' +
      '— Trame SAO Pilotage NIS2, à compléter avec vos éléments internes.',
    maincourante:
      header +
      '1. Horodatage des événements (date, heure, auteur)\n' +
      '2. Décisions prises et justifications\n' +
      '3. Actions engagées et responsables\n' +
      '4. Communications émises (interne / externe / autorités)\n' +
      '5. Preuves et pièces jointes\n' +
      '6. Clôture et archivage pour retour d\'expérience\n\n' +
      '— Trame SAO Pilotage NIS2, à compléter avec vos éléments internes.',
    fiches:
      header +
      '1. Fiche réflexe — Directeur de crise\n' +
      '2. Fiche réflexe — RSSI / coordinateur cyber\n' +
      '3. Fiche réflexe — DSI / équipe technique\n' +
      '4. Fiche réflexe — Communication\n' +
      '5. Fiche réflexe — Juridique / conformité\n' +
      '6. Fiche réflexe — Métiers / accueil\n' +
      '   (Chaque fiche : objectif, premières actions, contacts, points de vigilance)\n\n' +
      '— Trame SAO Pilotage NIS2, à compléter avec vos éléments internes.',
    annuaire:
      header +
      '1. Annuaire de crise interne (cellule, astreintes, directions)\n' +
      '2. Contacts externes (prestataires, CERT, ANSSI, assurances)\n' +
      '3. Fournisseurs et infogérants critiques\n' +
      '4. Moyens de repli (site de secours, téléphonie, messagerie hors-bande)\n' +
      '5. Canaux de communication dégradés\n' +
      '6. Mise à jour et test périodique de l\'annuaire\n\n' +
      '— Trame SAO Pilotage NIS2, à compléter avec vos éléments internes.',
    communication:
      header +
      '1. Porte-parole désigné et validation des messages\n' +
      '2. Parties prenantes (collaborateurs, clients, autorités, presse)\n' +
      '3. Messages-types préparés (holding statements)\n' +
      '4. Canaux de diffusion et timing\n' +
      '5. Coordination avec le juridique et l\'ANSSI\n' +
      '6. Suivi médiatique et gestion réseaux sociaux\n\n' +
      '— Trame SAO Pilotage NIS2, à compléter avec vos éléments internes.',
  };
  return sections[docId] ?? header + '— Trame à définir.';
}

function generateExercice(exercice: string, orgName: string, today: string): string {
  return (
    `EXERCICE — ${exercice.toUpperCase()}\nOrganisation : ${orgName}  ·  Date : ${today}\n\n` +
    `1. Objectifs pédagogiques\n   Tester le dispositif de gestion de crise et la coordination de la cellule.\n\n` +
    `2. Scénario\n   Crise cyber majeure simulée (à adapter : rançongiciel, fuite de données, indisponibilité).\n\n` +
    `3. Participants et rôles\n   Cellule de crise, observateurs, animateur, modérateur.\n\n` +
    `4. Déroulé et injections\n   Chronologie des stimuli envoyés aux participants.\n\n` +
    `5. Critères d'évaluation\n   Délais de décision, qualité de la communication, respect des procédures.\n\n` +
    `6. Bilan et plan d'amélioration\n   Points forts, axes de progrès, actions correctives.\n\n` +
    `— Trame SAO Pilotage NIS2, à compléter avec vos éléments internes.`
  );
}

export function CrisisPage() {
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

  function showExercice(exercice: string) {
    setTemplateContent(generateExercice(exercice, orgName, today));
    setActiveTemplate(`exercice-${exercice}`);
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <PageHeader
          title="Gestion de crise"
          description="Dispositif et exercices de gestion de crise"
        />
        <OrgSelector value={orgId} onChange={setOrgId} />
      </div>

      {!orgId ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <p className="text-slate-500 text-sm">Sélectionnez une organisation.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Dispositif list */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-slate-100">
              <div>
                <h2 className="text-sm font-bold text-slate-800">Dispositif de gestion de crise</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Organiser la réponse en cas de crise cyber majeure : cellule, rôles, procédures et
                  entraînement.
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
                  className={`flex items-center justify-between px-5 py-3.5 transition-colors ${
                    activeTemplate === doc.id ? 'bg-teal-50/40' : 'hover:bg-slate-50/50'
                  }`}
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

          {/* Exercices */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-sm font-bold text-slate-800">Exercices</h2>
            <div className="flex flex-wrap gap-2">
              {EXERCICES.map((ex) => (
                <button
                  key={ex}
                  type="button"
                  onClick={() => showExercice(ex)}
                  className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
                    activeTemplate === `exercice-${ex}`
                      ? 'border-teal-500 bg-teal-50 text-teal-700'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-teal-300 hover:text-teal-600'
                  }`}
                >
                  {ex}
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
                Ces modèles sont des <strong>trames de structure</strong> générées localement, prêtes
                à être complétées. La rédaction intégrale par IA se branche sur l&apos;API Claude via
                votre backend.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
