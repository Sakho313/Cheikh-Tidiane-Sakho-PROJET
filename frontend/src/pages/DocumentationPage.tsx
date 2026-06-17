import { PageHeader } from '@/components/ui/PageHeader';
import { OrgSelector } from '@/components/OrgSelector';
import { useSelectedOrg } from '@/hooks/useSelectedOrg';
import { Badge } from '@/components/ui/Badge';

const DOCS = [
  { title: 'Politique de sécurité des systèmes d\'information (PSSI)', category: 'Politique', article: 'Art. 21(2)(a)', status: 'À produire' as const },
  { title: 'Politique de gestion des incidents', category: 'Procédure', article: 'Art. 21(2)(b)', status: 'À produire' as const },
  { title: 'Plan de continuité d\'activité (PCA)', category: 'Plan', article: 'Art. 21(2)(c)', status: 'À produire' as const },
  { title: 'Plan de reprise d\'activité (PRA)', category: 'Plan', article: 'Art. 21(2)(c)', status: 'À produire' as const },
  { title: 'Politique de gestion des risques fournisseurs', category: 'Politique', article: 'Art. 21(2)(d)', status: 'À produire' as const },
  { title: 'Politique de gestion des vulnérabilités', category: 'Procédure', article: 'Art. 21(2)(e)', status: 'À produire' as const },
  { title: 'Politique de cryptographie', category: 'Politique', article: 'Art. 21(2)(h)', status: 'À produire' as const },
];

const catColor: Record<string, string> = {
  Politique: 'bg-blue-50 text-blue-700',
  Procédure: 'bg-purple-50 text-purple-700',
  Plan: 'bg-teal-50 text-teal-700',
};

export function DocumentationPage() {
  const [orgId, setOrgId] = useSelectedOrg();

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <PageHeader
          title="Documentation"
          description="Bibliothèque documentaire NIS2 — politiques, procédures et plans"
        />
        <OrgSelector value={orgId} onChange={setOrgId} />
      </div>

      {!orgId ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <p className="text-slate-500 text-sm">Sélectionnez une organisation.</p>
        </div>
      ) : (
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
      )}
    </div>
  );
}
