import { useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { OrgSelector } from '@/components/OrgSelector';
import { useSelectedOrg } from '@/hooks/useSelectedOrg';
import { useOrganizations } from '@/hooks/useOrganizations';
import { entityTypeLabels } from '@/lib/labels';

const DOCUMENTS = [
  { id: 'detection', label: 'Procédure de détection & qualification' },
  { id: 'confinement', label: 'Confinement / éradication / restauration' },
  { id: 'notification', label: 'Notification réglementaire NIS2' },
  { id: 'rex', label: "Retours d'expérience (REX)" },
  { id: 'playbook-soc', label: 'Playbooks SOC' },
  { id: 'playbook-csirt', label: 'Playbooks CSIRT / CERT' },
];

const DECLARATIONS = [
  { id: 'alerte', label: 'Alerte précoce (24 h)' },
  { id: 'notif72', label: 'Notification (72 h)' },
  { id: 'final', label: 'Rapport final (1 mois)' },
];

function generateTemplate(docId: string, orgName: string, today: string): string {
  const header = `MODÈLE — RÉPONSE À INCIDENT — ${orgName}  ·  Date : ${today}\n\n`;
  const sections: Record<string, string> = {
    detection:
      header +
      '1. Sources de détection (SIEM, EDR, alertes, signalements)\n' +
      '2. Critères de qualification d\'un incident\n' +
      '3. Échelle de gravité et priorisation\n' +
      '4. Première analyse et périmètre impacté\n' +
      '5. Critères de déclenchement de la gestion de crise\n' +
      '6. Traçabilité (horodatage, preuves)\n\n' +
      '— Référentiels : ISO 27035, NIST SP 800-61. Trame SAO Pilotage NIS2, à compléter.',
    confinement:
      header +
      '1. Mesures de confinement immédiat (isolation réseau, comptes)\n' +
      '2. Éradication de la menace (suppression, correctifs)\n' +
      '3. Restauration des systèmes (depuis sauvegardes saines)\n' +
      '4. Vérification de l\'intégrité avant remise en production\n' +
      '5. Surveillance renforcée post-incident\n' +
      '6. Critères de clôture de l\'incident\n\n' +
      '— Référentiels : ISO 27035, NIST SP 800-61. Trame SAO Pilotage NIS2, à compléter.',
    notification:
      header +
      '1. Critères de notification NIS2 (incident important)\n' +
      '2. Alerte précoce — 24 h (autorité compétente / CSIRT)\n' +
      '3. Notification — 72 h (évaluation initiale, gravité, impact)\n' +
      '4. Rapport final — 1 mois (causes, mesures, transfrontalier)\n' +
      '5. Information des destinataires de services le cas échéant\n' +
      '6. Coordination avec le juridique et la communication\n\n' +
      '— Article 23 directive (UE) 2022/2555. Trame SAO Pilotage NIS2, à compléter.',
    rex:
      header +
      '1. Chronologie détaillée de l\'incident\n' +
      '2. Analyse des causes racines (post-mortem)\n' +
      '3. Efficacité de la détection et de la réponse\n' +
      '4. Points forts et axes d\'amélioration\n' +
      '5. Plan d\'actions correctives et préventives\n' +
      '6. Mise à jour des playbooks et de l\'analyse de risque\n\n' +
      '— Trame SAO Pilotage NIS2, à compléter avec vos éléments internes.',
    'playbook-soc':
      header +
      '1. Périmètre et déclencheurs du playbook\n' +
      '2. Étapes de triage et d\'enrichissement\n' +
      '3. Actions de containment automatisables\n' +
      '4. Critères d\'escalade vers le CSIRT\n' +
      '5. Communication interne (cellule de crise)\n' +
      '6. Indicateurs (MTTD, MTTR)\n\n' +
      '— Trame SAO Pilotage NIS2, à compléter avec vos éléments internes.',
    'playbook-csirt':
      header +
      '1. Coordination de la réponse (rôles CSIRT / CERT)\n' +
      '2. Investigation forensique et collecte de preuves\n' +
      '3. Recherche de compromission (IOC, threat hunting)\n' +
      '4. Liaison avec autorités, CERT national et partenaires\n' +
      '5. Partage d\'information (TLP)\n' +
      '6. Clôture et capitalisation\n\n' +
      '— Trame SAO Pilotage NIS2, à compléter avec vos éléments internes.',
  };
  return sections[docId] ?? header + '— Trame à définir.';
}

function generateDeclaration(decId: string, orgName: string, today: string): string {
  const header = `DÉCLARATION NIS2 — ${orgName}  ·  Date : ${today}\n\n`;
  const sections: Record<string, string> = {
    alerte:
      `ALERTE PRÉCOCE (sous 24 h)\n` +
      header +
      '1. Entité concernée et coordonnées\n' +
      '2. Date et heure de détection\n' +
      '3. Nature présumée de l\'incident\n' +
      '4. Suspicion d\'acte malveillant / origine transfrontalière (oui/non)\n' +
      '5. Premiers impacts constatés\n' +
      '6. Mesures immédiates engagées\n\n' +
      '— Article 23(4)(a) directive (UE) 2022/2555.',
    notif72:
      `NOTIFICATION (sous 72 h)\n` +
      header +
      '1. Mise à jour de l\'alerte précoce\n' +
      '2. Évaluation initiale : gravité et impact\n' +
      '3. Indicateurs de compromission (IOC) si disponibles\n' +
      '4. Périmètre des services et utilisateurs affectés\n' +
      '5. Mesures de remédiation en cours\n' +
      '6. Besoin d\'assistance éventuel\n\n' +
      '— Article 23(4)(b) directive (UE) 2022/2555.',
    final:
      `RAPPORT FINAL (sous 1 mois)\n` +
      header +
      '1. Description détaillée de l\'incident\n' +
      '2. Type de menace et causes racines\n' +
      '3. Mesures d\'atténuation appliquées et résultats\n' +
      '4. Impact transfrontalier le cas échéant\n' +
      '5. Enseignements et mesures préventives\n' +
      '6. Statut de résolution\n\n' +
      '— Article 23(4)(d) directive (UE) 2022/2555.',
  };
  return sections[decId] ?? header + '— Trame à définir.';
}

export function ResponsePage() {
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

  function showDeclaration(decId: string) {
    setTemplateContent(generateDeclaration(decId, orgName, today));
    setActiveTemplate(`decl-${decId}`);
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <PageHeader
          title="Réponse à incident"
          description="Détection, qualification et notification réglementaire"
        />
        <OrgSelector value={orgId} onChange={setOrgId} />
      </div>

      {!orgId ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <p className="text-slate-500 text-sm">Sélectionnez une organisation.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Dispositif list + déclarations */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-slate-100">
              <div>
                <h2 className="text-sm font-bold text-slate-800">Réponse aux incidents</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Détecter, qualifier, contenir et notifier — conformément à ISO 27035, au NIST IR
                  et aux délais NIS2 (24 h / 72 h / 1 mois).
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

            {/* Modèles de déclaration */}
            <div className="px-5 py-4 border-t border-slate-100">
              <h3 className="mb-3 text-sm font-bold text-slate-800">Modèles de déclaration</h3>
              <div className="flex flex-wrap gap-2">
                {DECLARATIONS.map((dec) => (
                  <button
                    key={dec.id}
                    type="button"
                    onClick={() => showDeclaration(dec.id)}
                    className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
                      activeTemplate === `decl-${dec.id}`
                        ? 'border-teal-500 bg-teal-50 text-teal-700'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-teal-300 hover:text-teal-600'
                    }`}
                  >
                    {dec.label}
                  </button>
                ))}
              </div>
              <p className="mt-3 text-[11px] text-slate-400">
                Ces modèles sont des <strong>trames de structure</strong> générées localement, prêtes
                à être complétées. La rédaction intégrale par IA se branche sur l&apos;API Claude via
                votre backend.
              </p>
            </div>
          </div>

          {/* Generated template */}
          {templateContent && (
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <pre className="text-xs text-slate-700 font-mono leading-relaxed whitespace-pre-wrap overflow-x-auto">
                {templateContent}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
