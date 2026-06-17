import { useState, useEffect, useCallback } from 'react';
import { statusFromMaturity, type GapRequirement } from '@/lib/gapAnalysis';

// ── Types ─────────────────────────────────────────────────────────────────────
export type ActionPriorite = 'Haute' | 'Moyenne' | 'Basse';
export type ActionStatut = 'À faire' | 'En cours' | 'Terminé';

export interface RoadmapAction {
  id: string;
  action: string;
  module: string;
  responsable: string;
  echeance: string; // yyyy-mm-dd
  priorite: ActionPriorite;
  statut: ActionStatut;
  kpi: string;
}

export const PRIORITES: ActionPriorite[] = ['Haute', 'Moyenne', 'Basse'];
export const STATUTS: ActionStatut[] = ['À faire', 'En cours', 'Terminé'];

// Badge tints (used by the dashboard "Actions prioritaires" panel).
export const prioriteBadge: Record<ActionPriorite, string> = {
  Haute: 'bg-red-50 text-red-600 border border-red-200',
  Moyenne: 'bg-amber-50 text-amber-700 border border-amber-200',
  Basse: 'bg-slate-50 text-slate-600 border border-slate-200',
};

export const statutBadge: Record<ActionStatut, string> = {
  'En cours': 'bg-teal-50 text-teal-700 border border-teal-200',
  'À faire': 'bg-slate-50 text-slate-500 border border-slate-200',
  Terminé: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
};

// ── Demo data (matches the SAO Pilotage NIS2 reference) ───────────────────────
export const DEFAULT_ACTIONS: RoadmapAction[] = [
  { id: 'a1', action: "Tester le circuit de notification d'incident", module: 'Incidents', responsable: 'RSSI', echeance: '2026-07-31', priorite: 'Haute', statut: 'En cours', kpi: 'Délai 72h respecté' },
  { id: 'a2', action: 'Constituer le registre des fournisseurs critiques', module: 'Fournisseurs', responsable: 'Achats', echeance: '2026-08-15', priorite: 'Haute', statut: 'À faire', kpi: '% fournisseurs évalués' },
  { id: 'a3', action: 'Généraliser le MFA aux comptes à privilèges', module: 'Accès', responsable: 'DSI', echeance: '2026-09-30', priorite: 'Moyenne', statut: 'En cours', kpi: 'Couverture MFA %' },
  { id: 'a4', action: 'Réaliser un exercice de gestion de crise (Table Top)', module: 'Crise', responsable: 'RSSI', echeance: '2026-10-15', priorite: 'Moyenne', statut: 'À faire', kpi: 'Exercices réalisés' },
  { id: 'a5', action: "Mettre à jour l'analyse de risque EBIOS RM", module: 'Risques', responsable: 'RSSI', echeance: '2026-07-20', priorite: 'Haute', statut: 'En cours', kpi: 'Risques traités %' },
];

// ── Persistence + live sync ───────────────────────────────────────────────────
const ROADMAP_EVENT = 'nis2:roadmap-updated';
const key = (orgId: string) => `nis2.roadmap.${orgId}`;

export function loadRoadmap(orgId: string): RoadmapAction[] {
  const raw = localStorage.getItem(key(orgId));
  if (raw) {
    try {
      return JSON.parse(raw) as RoadmapAction[];
    } catch {
      /* fall through */
    }
  }
  return DEFAULT_ACTIONS.map((a) => ({ ...a }));
}

export function saveRoadmap(orgId: string, actions: RoadmapAction[]): void {
  localStorage.setItem(key(orgId), JSON.stringify(actions));
  window.dispatchEvent(new CustomEvent(ROADMAP_EVENT));
}

export function useRoadmap(orgId: string | null) {
  const [actions, setActionsState] = useState<RoadmapAction[]>(() =>
    orgId ? loadRoadmap(orgId) : [],
  );

  useEffect(() => {
    setActionsState(orgId ? loadRoadmap(orgId) : []);
  }, [orgId]);

  useEffect(() => {
    const refresh = () => setActionsState(orgId ? loadRoadmap(orgId) : []);
    window.addEventListener(ROADMAP_EVENT, refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener(ROADMAP_EVENT, refresh);
      window.removeEventListener('storage', refresh);
    };
  }, [orgId]);

  const setActions = useCallback(
    (next: RoadmapAction[]) => {
      setActionsState(next);
      if (orgId) saveRoadmap(orgId, next);
    },
    [orgId],
  );

  return { actions, setActions };
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const priorityRank: Record<ActionPriorite, number> = { Haute: 0, Moyenne: 1, Basse: 2 };

export function sortedActions(actions: RoadmapAction[]): RoadmapAction[] {
  return [...actions].sort(
    (a, b) =>
      priorityRank[a.priorite] - priorityRank[b.priorite] ||
      a.echeance.localeCompare(b.echeance),
  );
}

export function overdueCount(actions: RoadmapAction[], now = new Date()): number {
  return actions.filter((a) => a.statut !== 'Terminé' && new Date(a.echeance) < now).length;
}

export function openCount(actions: RoadmapAction[]): number {
  return actions.filter((a) => a.statut !== 'Terminé').length;
}

/** Build remediation actions from the non-conform / partial gap requirements. */
export function generateFromGap(reqs: GapRequirement[]): RoadmapAction[] {
  const inThreeMonths = new Date();
  inThreeMonths.setMonth(inThreeMonths.getMonth() + 3);
  const echeance = inThreeMonths.toISOString().slice(0, 10);

  return reqs
    .filter((r) => statusFromMaturity(r.maturite) !== 'CONFORME')
    .map((r) => {
      const isCritical = statusFromMaturity(r.maturite) === 'NON CONFORME';
      return {
        id: `gap-${r.id}`,
        action: `Remédier : ${r.exigence}`,
        module: r.domaine,
        responsable: r.responsable || '—',
        echeance,
        priorite: (isCritical ? 'Haute' : 'Moyenne') as ActionPriorite,
        statut: 'À faire' as ActionStatut,
        kpi: `Maturité ≥ 4 (actuel ${r.maturite}/5)`,
      };
    });
}
