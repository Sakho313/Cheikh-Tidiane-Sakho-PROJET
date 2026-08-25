import { apiClient, toQuery, unwrap } from './client';
import type {
  ApiResponse,
  Geofence,
  PaginatedResponse,
  PaginationParams,
} from '@/types';

export const geofencesApi = {
  async list(filters?: PaginationParams): Promise<PaginatedResponse<Geofence>> {
    const res = await apiClient.get<ApiResponse<PaginatedResponse<Geofence>>>('/geofences', {
      params: toQuery(filters),
    });
    return unwrap(res);
  },

  async get(id: string): Promise<Geofence> {
    const res = await apiClient.get<ApiResponse<Geofence>>(`/geofences/${id}`);
    return unwrap(res);
  },

  async create(payload: Partial<Geofence>): Promise<Geofence> {
    const res = await apiClient.post<ApiResponse<Geofence>>('/geofences', payload);
    return unwrap(res);
  },

  async update(id: string, payload: Partial<Geofence>): Promise<Geofence> {
    const res = await apiClient.put<ApiResponse<Geofence>>(`/geofences/${id}`, payload);
    return unwrap(res);
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete<ApiResponse<null>>(`/geofences/${id}`);
  },
};
