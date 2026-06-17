import { useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { OrgSelector } from '@/components/OrgSelector';
import { useSelectedOrg } from '@/hooks/useSelectedOrg';
import {
  useVulns,
  SEVERITES,
  VULNS_STATUTS,
  cvssBarColor,
  cvssColor,
  vulnSeveriteBadge,
  vulnStatutBadge,
  criticalOpenCount,
  unpatchedCount,
  type Vulnerability,
  type VulnSeverite,
  type VulnStatut,
} from '@/lib/vulnerabilities';

const emptyAdd = {
  cve: '',
  description: '',
  systeme: '',
  cvss: 7.5,
  severite: 'Élevé' as VulnSeverite,
  statut: 'En attente' as VulnStatut,
  echeance: new Date().toISOString().slice(0, 10),
};

function KpiCard({ label, value, sub, accent }: { label: string; value: number | string; sub?: string; accent?: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">{label}</p>
      <p className={`text-3xl font-bold mt-1 ${accent ?? 'text-slate-800'}`}>{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
    </div>
  );
}

export function VulnerabilitiesPage() {
  const [orgId, setOrgId] = useSelectedOrg();
  const { vulns, setVulns } = useVulns(orgId);
  const [add, setAdd] = useState(emptyAdd);

  const critOpen = criticalOpenCount(vulns);
  const unpatched = unpatchedCount(vulns);
  const patchRate = vulns.length
    ? Math.round((vulns.filter((v) => v.statut === 'Patchée').length / vulns.length) * 100)
    : 0;
  const avgCvss = vulns.length
    ? (vulns.reduce((s, v) => s + v.cvss, 0) / vulns.length).toFixed(1)
    : '—';

  function updateField<K extends keyof Vulnerability>(id: string, field: K, value: Vulnerability[K]) {
    setVulns(vulns.map((v) => (v.id === id ? { ...v, [field]: value } : v)));
  }

  function deleteVuln(id: string) {
    setVulns(vulns.filter((v) => v.id !== id));
  }

  function addVuln() {
    if (!add.cve.trim()) return;
    setVulns([...vulns, { id: Date.now().toString(), ...add }]);
    setAdd(emptyAdd);
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <PageHeader
          title="Gestion des vulnérabilités"
          description="Suivi CVE, scores CVSS et plans de remédiation — ReCyF O9 / NIS2 Art. 21"
        />
        <OrgSelector value={orgId} onChange={setOrgId} />
      </div>

      {!orgId ? (
        <div className="rounded-xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <p className="text-slate-500 text-sm">Sélectionnez une organisation.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* KPI cards */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <KpiCard
              label="Vulnérabilités critiques"
              value={critOpen}
              sub="CVSS ≥ 9 non patchées"
              accent={critOpen > 0 ? 'text-red-600' : 'text-emerald-600'}
            />
            <KpiCard
              label="Non patchées"
              value={unpatched}
              sub="En attente ou en cours"
              accent={unpatched > 3 ? 'text-orange-600' : 'text-amber-600'}
            />
            <KpiCard
              label="Taux de correction"
              value={`${patchRate}%`}
              sub="Vulnérabilités patchées"
              accent={patchRate >= 70 ? 'text-emerald-600' : patchRate >= 40 ? 'text-amber-600' : 'text-red-600'}
            />
            <KpiCard
              label="Score CVSS moyen"
              value={avgCvss}
              sub="Toutes vulnérabilités"
              accent={Number(avgCvss) >= 8 ? 'text-red-600' : Number(avgCvss) >= 6 ? 'text-orange-600' : 'text-amber-600'}
            />
          </div>

          {/* Vulnerability table */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-800">Registre des vulnérabilités</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Suivi CVE, CVSS et remédiation conformément à ReCyF O9 et NIS2 Art. 21.2.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    {['CVE', 'Description', 'Système', 'CVSS', 'Sévérité', 'Statut', 'Échéance', ''].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {vulns.map((v) => (
                    <tr key={v.id} className="hover:bg-slate-50/50 align-middle">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <input
                          className="w-32 rounded border border-transparent bg-transparent px-1 py-0.5 font-mono text-xs text-teal-700 hover:border-slate-300 focus:border-teal-400 focus:outline-none"
                          value={v.cve}
                          onChange={(e) => updateField(v.id, 'cve', e.target.value)}
                        />
                      </td>
                      <td className="px-4 py-3 min-w-[220px]">
                        <input
                          className="w-full rounded border border-transparent bg-transparent px-1 py-0.5 text-sm text-slate-700 hover:border-slate-300 focus:border-teal-400 focus:outline-none"
                          value={v.description}
                          onChange={(e) => updateField(v.id, 'description', e.target.value)}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          className="w-28 rounded border border-transparent bg-transparent px-1 py-0.5 text-xs text-slate-600 hover:border-slate-300 focus:border-teal-400 focus:outline-none"
                          value={v.systeme}
                          onChange={(e) => updateField(v.id, 'systeme', e.target.value)}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm w-8 text-right ${cvssColor(v.cvss)}`}>{v.cvss}</span>
                          <div className="w-14 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${cvssBarColor(v.cvss)}`}
                              style={{ width: `${(v.cvss / 10) * 100}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          className={`rounded-lg border px-2 py-1 text-[10px] font-semibold focus:outline-none focus:ring-1 focus:ring-teal-400 ${vulnSeveriteBadge(v.severite)}`}
                          value={v.severite}
                          onChange={(e) => updateField(v.id, 'severite', e.target.value as VulnSeverite)}
                        >
                          {SEVERITES.map((s) => <option key={s}>{s}</option>)}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          className={`rounded-lg border px-2 py-1 text-[10px] font-semibold focus:outline-none focus:ring-1 focus:ring-teal-400 ${vulnStatutBadge(v.statut)}`}
                          value={v.statut}
                          onChange={(e) => updateField(v.id, 'statut', e.target.value as VulnStatut)}
                        >
                          {VULNS_STATUTS.map((s) => <option key={s}>{s}</option>)}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        {v.statut !== 'Patchée' ? (
                          <input
                            type="date"
                            className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 focus:border-teal-400 focus:outline-none"
                            value={v.echeance}
                            onChange={(e) => updateField(v.id, 'echeance', e.target.value)}
                          />
                        ) : (
                          <span className="text-xs text-emerald-600 font-medium">✓ Patchée</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => deleteVuln(v.id)}
                          className="text-slate-300 hover:text-red-500 transition-colors"
                          aria-label="Supprimer"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                            <path d="M10 11v6 M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}

                  {/* Add row */}
                  <tr className="bg-slate-50/40">
                    <td className="px-4 py-3">
                      <input
                        placeholder="CVE-XXXX-XXXXX"
                        className="w-32 rounded-lg border border-slate-200 bg-white px-2 py-1.5 font-mono text-xs placeholder:text-slate-400 focus:border-teal-400 focus:outline-none"
                        value={add.cve}
                        onChange={(e) => setAdd({ ...add, cve: e.target.value })}
                        onKeyDown={(e) => e.key === 'Enter' && addVuln()}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        placeholder="Description"
                        className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm placeholder:text-slate-400 focus:border-teal-400 focus:outline-none"
                        value={add.description}
                        onChange={(e) => setAdd({ ...add, description: e.target.value })}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        placeholder="Système"
                        className="w-28 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs placeholder:text-slate-400 focus:border-teal-400 focus:outline-none"
                        value={add.systeme}
                        onChange={(e) => setAdd({ ...add, systeme: e.target.value })}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        min="0"
                        max="10"
                        step="0.1"
                        className="w-16 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm focus:border-teal-400 focus:outline-none"
                        value={add.cvss}
                        onChange={(e) => setAdd({ ...add, cvss: parseFloat(e.target.value) || 0 })}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <select
                        className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs focus:border-teal-400 focus:outline-none"
                        value={add.severite}
                        onChange={(e) => setAdd({ ...add, severite: e.target.value as VulnSeverite })}
                      >
                        {SEVERITES.map((s) => <option key={s}>{s}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs focus:border-teal-400 focus:outline-none"
                        value={add.statut}
                        onChange={(e) => setAdd({ ...add, statut: e.target.value as VulnStatut })}
                      >
                        {VULNS_STATUTS.map((s) => <option key={s}>{s}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="date"
                        className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs focus:border-teal-400 focus:outline-none"
                        value={add.echeance}
                        onChange={(e) => setAdd({ ...add, echeance: e.target.value })}
                      />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={addVuln}
                        className="rounded-lg bg-teal-600 px-3.5 py-1.5 text-sm font-semibold text-white hover:bg-teal-700 transition-colors"
                      >
                        Ajouter
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <p className="text-[11px] text-slate-400">
            Référentiels : NIS2 Art. 21.2 · ANSSI ReCyF O9 · CVSS v3.1 (NIST NVD) · CISA KEV.
          </p>
        </div>
      )}
    </div>
  );
}
