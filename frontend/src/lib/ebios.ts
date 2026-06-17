import { useState, useEffect, useCallback } from 'react';

// ── Types ─────────────────────────────────────────────────────────────────────
export type Gravity = 1 | 2 | 3 | 4;
export type Vraisemblance = 1 | 2 | 3 | 4;
export type Traitement = 'Réduire' | 'Transférer' | 'Accepter' | 'Éviter';
export type RiskStatut = 'Ouvert' | 'En traitement' | 'Accepté' | 'Clôturé';

export interface EbiosRisk {
  id: string;
  scenario: string;
  source: string;
  gravity: Gravity;
  vraisemblance: Vraisemblance;
  traitement: Traitement;
  statut: RiskStatut;
}

export const TRAITEMENTS: Traitement[] = ['Réduire', 'Transférer', 'Accepter', 'Éviter'];
export const RISK_STATUTS: RiskStatut[] = ['Ouvert', 'En traitement', 'Accepté', 'Clôturé'];
export const SCALE = [1, 2, 3, 4] as const;

export const ATELIERS = [
  'Atelier 1 — Cadrage et socle de sécurité',
  'Atelier 2 — Sources de risque',
  'Atelier 3 — Scénarios stratégiques',
  'Atelier 4 — Scénarios opérationnels',
  'Atelier 5 — Traitement du risque et amélioration continue',
];

export const DEMO_RISKS: EbiosRisk[] = [
  { id: '1', scenario: 'Rançongiciel chiffrant le SI de production', source: 'Cybercriminel', gravity: 4, vraisemblance: 3, traitement: 'Réduire', statut: 'Ouvert' },
  { id: '2', scenario: "Compromission de l'Active Directory", source: 'Attaquant ciblé', gravity: 4, vraisemblance: 2, traitement: 'Réduire', statut: 'Ouvert' },
  { id: '3', scenario: 'Indisponibilité majeure du fournisseur cloud', source: 'Tiers', gravity: 3, vraisemblance: 2, traitement: 'Transférer', statut: 'En traitement' },
  { id: '4', scenario: 'Fuite de données personnelles', source: 'Interne malveillant', gravity: 3, vraisemblance: 2, traitement: 'Réduire', statut: 'Ouvert' },
  { id: '5', scenario: "Phishing menant à un vol d'identifiants", source: 'Cybercriminel', gravity: 2, vraisemblance: 4, traitement: 'Réduire', statut: 'En traitement' },
  { id: '6', scenario: "Rupture d'un fournisseur critique", source: 'Tiers', gravity: 3, vraisemblance: 1, traitement: 'Accepter', statut: 'Accepté' },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
export function criticite(g: number, v: number): number {
  return g * v;
}

export function critColor(score: number): string {
  if (score >= 12) return 'bg-red-600 text-white';
  if (score >= 8) return 'bg-orange-500 text-white';
  if (score >= 4) return 'bg-amber-400 text-slate-900';
  return 'bg-teal-600 text-white';
}

export function matrixBg(g: number, v: number): string {
  const s = g * v;
  if (s >= 12) return 'bg-red-700';
  if (s >= 8) return 'bg-orange-600';
  if (s >= 4) return 'bg-amber-500';
  return 'bg-teal-800';
}

export function openRisksCount(risks: EbiosRisk[]): number {
  return risks.filter((r) => r.statut !== 'Clôturé').length;
}

export function criticalRisksCount(risks: EbiosRisk[]): number {
  return risks.filter((r) => criticite(r.gravity, r.vraisemblance) >= 12).length;
}

// ── Persistence + live sync ───────────────────────────────────────────────────
const EBIOS_EVENT = 'nis2:ebios-updated';
const key = (orgId: string) => `nis2.ebios.${orgId}`;

export function loadEbios(orgId: string): EbiosRisk[] {
  const raw = localStorage.getItem(key(orgId));
  if (raw) {
    try {
      return JSON.parse(raw) as EbiosRisk[];
    } catch {
      /* fall through */
    }
  }
  return DEMO_RISKS.map((r) => ({ ...r }));
}

export function saveEbios(orgId: string, risks: EbiosRisk[]): void {
  localStorage.setItem(key(orgId), JSON.stringify(risks));
  window.dispatchEvent(new CustomEvent(EBIOS_EVENT));
}

export function useEbios(orgId: string | null) {
  const [risks, setRisksState] = useState<EbiosRisk[]>(() =>
    orgId ? loadEbios(orgId) : [],
  );

  useEffect(() => {
    setRisksState(orgId ? loadEbios(orgId) : []);
  }, [orgId]);

  useEffect(() => {
    const refresh = () => setRisksState(orgId ? loadEbios(orgId) : []);
    window.addEventListener(EBIOS_EVENT, refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener(EBIOS_EVENT, refresh);
      window.removeEventListener('storage', refresh);
    };
  }, [orgId]);

  const setRisks = useCallback(
    (next: EbiosRisk[]) => {
      setRisksState(next);
      if (orgId) saveEbios(orgId, next);
    },
    [orgId],
  );

  return { risks, setRisks };
}
