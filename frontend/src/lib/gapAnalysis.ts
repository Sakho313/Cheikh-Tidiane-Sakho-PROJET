import { useState, useEffect, useCallback } from 'react';

// ── Types ─────────────────────────────────────────────────────────────────────
export interface GapRequirement {
  id: string;
  domaine: string;
  ref: string;
  exigence: string;
  maturite: number; // 0-5
  responsable: string;
  preuve: string;
}

export type GapStatus = 'NON CONFORME' | 'PARTIEL' | 'CONFORME';

// ── Maturity scale (CMMI-like, 0-5) ───────────────────────────────────────────
export const MATURITY_LEVELS: Array<{ value: number; label: string }> = [
  { value: 0, label: '0 — Inexistant' },
  { value: 1, label: '1 — Initial' },
  { value: 2, label: '2 — Défini' },
  { value: 3, label: '3 — Géré' },
  { value: 4, label: '4 — Maîtrisé' },
  { value: 5, label: '5 — Optimisé' },
];

export function statusFromMaturity(m: number): GapStatus {
  if (m <= 1) return 'NON CONFORME';
  if (m <= 3) return 'PARTIEL';
  return 'CONFORME';
}

// Tailwind classes for the status badge (animated via transition-colors).
export const gapStatusBadge: Record<GapStatus, string> = {
  'NON CONFORME': 'bg-red-50 text-red-600 border border-red-200',
  PARTIEL: 'bg-amber-50 text-amber-700 border border-amber-200',
  CONFORME: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
};

// Tint for the maturity <select> so the control colour also "corresponds".
export const gapSelectTint: Record<GapStatus, string> = {
  'NON CONFORME': 'border-red-200 text-red-700',
  PARTIEL: 'border-amber-200 text-amber-700',
  CONFORME: 'border-emerald-200 text-emerald-700',
};

// ── Demo data (matches the SAO Pilotage NIS2 reference) ───────────────────────
export const DEFAULT_REQUIREMENTS: GapRequirement[] = [
  { id: 'g1', domaine: 'Gouvernance', ref: 'Art.20', exigence: "Implication et formation de l'organe de direction", maturite: 2, responsable: 'Direction', preuve: 'PV de comité' },
  { id: 'g2', domaine: 'Gouvernance', ref: 'ReCyF O1', exigence: 'Politique de sécurité validée par la direction', maturite: 3, responsable: 'RSSI', preuve: 'PSSI v2' },
  { id: 'g3', domaine: 'Analyse de risque', ref: 'Art.21.2.a', exigence: 'Analyse des risques formalisée (EBIOS RM)', maturite: 2, responsable: 'RSSI', preuve: 'Rapport risque' },
  { id: 'g4', domaine: 'Gestion des incidents', ref: 'Art.21.2.b', exigence: 'Procédure de détection et de réponse aux incidents', maturite: 2, responsable: 'SOC', preuve: 'Procédure IR' },
  { id: 'g5', domaine: 'Notification', ref: 'Art.23', exigence: 'Circuit de notification 24h/72h/1 mois testé', maturite: 1, responsable: 'RSSI', preuve: '' },
  { id: 'g6', domaine: 'Continuité', ref: 'Art.21.2.c', exigence: 'PCA/PRA et sauvegardes testés', maturite: 2, responsable: 'DSI', preuve: 'PV de test' },
  { id: 'g7', domaine: "Chaîne d'appro.", ref: 'Art.21.2.d', exigence: "Sécurité de la chaîne d'approvisionnement", maturite: 1, responsable: 'Achats', preuve: '' },
  { id: 'g8', domaine: 'Acquisition/Dev', ref: 'Art.21.2.e', exigence: 'Sécurité acquisition, développement et maintenance', maturite: 2, responsable: 'DSI', preuve: 'Politique SDLC' },
  { id: 'g9', domaine: 'Efficacité', ref: 'Art.21.2.f', exigence: "Évaluation de l'efficacité des mesures de sécurité", maturite: 1, responsable: 'RSSI', preuve: '' },
  { id: 'g10', domaine: 'Hygiène & formation', ref: 'Art.21.2.g', exigence: 'Cyber-hygiène de base et formation du personnel', maturite: 3, responsable: 'RH', preuve: 'Plan de formation' },
  { id: 'g11', domaine: 'Cryptographie', ref: 'Art.21.2.h', exigence: 'Politique de chiffrement et gestion des clés', maturite: 1, responsable: 'DSI', preuve: '' },
  { id: 'g12', domaine: "Contrôle d'accès", ref: 'Art.21.2.i', exigence: "RH, contrôle d'accès et gestion des actifs", maturite: 3, responsable: 'DSI', preuve: 'Matrice habilitations' },
  { id: 'g13', domaine: 'MFA', ref: 'Art.21.2.j', exigence: 'MFA et authentification continue', maturite: 3, responsable: 'DSI', preuve: 'Config MFA' },
  { id: 'g14', domaine: 'Vulnérabilités', ref: 'ReCyF V1', exigence: 'Gestion des vulnérabilités et des correctifs', maturite: 1, responsable: 'SOC', preuve: '' },
  { id: 'g15', domaine: 'Sensibilisation', ref: 'ReCyF H1', exigence: 'Programme de sensibilisation continue', maturite: 3, responsable: 'RH', preuve: 'Support e-learning' },
];

