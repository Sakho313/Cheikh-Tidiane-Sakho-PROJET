import { useState, useEffect, useCallback } from 'react';

export type VulnSeverite = 'Critique' | 'Élevé' | 'Moyen' | 'Faible';
export type VulnStatut = 'En attente' | 'En cours' | 'Patchée' | 'Acceptée';

export interface Vulnerability {
  id: string;
  cve: string;
  description: string;
  systeme: string;
  cvss: number; // 0–10
  severite: VulnSeverite;
  statut: VulnStatut;
  echeance: string; // yyyy-mm-dd or ''
}

export const SEVERITES: VulnSeverite[] = ['Critique', 'Élevé', 'Moyen', 'Faible'];
export const VULNS_STATUTS: VulnStatut[] = ['En attente', 'En cours', 'Patchée', 'Acceptée'];

export const DEFAULT_VULNS: Vulnerability[] = [
  { id: 'v1', cve: 'CVE-2024-21413', description: 'Microsoft Office — RCE via Outlook', systeme: 'Postes Windows', cvss: 9.8, severite: 'Critique', statut: 'En cours', echeance: '2026-06-30' },
  { id: 'v2', cve: 'CVE-2021-44228', description: 'Log4Shell — exécution de code distant', systeme: 'Serveurs Java', cvss: 10.0, severite: 'Critique', statut: 'Patchée', echeance: '' },
  { id: 'v3', cve: 'CVE-2024-3400', description: 'PAN-OS GlobalProtect — RCE authentifié', systeme: 'Firewall / VPN', cvss: 10.0, severite: 'Critique', statut: 'En cours', echeance: '2026-06-25' },
  { id: 'v4', cve: 'CVE-2024-1709', description: 'ConnectWise ScreenConnect — contournement auth.', systeme: "Outils d'accès distant", cvss: 10.0, severite: 'Critique', statut: 'En attente', echeance: '2026-07-10' },
  { id: 'v5', cve: 'CVE-2023-4966', description: 'Citrix Bleed — fuite de jeton de session', systeme: 'NetScaler ADC', cvss: 9.4, severite: 'Critique', statut: 'Patchée', echeance: '' },
  { id: 'v6', cve: 'CVE-2024-6387', description: 'regreSSHion — RCE OpenSSH sans authentification', systeme: 'Serveurs Linux', cvss: 8.1, severite: 'Élevé', statut: 'En cours', echeance: '2026-07-15' },
  { id: 'v7', cve: 'CVE-2024-38063', description: 'Windows TCP/IP — dépassement de tampon RCE', systeme: 'Serveurs Windows', cvss: 9.8, severite: 'Critique', statut: 'En attente', echeance: '2026-07-20' },
  { id: 'v8', cve: 'CVE-2023-34362', description: 'MOVEit Transfer — injection SQL', systeme: 'Transfert de fichiers', cvss: 9.8, severite: 'Critique', statut: 'Patchée', echeance: '' },
];

export function cvssColor(score: number): string {
  if (score >= 9) return 'text-red-600 font-bold';
  if (score >= 7) return 'text-orange-600 font-semibold';
  if (score >= 4) return 'text-amber-600';
  return 'text-slate-500';
}

export function cvssBarColor(score: number): string {
  if (score >= 9) return 'bg-red-500';
  if (score >= 7) return 'bg-orange-500';
  if (score >= 4) return 'bg-amber-400';
  return 'bg-emerald-400';
}

export function vulnSeveriteBadge(s: VulnSeverite): string {
  const m: Record<VulnSeverite, string> = {
    Critique: 'bg-red-50 text-red-700 border-red-200',
    Élevé: 'bg-orange-50 text-orange-700 border-orange-200',
    Moyen: 'bg-amber-50 text-amber-700 border-amber-200',
    Faible: 'bg-slate-50 text-slate-600 border-slate-200',
  };
  return m[s];
}

export function vulnStatutBadge(s: VulnStatut): string {
  const m: Record<VulnStatut, string> = {
    Patchée: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'En cours': 'bg-teal-50 text-teal-700 border-teal-200',
    'En attente': 'bg-amber-50 text-amber-700 border-amber-200',
    Acceptée: 'bg-slate-50 text-slate-500 border-slate-200',
  };
  return m[s];
}

export function criticalOpenCount(vulns: Vulnerability[]): number {
  return vulns.filter((v) => v.severite === 'Critique' && v.statut !== 'Patchée').length;
}

export function unpatchedCount(vulns: Vulnerability[]): number {
  return vulns.filter((v) => v.statut === 'En attente' || v.statut === 'En cours').length;
}

const EVENT = 'nis2:vulns-updated';
const sKey = (id: string) => `nis2.vulns.${id}`;

export function loadVulns(orgId: string): Vulnerability[] {
  const raw = localStorage.getItem(sKey(orgId));
  if (raw) { try { return JSON.parse(raw) as Vulnerability[]; } catch { /* fall through */ } }
  return DEFAULT_VULNS.map((v) => ({ ...v }));
}

export function saveVulns(orgId: string, vulns: Vulnerability[]): void {
  localStorage.setItem(sKey(orgId), JSON.stringify(vulns));
  window.dispatchEvent(new CustomEvent(EVENT));
}

export function useVulns(orgId: string | null) {
  const [vulns, setVulnsState] = useState<Vulnerability[]>(() => orgId ? loadVulns(orgId) : []);

  useEffect(() => { setVulnsState(orgId ? loadVulns(orgId) : []); }, [orgId]);

  useEffect(() => {
    const refresh = () => setVulnsState(orgId ? loadVulns(orgId) : []);
    window.addEventListener(EVENT, refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener(EVENT, refresh);
      window.removeEventListener('storage', refresh);
    };
  }, [orgId]);

  const setVulns = useCallback((next: Vulnerability[]) => {
    setVulnsState(next);
    if (orgId) saveVulns(orgId, next);
  }, [orgId]);

  return { vulns, setVulns };
}
