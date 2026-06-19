import { apiClient, toQuery, unwrap } from './client';
import type {
  ApiResponse,
  PaginatedResponse,
  PaginationParams,
  Report,
  ReportType,
} from '@/types';

export interface GenerateReportPayload {
  type: ReportType;
  title?: string;
  periodStart?: string;
  periodEnd?: string;
}

export const reportsApi = {
  async list(filters?: PaginationParams & { type?: ReportType }): Promise<PaginatedResponse<Report>> {
    const res = await apiClient.get<ApiResponse<PaginatedResponse<Report>>>('/reports', {
      params: toQuery(filters),
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

  /**
   * Builds the absolute download URL for a report export. The backend exposes
   * `GET /reports/:id/export?format=pdf|xlsx|csv`; the bearer token is appended
   * as a query param so a plain anchor/`window.open` can fetch it.
   */
  exportUrl(id: string, format: 'pdf' | 'xlsx' | 'csv', accessToken?: string | null): string {
    const params = new URLSearchParams({ format });
    if (accessToken) params.set('token', accessToken);
    return `${apiClient.defaults.baseURL ?? ''}/reports/${id}/export?${params.toString()}`;
  },
};
