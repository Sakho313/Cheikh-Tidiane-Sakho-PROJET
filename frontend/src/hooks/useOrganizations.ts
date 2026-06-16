import { useQuery } from '@tanstack/react-query';
import { organizationsApi } from '@/api/organizations';

export function useOrganizations() {
  return useQuery({
    queryKey: ['organizations', { page: 1, limit: 100 }],
    queryFn: () => organizationsApi.list({ page: 1, limit: 100 }),
  });
}
