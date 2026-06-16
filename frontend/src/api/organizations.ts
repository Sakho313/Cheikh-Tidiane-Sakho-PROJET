import { apiClient, unwrap } from './client';
import type {
  ApiResponse,
  Organization,
  OrganizationPayload,
  OrganizationStats,
  PaginatedData,
} from '@/types';

export const organizationsApi = {
  async list(params?: { page?: number; limit?: number; search?: string }): Promise<
    PaginatedData<Organization>
  > {
    const res = await apiClient.get<ApiResponse<PaginatedData<Organization>>>('/organizations', {
      params,
    });
    return unwrap(res);
  },

  async get(id: string): Promise<Organization> {
    const res = await apiClient.get<ApiResponse<Organization>>(`/organizations/${id}`);
    return unwrap(res);
  },

  async getStats(id: string): Promise<OrganizationStats> {
    const res = await apiClient.get<ApiResponse<OrganizationStats>>(`/organizations/${id}/stats`);
    return unwrap(res);
  },

  async create(payload: OrganizationPayload): Promise<Organization> {
    const res = await apiClient.post<ApiResponse<Organization>>('/organizations', payload);
    return unwrap(res);
  },

  async update(id: string, payload: Partial<OrganizationPayload>): Promise<Organization> {
    const res = await apiClient.put<ApiResponse<Organization>>(`/organizations/${id}`, payload);
    return unwrap(res);
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete<ApiResponse<null>>(`/organizations/${id}`);
  },
};
