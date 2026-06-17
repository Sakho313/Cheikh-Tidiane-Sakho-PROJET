import { useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { OrgSelector } from '@/components/OrgSelector';
import { useSelectedOrg } from '@/hooks/useSelectedOrg';
import { useOrganizations } from '@/hooks/useOrganizations';
import { entityTypeLabels } from '@/lib/labels';

const THEMES = [
  { id: 'phishing', label: 'Phishing & ingénierie sociale' },
  { id: 'password', label: 'Mots de passe & authentification forte' },
  { id: 'incident', label: "Signalement d'incidents" },
  { id: 'data', label: 'Gestion des données personnelles (RGPD)' },
  { id: 'remote', label: 'Sécurité en télétravail' },
  { id: 'usb', label: 'Clés USB et supports amovibles' },
  { id: 'update', label: 'Mises à jour et correctifs' },
];

const PARCOURS = [
  { id: 'dirigeants', label: 'Parcours dirigeants (responsabilité NIS2)' },
  { id: 'rssi', label: 'Parcours RSSI' },
  { id: 'it', label: 'Parcours IT' },
  { id: 'metiers', label: 'Parcours métiers' },
  { id: 'quiz', label: 'Quiz & tests de connaissances' },
  { id: 'phishing-sim', label: 'Campagnes de phishing simulé' },
];

const CAMPAGNES = [
  'Phishing — niveau 1',
  'Phishing — niveau 2',
  'Quiz NIS2',
  'Module dirigeants',
];

function genericBody(): string {
  return (
    '1. Objet et périmètre\n' +
    '2. Rôles et responsabilités\n' +
    '3. Déroulé / étapes clés\n' +
    '4. Critères de déclenchement\n' +
    '5. Livrables et preuves\n' +
    '6. Indicateurs de suivi (KPI)\n' +
    '7. Modalités de test / révision\n\n' +
    '— Trame SAO Pilotage NIS2, à compléter avec vos éléments internes.'
  );
}

function generateTemplate(label: string, orgName: string, today: string): string {
  return `MODÈLE — ${label.toUpperCase()}\nOrganisation : ${orgName}   ·   Date : ${today}\n\n` + genericBody();
}

export function SensibilisationPage() {
  const [orgId, setOrgId] = useSelectedOrg();
  const { data: orgsPage } = useOrganizations();
  const orgs = orgsPage?.data;
  const selectedOrg = orgs?.find((o) => o.id === orgId);

  const [done, setDone] = useState<Set<string>>(new Set());
  const [activeTemplate, setActiveTemplate] = useState<string | null>(null);
  const [templateContent, setTemplateContent] = useState('');

  const today = new Date().toISOString().slice(0, 10);
  const orgName = selectedOrg
    ? `${selectedOrg.name} · Entité ${entityTypeLabels[selectedOrg.entityType]}`
    : 'Organisation';

  function toggle(id: string) {
    setDone((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function showTemplate(key: string, label: string) {
    setTemplateContent(generateTemplate(label, orgName, today));
    setActiveTemplate(key);
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <PageHeader
          title="Sensibilisation"
          description="Parcours de formation et campagnes"
        />
        <OrgSelector value={orgId} onChange={setOrgId} />
      </div>

      {!orgId ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <p className="text-slate-500 text-sm">Sélectionnez une organisation.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Existing checklist — kept */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-800">Plan de sensibilisation annuel</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Cochez les thèmes réalisés auprès de vos collaborateurs.
              </p>
            </div>
            <ul className="divide-y divide-slate-100">
              {THEMES.map((theme) => (
                <li key={theme.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50/50">
                  <input
                    type="checkbox"
                    id={theme.id}
                    checked={done.has(theme.id)}
                    onChange={() => toggle(theme.id)}
                    className="h-4 w-4 rounded border-slate-300 accent-teal-600"
                  />
                  <label
                    htmlFor={theme.id}
                    className={`text-sm cursor-pointer ${done.has(theme.id) ? 'line-through text-slate-400' : 'text-slate-800'}`}
                  >
                    {theme.label}
                  </label>
                  {done.has(theme.id) && (
                    <span className="ml-auto text-xs font-medium text-emerald-600">✓ Réalisé</span>
                  )}
                </li>
              ))}
            </ul>
            <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50">
              <p className="text-xs text-slate-500">
                Progression :{' '}
                <strong className="text-teal-700">
                  {done.size}/{THEMES.length}
                </strong>{' '}
                thèmes réalisés
              </p>
            </div>
          </div>

          {/* Dispositif de formation — added below */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-slate-100">
              <div>
                <h2 className="text-sm font-bold text-slate-800">Sensibilisation &amp; formation</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Élever le niveau d&apos;hygiène cyber de toute l&apos;organisation — exigence de
                  l&apos;article 21.2.g.
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-teal-50 border border-teal-200 px-2.5 py-0.5 text-xs font-semibold text-teal-700">
                Génération assistée
              </span>
            </div>

            <ul className="divide-y divide-slate-100">
              {PARCOURS.map((p) => (
                <li
                  key={p.id}
                  className={`flex items-center justify-between px-5 py-3.5 transition-colors ${
                    activeTemplate === p.id ? 'bg-teal-50/40' : 'hover:bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="h-2 w-2 rounded-full bg-teal-500 shrink-0" />
                    <span className="text-sm text-slate-800">{p.label}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => showTemplate(p.id, p.label)}
                    className="shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 hover:border-teal-300 hover:text-teal-700 transition-colors"
                  >
                    Générer un modèle
                  </button>
                </li>
              ))}
            </ul>

            {/* Campagnes */}
            <div className="px-5 py-4 border-t border-slate-100">
              <h3 className="mb-3 text-sm font-bold text-slate-800">Campagnes</h3>
              <div className="flex flex-wrap gap-2">
                {CAMPAGNES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => showTemplate(`camp-${c}`, c)}
                    className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
                      activeTemplate === `camp-${c}`
                        ? 'border-teal-500 bg-teal-50 text-teal-700'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-teal-300 hover:text-teal-600'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
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
