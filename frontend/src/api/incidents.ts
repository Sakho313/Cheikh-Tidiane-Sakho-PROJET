import { apiClient, unwrap } from './client';
import type {
  ApiResponse,
  Incident,
  IncidentPayload,
  IncidentStats,
  PaginatedData,
} from '@/types';

export const incidentsApi = {
  async list(
    orgId: string,
    params?: { page?: number; limit?: number; severity?: string; status?: string },
  ): Promise<PaginatedData<Incident>> {
    const res = await apiClient.get<ApiResponse<PaginatedData<Incident>>>(
      `/incidents/org/${orgId}`,
      { params },
    );
    return unwrap(res);
  },

  async get(id: string): Promise<Incident> {
    const res = await apiClient.get<ApiResponse<Incident>>(`/incidents/${id}`);
    return unwrap(res);
  },

  async getStats(orgId: string): Promise<IncidentStats> {
    const res = await apiClient.get<ApiResponse<IncidentStats>>(`/incidents/stats/${orgId}`);
    return unwrap(res);
  },

  async create(payload: IncidentPayload): Promise<Incident> {
    const res = await apiClient.post<ApiResponse<Incident>>('/incidents', payload);
    return unwrap(res);
  },

  async update(id: string, payload: Partial<IncidentPayload>): Promise<Incident> {
    const res = await apiClient.put<ApiResponse<Incident>>(`/incidents/${id}`, payload);
    return unwrap(res);
  },

  async reportToAuthority(id: string, authorityReference?: string): Promise<Incident> {
    const res = await apiClient.post<ApiResponse<Incident>>(
      `/incidents/${id}/report-to-authority`,
      { authorityReference },
    );
    return unwrap(res);
  },
};
