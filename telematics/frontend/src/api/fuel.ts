import { apiClient, toQuery, unwrap } from './client';
import type {
  ApiResponse,
  FuelEfficiency,
  FuelRecord,
  FuelRecordType,
  FuelStats,
  FuelTheftSuspicion,
  PaginatedResponse,
  PaginationParams,
} from '@/types';

export interface FuelFilters extends PaginationParams {
  vehicleId?: string;
  driverId?: string;
  type?: FuelRecordType;
}

export const fuelApi = {
  async list(filters?: FuelFilters): Promise<PaginatedResponse<FuelRecord>> {
    const res = await apiClient.get<ApiResponse<PaginatedResponse<FuelRecord>>>('/fuel', {
      params: toQuery(filters),
    });
    return unwrap(res);
  },

  async get(id: string): Promise<FuelRecord> {
    const res = await apiClient.get<ApiResponse<FuelRecord>>(`/fuel/${id}`);
    return unwrap(res);
  },

  async stats(filters?: { from?: string; to?: string }): Promise<FuelStats> {
    const res = await apiClient.get<ApiResponse<FuelStats>>('/fuel/stats', {
      params: toQuery(filters),
    });
    return unwrap(res);
  },

  async theftDetection(filters?: { from?: string; to?: string }): Promise<FuelTheftSuspicion[]> {
    const res = await apiClient.get<ApiResponse<FuelTheftSuspicion[]>>('/fuel/theft-detection', {
      params: toQuery(filters),
    });
    return unwrap(res);
  },

  async vehicleEfficiency(vehicleId: string): Promise<FuelEfficiency> {
    const res = await apiClient.get<ApiResponse<FuelEfficiency>>(
      `/fuel/vehicle/${vehicleId}/efficiency`,
    );
    return unwrap(res);
  },

  async create(payload: Partial<FuelRecord>): Promise<FuelRecord> {
    const res = await apiClient.post<ApiResponse<FuelRecord>>('/fuel', payload);
    return unwrap(res);
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete<ApiResponse<null>>(`/fuel/${id}`);
  },
};
