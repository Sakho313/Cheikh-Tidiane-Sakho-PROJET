import { Response } from 'express';
import { successResponse, errorResponse, paginatedResponse } from '../../src/shared/utils/response';

function mockResponse(): Response {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  } as unknown as Response;
}

describe('response helpers', () => {
  let res: Response;

  beforeEach(() => {
    res = mockResponse();
  });

  // ─── successResponse() ───────────────────────────────────────────────────────

  describe('successResponse()', () => {
    it('should respond with status 200 and { success: true, data } by default', () => {
      const data = { id: 1, name: 'Acme Corp' };

      successResponse(res, data);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data,
        message: undefined,
      });
    });

    it('should include the provided message', () => {
      successResponse(res, { ok: true }, 'Created successfully');

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { ok: true },
        message: 'Created successfully',
      });
    });

    it('should honour a custom status code', () => {
      successResponse(res, { id: 1 }, 'Resource created', 201);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { id: 1 },
        message: 'Resource created',
      });
    });
  });

  // ─── errorResponse() ─────────────────────────────────────────────────────────

  describe('errorResponse()', () => {
    it('should respond with status 400 and { success: false, message } by default', () => {
      errorResponse(res, 'Something went wrong');

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Something went wrong',
      });
    });

    it('should honour a custom status code', () => {
      errorResponse(res, 'Not found', 404);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Not found',
      });
    });

    it('should include field-level errors when provided', () => {
      const errors = [{ field: 'email', message: 'Invalid email' }];

      errorResponse(res, 'Validation failed', 400, errors);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Validation failed',
        errors,
      });
    });

    it('should NOT include an errors property when the errors array is empty', () => {
      errorResponse(res, 'Validation failed', 400, []);

      const body = (res.json as jest.Mock).mock.calls[0][0];
      expect(body).toEqual({ success: false, message: 'Validation failed' });
      expect(body).not.toHaveProperty('errors');
    });
  });

  // ─── paginatedResponse() ─────────────────────────────────────────────────────

  describe('paginatedResponse()', () => {
    it('should respond with status 200 and a correctly shaped paginated body', () => {
      const data = [{ id: 1 }, { id: 2 }];

      paginatedResponse(res, data, 100, 1, 20);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          data,
          total: 100,
          page: 1,
          limit: 20,
          totalPages: 5,
        },
      });
    });

    it('should compute totalPages as the ceiling of total / limit', () => {
      paginatedResponse(res, [], 101, 2, 20);

      const body = (res.json as jest.Mock).mock.calls[0][0];
      expect(body.data.totalPages).toBe(6);
      expect(body.data.page).toBe(2);
      expect(body.data.limit).toBe(20);
      expect(body.data.total).toBe(101);
    });
  });
});
