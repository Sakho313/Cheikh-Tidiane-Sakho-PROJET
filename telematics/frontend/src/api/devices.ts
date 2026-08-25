import { apiClient, toQuery, unwrap } from './client';
import type {
  ApiResponse,
  Device,
  DeviceStatus,
  PaginatedResponse,
  PaginationParams,
} from '@/types';

export interface DeviceFilters extends PaginationParams {
  status?: DeviceStatus;
}

export const devicesApi = {
  async list(filters?: DeviceFilters): Promise<PaginatedResponse<Device>> {
    const res = await apiClient.get<ApiResponse<PaginatedResponse<Device>>>('/devices', {
      params: toQuery(filters),
    });
    return unwrap(res);
  },

  async get(id: string): Promise<Device> {
    const res = await apiClient.get<ApiResponse<Device>>(`/devices/${id}`);
    return unwrap(res);
  },

  async create(payload: Partial<Device>): Promise<Device> {
    const res = await apiClient.post<ApiResponse<Device>>('/devices', payload);
    return unwrap(res);
  },

  async update(id: string, payload: Partial<Device>): Promise<Device> {
    const res = await apiClient.put<ApiResponse<Device>>(`/devices/${id}`, payload);
    return unwrap(res);
  },

  async unassign(id: string): Promise<Device> {
    const res = await apiClient.post<ApiResponse<Device>>(`/devices/${id}/unassign`, {});
    return unwrap(res);
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete<ApiResponse<null>>(`/devices/${id}`);
  },
};
