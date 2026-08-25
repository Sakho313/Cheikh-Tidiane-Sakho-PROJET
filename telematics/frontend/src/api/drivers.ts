import { apiClient, toQuery, unwrap } from './client';
import type {
  ApiResponse,
  Driver,
  DriverStats,
  DriverStatus,
  PaginatedResponse,
  PaginationParams,
} from '@/types';

export interface DriverFilters extends PaginationParams {
  status?: DriverStatus;
}

export const driversApi = {
  async list(filters?: DriverFilters): Promise<PaginatedResponse<Driver>> {
    const res = await apiClient.get<ApiResponse<PaginatedResponse<Driver>>>('/drivers', {
      params: toQuery(filters),
    });
    return unwrap(res);
  },

  async get(id: string): Promise<Driver> {
    const res = await apiClient.get<ApiResponse<Driver>>(`/drivers/${id}`);
    return unwrap(res);
  },

  async stats(id: string): Promise<DriverStats> {
    const res = await apiClient.get<ApiResponse<DriverStats>>(`/drivers/${id}/stats`);
    return unwrap(res);
  },

  async create(payload: Partial<Driver>): Promise<Driver> {
    const res = await apiClient.post<ApiResponse<Driver>>('/drivers', payload);
    return unwrap(res);
  },

  async update(id: string, payload: Partial<Driver>): Promise<Driver> {
    const res = await apiClient.put<ApiResponse<Driver>>(`/drivers/${id}`, payload);
    return unwrap(res);
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete<ApiResponse<null>>(`/drivers/${id}`);
  },
};
