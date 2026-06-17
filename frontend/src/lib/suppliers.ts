import { useState, useEffect, useCallback } from 'react';

export type SupplierCriticite = 'Critique' | 'Importante' | 'Standard' | 'Faible';
export type SupplierRisque = 'Élevé' | 'Moyen' | 'Faible';
export type SupplierEvaluation = 'À évaluer' | 'En cours' | 'Évalué';

export interface Supplier {
  id: string;
  nom: string;
  criticite: SupplierCriticite;
  niveauRisque: SupplierRisque;
  evaluation: SupplierEvaluation;
}

export const CRITICITES: SupplierCriticite[] = ['Critique', 'Importante', 'Standard', 'Faible'];
export const RISQUES: SupplierRisque[] = ['Élevé', 'Moyen', 'Faible'];
export const EVALUATIONS: SupplierEvaluation[] = ['À évaluer', 'En cours', 'Évalué'];

export const DEFAULT_SUPPLIERS: Supplier[] = [
  { id: 's1', nom: 'Hébergeur cloud', criticite: 'Critique', niveauRisque: 'Moyen', evaluation: 'À évaluer' },
  { id: 's2', nom: 'Éditeur ERP', criticite: 'Critique', niveauRisque: 'Faible', evaluation: 'Évalué' },
  { id: 's3', nom: 'Infogérance', criticite: 'Critique', niveauRisque: 'Élevé', evaluation: 'À évaluer' },
  { id: 's4', nom: 'Prestataire SOC', criticite: 'Importante', niveauRisque: 'Faible', evaluation: 'Évalué' },
];

const SUPPLIERS_EVENT = 'nis2:suppliers-updated';
const key = (orgId: string) => `nis2.suppliers.${orgId}`;

export function loadSuppliers(orgId: string): Supplier[] {
  const raw = localStorage.getItem(key(orgId));
  if (raw) {
    try {
      return JSON.parse(raw) as Supplier[];
    } catch { /* fall through */ }
  }
  return DEFAULT_SUPPLIERS.map((s) => ({ ...s }));
}

export function saveSuppliers(orgId: string, suppliers: Supplier[]): void {
  localStorage.setItem(key(orgId), JSON.stringify(suppliers));
  window.dispatchEvent(new CustomEvent(SUPPLIERS_EVENT));
}

export function useSuppliers(orgId: string | null) {
  const [suppliers, setSuppliersState] = useState<Supplier[]>(() =>
    orgId ? loadSuppliers(orgId) : [],
  );

  useEffect(() => {
    setSuppliersState(orgId ? loadSuppliers(orgId) : []);
  }, [orgId]);

  useEffect(() => {
    const refresh = () => setSuppliersState(orgId ? loadSuppliers(orgId) : []);
    window.addEventListener(SUPPLIERS_EVENT, refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener(SUPPLIERS_EVENT, refresh);
      window.removeEventListener('storage', refresh);
    };
  }, [orgId]);

  const setSuppliers = useCallback(
    (next: Supplier[]) => {
      setSuppliersState(next);
      if (orgId) saveSuppliers(orgId, next);
    },
    [orgId],
  );

  return { suppliers, setSuppliers };
}

export function pendingEvaluationCount(suppliers: Supplier[]): number {
  return suppliers.filter((s) => s.evaluation === 'À évaluer').length;
}
