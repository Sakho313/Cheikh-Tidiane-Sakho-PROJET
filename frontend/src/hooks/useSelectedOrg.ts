import { useState } from 'react';

const STORAGE_KEY = 'nis2.selectedOrg';

/**
 * Tracks the currently selected organization id, persisting it to localStorage
 * so the choice is preserved across pages and reloads.
 */
export function useSelectedOrg() {
  const [orgId, setOrgIdState] = useState<string | null>(
    () => localStorage.getItem(STORAGE_KEY),
  );

  const setOrgId = (id: string) => {
    localStorage.setItem(STORAGE_KEY, id);
    setOrgIdState(id);
  };

  return [orgId, setOrgId] as const;
}
