import { useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { OrgSelector } from '@/components/OrgSelector';
import { useSelectedOrg } from '@/hooks/useSelectedOrg';

const THEMES = [
  { id: 'phishing', label: 'Phishing & ingénierie sociale', done: false },
  { id: 'password', label: 'Mots de passe & authentification forte', done: false },
  { id: 'incident', label: 'Signalement d\'incidents', done: false },
  { id: 'data', label: 'Gestion des données personnelles (RGPD)', done: false },
  { id: 'remote', label: 'Sécurité en télétravail', done: false },
  { id: 'usb', label: 'Clés USB et supports amovibles', done: false },
  { id: 'update', label: 'Mises à jour et correctifs', done: false },
];

export function SensibilisationPage() {
  const [orgId, setOrgId] = useSelectedOrg();
  const [done, setDone] = useState<Set<string>>(new Set());

  function toggle(id: string) {
    setDone((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <PageHeader
          title="Sensibilisation"
          description="Programme de sensibilisation à la cybersécurité (NIS2 Art. 21(2)(g))"
        />
        <OrgSelector value={orgId} onChange={setOrgId} />
      </div>

      {!orgId ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <p className="text-slate-500 text-sm">Sélectionnez une organisation.</p>
        </div>
      ) : (
        <div className="space-y-4">
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
                  <label htmlFor={theme.id} className={`text-sm cursor-pointer ${done.has(theme.id) ? 'line-through text-slate-400' : 'text-slate-800'}`}>
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
                Progression : <strong className="text-teal-700">{done.size}/{THEMES.length}</strong> thèmes réalisés
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
