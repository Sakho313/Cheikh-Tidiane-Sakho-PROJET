import { ParsedPagination } from '../types';

export function parsePagination(query: Record<string, unknown>): ParsedPagination {
  const rawPage = parseInt(String(query['page'] ?? '1'), 10);
  const rawLimit = parseInt(String(query['limit'] ?? '20'), 10);

  const page = isNaN(rawPage) || rawPage < 1 ? 1 : rawPage;
  const limit = isNaN(rawLimit) || rawLimit < 1 ? 20 : Math.min(rawLimit, 100);
  const skip = (page - 1) * limit;

  const rawSearch = query['search'];
  const search =
    typeof rawSearch === 'string' && rawSearch.trim().length > 0 ? rawSearch.trim() : undefined;

  return { page, limit, skip, search };
}

export function calculateTotalPages(total: number, limit: number): number {
  if (limit <= 0) return 0;
  return Math.ceil(total / limit);
}