// ── Persistence + live sync ───────────────────────────────────────────────────
const GAP_EVENT = 'nis2:gap-updated';
const key = (orgId: string) => `nis2.gap.${orgId}`;

export function loadGap(orgId: string): GapRequirement[] {
  const raw = localStorage.getItem(key(orgId));
  if (raw) {
    try {
      return JSON.parse(raw) as GapRequirement[];
    } catch {
      /* fall through to defaults */
    }
  }
  return DEFAULT_REQUIREMENTS.map((r) => ({ ...r }));
}

export function saveGap(orgId: string, reqs: GapRequirement[]): void {
  localStorage.setItem(key(orgId), JSON.stringify(reqs));
  window.dispatchEvent(new CustomEvent(GAP_EVENT));
}

export function resetGap(orgId: string): void {
  localStorage.removeItem(key(orgId));
  window.dispatchEvent(new CustomEvent(GAP_EVENT));
}

/** React hook giving a live, persisted gap-analysis list for an org. */
export function useGap(orgId: string | null) {
  const [reqs, setReqsState] = useState<GapRequirement[]>(() =>
    orgId ? loadGap(orgId) : [],
  );

  useEffect(() => {
    setReqsState(orgId ? loadGap(orgId) : []);
  }, [orgId]);

  useEffect(() => {
    const refresh = () => setReqsState(orgId ? loadGap(orgId) : []);
    window.addEventListener(GAP_EVENT, refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener(GAP_EVENT, refresh);
      window.removeEventListener('storage', refresh);
    };
  }, [orgId]);

  const setReqs = useCallback(
    (next: GapRequirement[]) => {
      setReqsState(next);
      if (orgId) saveGap(orgId, next);
    },
    [orgId],
  );

  return { reqs, setReqs };
}

// ── Aggregations ──────────────────────────────────────────────────────────────
export function globalMaturity(reqs: GapRequirement[]): number {
  if (reqs.length === 0) return 0;
  const sum = reqs.reduce((s, r) => s + r.maturite, 0);
  return Math.round((sum / (reqs.length * 5)) * 100);
}

export function conformityRate(reqs: GapRequirement[]): number {
  if (reqs.length === 0) return 0;
  const conform = reqs.filter((r) => statusFromMaturity(r.maturite) === 'CONFORME').length;
  return Math.round((conform / reqs.length) * 100);
}

export function domainScores(reqs: GapRequirement[]): Array<{ domaine: string; score: number }> {
  const groups = new Map<string, number[]>();
  reqs.forEach((r) => {
    const arr = groups.get(r.domaine) ?? [];
    arr.push(r.maturite);
    groups.set(r.domaine, arr);
  });
  return Array.from(groups.entries()).map(([domaine, levels]) => ({
    domaine,
    score: Math.round((levels.reduce((a, b) => a + b, 0) / (levels.length * 5)) * 100),
  }));
}

export function nonConformCount(reqs: GapRequirement[]): number {
  return reqs.filter((r) => statusFromMaturity(r.maturite) === 'NON CONFORME').length;
}
