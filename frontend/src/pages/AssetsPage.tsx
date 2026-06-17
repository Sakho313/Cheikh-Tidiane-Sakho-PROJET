import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { OrgSelector } from '@/components/OrgSelector';
import { useSelectedOrg } from '@/hooks/useSelectedOrg';

type AssetType = 'Logiciel' | 'Matériel' | 'Cloud' | 'Donnée';
type Criticite = 'Vitale' | 'Importante' | 'Modérée';

interface Asset {
  id: string;
  name: string;
  type: AssetType;
  criticite: Criticite;
  proprietaire: string;
}

const ASSET_TYPES: AssetType[] = ['Logiciel', 'Matériel', 'Cloud', 'Donnée'];
const CRITICITE_LEVELS: Criticite[] = ['Vitale', 'Importante', 'Modérée'];

const DEMO_ASSETS: Asset[] = [
  { id: '1', name: 'Active Directory', type: 'Logiciel', criticite: 'Vitale', proprietaire: 'DSI' },
  { id: '2', name: 'ERP production', type: 'Logiciel', criticite: 'Vitale', proprietaire: 'Métier' },
  { id: '3', name: 'Cluster VMware', type: 'Matériel', criticite: 'Importante', proprietaire: 'DSI' },
  { id: '4', name: 'Tenant Microsoft 365', type: 'Cloud', criticite: 'Importante', proprietaire: 'DSI' },
  { id: '5', name: 'Base clients (DCP)', type: 'Donnée', criticite: 'Vitale', proprietaire: 'DPO' },
  { id: '6', name: 'Sauvegardes', type: 'Cloud', criticite: 'Vitale', proprietaire: 'DSI' },
];

const emptyAdd = { name: '', type: 'Matériel' as AssetType, criticite: 'Vitale' as Criticite, proprietaire: '' };

const criticiteBadge: Record<Criticite, string> = {
  Vitale: 'bg-red-100 text-red-700',
  Importante: 'bg-amber-100 text-amber-700',
  Modérée: 'bg-slate-100 text-slate-600',
};

function storageKey(orgId: string) {
  return `nis2.assets.${orgId}`;
}

export function AssetsPage() {
  const [orgId, setOrgId] = useSelectedOrg();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [add, setAdd] = useState(emptyAdd);

  useEffect(() => {
    if (!orgId) return;
    const raw = localStorage.getItem(storageKey(orgId));
    if (raw) {
      try { setAssets(JSON.parse(raw) as Asset[]); return; } catch { /* fall through */ }
    }
    setAssets(DEMO_ASSETS);
  }, [orgId]);

  function save(next: Asset[]) {
    setAssets(next);
    if (orgId) localStorage.setItem(storageKey(orgId), JSON.stringify(next));
  }

  function updateField<K extends keyof Asset>(id: string, field: K, value: Asset[K]) {
    save(assets.map((a) => (a.id === id ? { ...a, [field]: value } : a)));
  }

  function deleteAsset(id: string) {
    save(assets.filter((a) => a.id !== id));
  }

  function addAsset() {
    if (!add.name.trim()) return;
    save([...assets, { ...add, id: Date.now().toString() }]);
    setAdd(emptyAdd);
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <PageHeader
          title="Actifs"
          description="Inventaire et classification des actifs"
        />
        <OrgSelector value={orgId} onChange={setOrgId} />
      </div>

      {!orgId ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <p className="text-slate-500 text-sm">Sélectionnez une organisation.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-800">Inventaire &amp; classification des actifs</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Matériel, logiciel, cloud et données — base de l&apos;analyse de risque et des dépendances.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {['Actif', 'Type', 'Criticité', 'Propriétaire', ''].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {assets.map((asset) => (
                  <tr key={asset.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-2.5">
                      <input
                        className="w-full rounded border border-transparent bg-transparent px-1 py-0.5 text-sm text-slate-800 hover:border-slate-300 focus:border-teal-400 focus:outline-none focus:ring-0"
                        value={asset.name}
                        onChange={(e) => updateField(asset.id, 'name', e.target.value)}
                      />
                    </td>
                    <td className="px-4 py-2.5">
                      <select
                        className="rounded border border-slate-200 bg-white px-2 py-0.5 text-sm text-slate-700 focus:border-teal-400 focus:outline-none"
                        value={asset.type}
                        onChange={(e) => updateField(asset.id, 'type', e.target.value as AssetType)}
                      >
                        {ASSET_TYPES.map((t) => <option key={t}>{t}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-2.5">
                      <select
                        className={`rounded border border-transparent px-2 py-0.5 text-sm font-medium focus:outline-none ${criticiteBadge[asset.criticite]}`}
                        value={asset.criticite}
                        onChange={(e) => updateField(asset.id, 'criticite', e.target.value as Criticite)}
                      >
                        {CRITICITE_LEVELS.map((c) => <option key={c}>{c}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-2.5">
                      <input
                        className="w-full rounded border border-transparent bg-transparent px-1 py-0.5 text-sm text-slate-700 hover:border-slate-300 focus:border-teal-400 focus:outline-none"
                        value={asset.proprietaire}
                        onChange={(e) => updateField(asset.id, 'proprietaire', e.target.value)}
                      />
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <button
                        type="button"
                        onClick={() => deleteAsset(asset.id)}
                        className="text-slate-300 hover:text-red-500 transition-colors"
                        aria-label="Supprimer"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
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
                <tr className="bg-slate-50/30">
                  <td className="px-4 py-2.5">
                    <input
                      placeholder="Actif"
                      className="w-full rounded border border-slate-200 bg-white px-2 py-1 text-sm text-slate-800 placeholder:text-slate-400 focus:border-teal-400 focus:outline-none"
                      value={add.name}
                      onChange={(e) => setAdd({ ...add, name: e.target.value })}
                      onKeyDown={(e) => e.key === 'Enter' && addAsset()}
                    />
                  </td>
                  <td className="px-4 py-2.5">
                    <select
                      className="rounded border border-slate-200 bg-white px-2 py-1 text-sm text-slate-700 focus:border-teal-400 focus:outline-none"
                      value={add.type}
                      onChange={(e) => setAdd({ ...add, type: e.target.value as AssetType })}
                    >
                      {ASSET_TYPES.map((t) => <option key={t}>{t}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-2.5">
                    <select
                      className="rounded border border-slate-200 bg-white px-2 py-1 text-sm text-slate-700 focus:border-teal-400 focus:outline-none"
                      value={add.criticite}
                      onChange={(e) => setAdd({ ...add, criticite: e.target.value as Criticite })}
                    >
                      {CRITICITE_LEVELS.map((c) => <option key={c}>{c}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-2.5">
                    <input
                      placeholder="Propriétaire"
                      className="w-full rounded border border-slate-200 bg-white px-2 py-1 text-sm text-slate-700 placeholder:text-slate-400 focus:border-teal-400 focus:outline-none"
                      value={add.proprietaire}
                      onChange={(e) => setAdd({ ...add, proprietaire: e.target.value })}
                      onKeyDown={(e) => e.key === 'Enter' && addAsset()}
                    />
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <button
                      type="button"
                      onClick={addAsset}
                      className="rounded-lg bg-teal-600 px-3 py-1 text-xs font-semibold text-white hover:bg-teal-700 transition-colors"
                    >
                      Ajouter
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
