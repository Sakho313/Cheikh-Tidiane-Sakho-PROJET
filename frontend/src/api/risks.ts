import { apiClient, unwrap } from './client';
import type {
  ApiResponse,
  PaginatedData,
  Risk,
  RiskMatrix,
  RiskPayload,
  RiskStats,
} from '@/types';

export const risksApi = {
  async list(
    orgId: string,
    params?: { page?: number; limit?: number; category?: string; status?: string },
  ): Promise<PaginatedData<Risk>> {
    const res = await apiClient.get<ApiResponse<PaginatedData<Risk>>>(`/risks/org/${orgId}`, {
      params,
    });
    return unwrap(res);
  },

  async get(id: string): Promise<Risk> {
    const res = await apiClient.get<ApiResponse<Risk>>(`/risks/${id}`);
    return unwrap(res);
  },

  async getMatrix(orgId: string): Promise<RiskMatrix> {
    const res = await apiClient.get<ApiResponse<RiskMatrix>>(`/risks/matrix/${orgId}`);
    return unwrap(res);
  },

  async getStats(orgId: string): Promise<RiskStats> {
    const res = await apiClient.get<ApiResponse<RiskStats>>(`/risks/stats/${orgId}`);
    return unwrap(res);
  },

  async create(payload: RiskPayload): Promise<Risk> {
    const res = await apiClient.post<ApiResponse<Risk>>('/risks', payload);
    return unwrap(res);
  },

  async update(id: string, payload: Partial<RiskPayload>): Promise<Risk> {
    const res = await apiClient.put<ApiResponse<Risk>>(`/risks/${id}`, payload);
    return unwrap(res);
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete<ApiResponse<null>>(`/risks/${id}`);
  },
};
