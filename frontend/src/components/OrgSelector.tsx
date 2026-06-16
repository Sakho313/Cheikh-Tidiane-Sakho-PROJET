import { useEffect, useMemo } from 'react';
import { useOrganizations } from '@/hooks/useOrganizations';

interface OrgSelectorProps {
  value: string | null;
  onChange: (orgId: string) => void;
}

/**
 * Organization picker shared across pages. Auto-selects the first organization
 * when none is selected yet.
 */
export function OrgSelector({ value, onChange }: OrgSelectorProps) {
  const { data, isLoading } = useOrganizations();
  const organizations = useMemo(() => data?.data ?? [], [data]);

  useEffect(() => {
    if (!value && organizations.length > 0) {
      onChange(organizations[0].id);
    }
  }, [value, organizations, onChange]);

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="org-selector" className="text-sm font-medium text-gray-600">
        Organisation
      </label>
      <select
        id="org-selector"
        className="form-input w-64"
        value={value ?? ''}
        disabled={isLoading || organizations.length === 0}
        onChange={(e) => onChange(e.target.value)}
      >
        {organizations.length === 0 && <option value="">Aucune organisation</option>}
        {organizations.map((org) => (
          <option key={org.id} value={org.id}>
            {org.name}
          </option>
        ))}
      </select>
    </div>
  );
}
