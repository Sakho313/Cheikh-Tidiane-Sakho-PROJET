import { apiClient, toQuery, unwrap } from './client';
import type {
  ApiResponse,
  PaginatedResponse,
  PaginationParams,
  Trip,
  TripStatus,
} from '@/types';

export interface TripFilters extends PaginationParams {
  vehicleId?: string;
  driverId?: string;
  status?: TripStatus;
  from?: string;
  to?: string;
}

export const tripsApi = {
  async list(filters?: TripFilters): Promise<PaginatedResponse<Trip>> {
    const res = await apiClient.get<ApiResponse<PaginatedResponse<Trip>>>('/trips', {
      params: toQuery(filters),
    });
    return unwrap(res);
  },

  async get(id: string): Promise<Trip> {
    const res = await apiClient.get<ApiResponse<Trip>>(`/trips/${id}`);
    return unwrap(res);
  },
};
