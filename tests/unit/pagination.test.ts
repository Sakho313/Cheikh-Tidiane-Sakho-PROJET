import { parsePagination, calculateTotalPages } from '../../src/shared/utils/pagination';

describe('pagination utilities', () => {
  // ─── parsePagination() ───────────────────────────────────────────────────────

  describe('parsePagination()', () => {
    it('should apply defaults (page=1, limit=20, skip=0) for an empty query', () => {
      const result = parsePagination({});

      expect(result).toEqual({ page: 1, limit: 20, skip: 0, search: undefined });
    });

    it('should parse valid page and limit and compute skip correctly', () => {
      const result = parsePagination({ page: '3', limit: '25' });

      expect(result.page).toBe(3);
      expect(result.limit).toBe(25);
      // skip = (page - 1) * limit = (3 - 1) * 25 = 50
      expect(result.skip).toBe(50);
    });

    it('should accept numeric (non-string) query values', () => {
      const result = parsePagination({ page: 2, limit: 10 });

      expect(result.page).toBe(2);
      expect(result.limit).toBe(10);
      expect(result.skip).toBe(10);
    });

    it('should cap the limit at 100', () => {
      const result = parsePagination({ page: '1', limit: '500' });

      expect(result.limit).toBe(100);
      expect(result.skip).toBe(0);
    });

    it('should allow a limit of exactly 100', () => {
      const result = parsePagination({ limit: '100' });
      expect(result.limit).toBe(100);
    });

    it('should fall back to page=1 when page is negative', () => {
      const result = parsePagination({ page: '-5' });
      expect(result.page).toBe(1);
      expect(result.skip).toBe(0);
    });

    it('should fall back to page=1 when page is zero', () => {
      const result = parsePagination({ page: '0' });
      expect(result.page).toBe(1);
    });

    it('should fall back to limit=20 when limit is 0', () => {
      const result = parsePagination({ limit: '0' });
      expect(result.limit).toBe(20);
    });

    it('should fall back to limit=20 when limit is negative', () => {
      const result = parsePagination({ limit: '-10' });
      expect(result.limit).toBe(20);
    });

    it('should fall back to defaults for non-numeric values', () => {
      const result = parsePagination({ page: 'abc', limit: 'xyz' });
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
      expect(result.skip).toBe(0);
    });

    it('should trim and return a non-empty search string', () => {
      const result = parsePagination({ search: '  hello world  ' });
      expect(result.search).toBe('hello world');
    });

    it('should return undefined search for an empty / whitespace-only string', () => {
      expect(parsePagination({ search: '' }).search).toBeUndefined();
      expect(parsePagination({ search: '   ' }).search).toBeUndefined();
    });

    it('should return undefined search for a non-string search value', () => {
      const result = parsePagination({ search: 123 });
      expect(result.search).toBeUndefined();
    });
  });

  // ─── calculateTotalPages() ───────────────────────────────────────────────────

  describe('calculateTotalPages()', () => {
    it('should compute the ceiling of total / limit', () => {
      expect(calculateTotalPages(100, 20)).toBe(5);
      expect(calculateTotalPages(101, 20)).toBe(6);
      expect(calculateTotalPages(1, 20)).toBe(1);
    });

    it('should return 0 when there are no records', () => {
      expect(calculateTotalPages(0, 20)).toBe(0);
    });

    it('should return 0 when the limit is 0 (guard against division by zero)', () => {
      expect(calculateTotalPages(50, 0)).toBe(0);
    });

    it('should return 0 when the limit is negative', () => {
      expect(calculateTotalPages(50, -10)).toBe(0);
    });
  });
});
