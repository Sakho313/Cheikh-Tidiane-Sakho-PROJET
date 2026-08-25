import { apiClient, toQuery, unwrap } from './client';
import type {
  ApiResponse,
  PaginatedResponse,
  PaginationParams,
  Vehicle,
  VehicleStats,
  VehicleStatus,
} from '@/types';

export interface VehicleFilters extends PaginationParams {
  status?: VehicleStatus;
}

export const vehiclesApi = {
  async list(filters?: VehicleFilters): Promise<PaginatedResponse<Vehicle>> {
    const res = await apiClient.get<ApiResponse<PaginatedResponse<Vehicle>>>('/vehicles', {
      params: toQuery(filters),
    });
    return unwrap(res);
  },

  async get(id: string): Promise<Vehicle> {
    const res = await apiClient.get<ApiResponse<Vehicle>>(`/vehicles/${id}`);
    return unwrap(res);
  },

  async stats(id: string): Promise<VehicleStats> {
    const res = await apiClient.get<ApiResponse<VehicleStats>>(`/vehicles/${id}/stats`);
    return unwrap(res);
  },

  async create(payload: Partial<Vehicle>): Promise<Vehicle> {
    const res = await apiClient.post<ApiResponse<Vehicle>>('/vehicles', payload);
    return unwrap(res);
  },

  async update(id: string, payload: Partial<Vehicle>): Promise<Vehicle> {
    const res = await apiClient.put<ApiResponse<Vehicle>>(`/vehicles/${id}`, payload);
    return unwrap(res);
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete<ApiResponse<null>>(`/vehicles/${id}`);
  },
};
