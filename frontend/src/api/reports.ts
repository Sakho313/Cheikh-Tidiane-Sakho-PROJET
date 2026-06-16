import { apiClient, unwrap } from './client';
import type {
  ApiResponse,
  GenerateReportPayload,
  PaginatedData,
  Report,
} from '@/types';

export const reportsApi = {
  async list(
    orgId: string,
    params?: { page?: number; limit?: number },
  ): Promise<PaginatedData<Report>> {
    const res = await apiClient.get<ApiResponse<PaginatedData<Report>>>(`/reports/org/${orgId}`, {
      params,
    });
    return unwrap(res);
  },

  async get(id: string): Promise<Report> {
    const res = await apiClient.get<ApiResponse<Report>>(`/reports/${id}`);
    return unwrap(res);
  },

  async generate(payload: GenerateReportPayload): Promise<Report> {
    const res = await apiClient.post<ApiResponse<Report>>('/reports/generate', payload);
    return unwrap(res);
  },
};
