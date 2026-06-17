import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { OrgSelector } from '@/components/OrgSelector';
import { useSelectedOrg } from '@/hooks/useSelectedOrg';
import { useOrganizations } from '@/hooks/useOrganizations';
import { entityTypeLabels } from '@/lib/labels';
import { Badge } from '@/components/ui/Badge';

const DOCS = [
  { title: "Politique de sécurité des systèmes d'information (PSSI)", category: 'Politique', article: 'Art. 21(2)(a)', status: 'À produire' as const },
  { title: 'Politique de gestion des incidents', category: 'Procédure', article: 'Art. 21(2)(b)', status: 'À produire' as const },
  { title: "Plan de continuité d'activité (PCA)", category: 'Plan', article: 'Art. 21(2)(c)', status: 'À produire' as const },
  { title: "Plan de reprise d'activité (PRA)", category: 'Plan', article: 'Art. 21(2)(c)', status: 'À produire' as const },
  { title: 'Politique de gestion des risques fournisseurs', category: 'Politique', article: 'Art. 21(2)(d)', status: 'À produire' as const },
  { title: 'Politique de gestion des vulnérabilités', category: 'Procédure', article: 'Art. 21(2)(e)', status: 'À produire' as const },
  { title: 'Politique de cryptographie', category: 'Politique', article: 'Art. 21(2)(h)', status: 'À produire' as const },
];

const catColor: Record<string, string> = {
  Politique: 'bg-blue-50 text-blue-700',
  Procédure: 'bg-purple-50 text-purple-700',
  Plan: 'bg-teal-50 text-teal-700',
};

// ── Éditable "Politiques & procédures SSI" table ────────────────────────────────
type DocType = 'Politique' | 'Procédure';
type DocStatut = 'Validé' | 'En cours' | 'À rédiger';

interface SSIDoc {
  id: string;
  document: string;
  type: DocType;
  statut: DocStatut;
}

const DOC_TYPES: DocType[] = ['Politique', 'Procédure'];
const DOC_STATUTS: DocStatut[] = ['Validé', 'En cours', 'À rédiger'];

const DEFAULT_SSI_DOCS: SSIDoc[] = [
  { id: 'd1', document: 'Politique de Sécurité des SI (PSSI)', type: 'Politique', statut: 'Validé' },
  { id: 'd2', document: 'Politique de gestion des accès / IAM', type: 'Politique', statut: 'En cours' },
  { id: 'd3', document: 'Politique MFA', type: 'Politique', statut: 'À rédiger' },
  { id: 'd4', document: 'Politique de sauvegarde', type: 'Politique', statut: 'En cours' },
  { id: 'd5', document: 'Politique de gestion des vulnérabilités', type: 'Politique', statut: 'À rédiger' },
  { id: 'd6', document: 'Procédure de gestion des incidents', type: 'Procédure', statut: 'Validé' },
  { id: 'd7', document: 'Procédure de gestion de crise', type: 'Procédure', statut: 'En cours' },
  { id: 'd8', document: 'Procédure de gestion des fournisseurs', type: 'Procédure', statut: 'À rédiger' },
  { id: 'd9', document: "Plan de continuité d'activité (PCA)", type: 'Procédure', statut: 'À rédiger' },
];

const docKey = (orgId: string) => `nis2.ssidocs.${orgId}`;

function loadDocs(orgId: string): SSIDoc[] {
  const raw = localStorage.getItem(docKey(orgId));
  if (raw) {
    try {
      return JSON.parse(raw) as SSIDoc[];
    } catch {
      /* fall through */
    }
  }
  return DEFAULT_SSI_DOCS.map((d) => ({ ...d }));
}

const statutTint: Record<DocStatut, string> = {
  Validé: 'text-emerald-700',
  'En cours': 'text-teal-700',
  'À rédiger': 'text-slate-500',
};

export function DocumentationPage() {
  const [orgId, setOrgId] = useSelectedOrg();
  const { data: orgsPage } = useOrganizations();
  const orgs = orgsPage?.data;
  const selectedOrg = orgs?.find((o) => o.id === orgId);

  const [docs, setDocsState] = useState<SSIDoc[]>(() => (orgId ? loadDocs(orgId) : []));
  const [newType, setNewType] = useState<DocType>('Politique');
  const [newDoc, setNewDoc] = useState('');
  const [preview, setPreview] = useState('');

  useEffect(() => {
    setDocsState(orgId ? loadDocs(orgId) : []);
  }, [orgId]);

  function setDocs(next: SSIDoc[]) {
    setDocsState(next);
    if (orgId) localStorage.setItem(docKey(orgId), JSON.stringify(next));
  }

  function updateField<K extends keyof SSIDoc>(id: string, field: K, value: SSIDoc[K]) {
    setDocs(docs.map((d) => (d.id === id ? { ...d, [field]: value } : d)));
  }

  function deleteDoc(id: string) {
    setDocs(docs.filter((d) => d.id !== id));
  }

  function addDoc() {
    if (!newDoc.trim()) return;
    setDocs([...docs, { id: Date.now().toString(), document: newDoc, type: newType, statut: 'À rédiger' }]);
    setNewDoc('');
  }

  function generateModel() {
    const today = new Date().toISOString().slice(0, 10);
    const orgName = selectedOrg
      ? `${selectedOrg.name} · Entité ${entityTypeLabels[selectedOrg.entityType]}`
      : 'Organisation';
    setPreview(
      `MODÈLE — POLITIQUE / PROCÉDURE SSI\nOrganisation : ${orgName}   ·   Date : ${today}\n\n` +
        '1. Objet et périmètre\n' +
        '2. Références réglementaires (NIS2, ReCyF)\n' +
        '3. Rôles et responsabilités\n' +
        '4. Règles et exigences de sécurité\n' +
        '5. Mise en œuvre et contrôles\n' +
        '6. Indicateurs de suivi et révision\n' +
        '7. Validation et diffusion\n\n' +
        '— Trame SAO Pilotage NIS2, à compléter avec vos éléments internes.',
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <PageHeader title="Documentation" description="Politiques et procédures SSI" />
        <OrgSelector value={orgId} onChange={setOrgId} />
      </div>

      {!orgId ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <p className="text-slate-500 text-sm">Sélectionnez une organisation.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Existing mandatory-documents checklist — kept */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-800">Documents obligatoires NIS2</h2>
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                {DOCS.length} documents
              </span>
            </div>
            <ul className="divide-y divide-slate-100">
              {DOCS.map((doc) => (
                <li key={doc.title} className="flex items-start gap-4 px-5 py-4 hover:bg-slate-50/50">
                  <div className="mt-0.5 h-4 w-4 shrink-0 rounded border-2 border-slate-300" />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-800 text-sm">{doc.title}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${catColor[doc.category]}`}>
                        {doc.category}
                      </span>
                      <span className="font-mono text-[10px] text-slate-400">{doc.article}</span>
                    </div>
                  </div>
                  <Badge tone="gray">{doc.status}</Badge>
                </li>
              ))}
            </ul>
          </div>

          {/* Éditable SSI policies/procedures table — added below */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="flex flex-wrap items-start justify-between gap-3 px-5 py-4 border-b border-slate-100">
              <div>
                <h2 className="text-sm font-bold text-slate-800">Politiques &amp; procédures SSI</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Suivi de la production documentaire requise par NIS2.
                </p>
              </div>
              <button
                type="button"
                onClick={generateModel}
                className="shrink-0 inline-flex items-center gap-2 rounded-lg bg-teal-700 px-3.5 py-2 text-sm font-semibold text-white hover:bg-teal-800 transition-colors"
              >
                Générer un modèle
                <span className="rounded bg-teal-500/40 px-1.5 py-0.5 text-[10px] font-bold tracking-wide">
                  IA
                </span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    {['Document', 'Type', 'Statut', ''].map((h) => (
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
                  {docs.map((d) => (
                    <tr key={d.id} className="hover:bg-slate-50/50 align-middle">
                      <td className="px-5 py-3 min-w-[260px]">
                        <input
                          className="w-full rounded border border-transparent bg-transparent px-1 py-0.5 text-sm text-slate-800 hover:border-slate-300 focus:border-teal-400 focus:outline-none"
                          value={d.document}
                          onChange={(e) => updateField(d.id, 'document', e.target.value)}
                        />
                      </td>
                      <td className="px-5 py-3">
                        <select
                          className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-700 focus:border-teal-400 focus:outline-none"
                          value={d.type}
                          onChange={(e) => updateField(d.id, 'type', e.target.value as DocType)}
                        >
                          {DOC_TYPES.map((t) => (
                            <option key={t}>{t}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-5 py-3">
                        <select
                          className={`rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm font-medium focus:border-teal-400 focus:outline-none ${statutTint[d.statut]}`}
                          value={d.statut}
                          onChange={(e) => updateField(d.id, 'statut', e.target.value as DocStatut)}
                        >
                          {DOC_STATUTS.map((s) => (
                            <option key={s}>{s}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => deleteDoc(d.id)}
                          className="text-slate-300 hover:text-red-500 transition-colors"
                          aria-label="Supprimer"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                            <path d="M10 11v6 M14 11v6" />
                            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}

                  {/* Add row */}
                  <tr className="bg-slate-50/40">
                    <td className="px-5 py-3">
                      <input
                        placeholder="Nouveau document"
                        className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm placeholder:text-slate-400 focus:border-teal-400 focus:outline-none"
                        value={newDoc}
                        onChange={(e) => setNewDoc(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && addDoc()}
                      />
                    </td>
                    <td className="px-5 py-3">
                      <select
                        className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-700 focus:border-teal-400 focus:outline-none"
                        value={newType}
                        onChange={(e) => setNewType(e.target.value as DocType)}
                      >
                        {DOC_TYPES.map((t) => (
                          <option key={t}>{t}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-5 py-3 text-right" colSpan={2}>
                      <button
                        type="button"
                        onClick={addDoc}
                        className="rounded-lg bg-teal-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-teal-700 transition-colors"
                      >
                        Ajouter
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Generated preview */}
          {preview && (
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <pre className="text-xs text-slate-700 font-mono leading-relaxed whitespace-pre-wrap overflow-x-auto">
                {preview}
              </pre>
            </div>
          )}

          <p className="text-[11px] text-slate-400">
            L&apos;aperçu généré est un <strong>modèle de structure</strong> produit localement. La
            génération de contenu complet par IA se branche sur l&apos;API Claude via votre backend.
          </p>
        </div>
      )}
    </div>
  );
}
