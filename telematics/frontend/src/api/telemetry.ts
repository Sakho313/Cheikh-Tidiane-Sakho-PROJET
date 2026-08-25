import { apiClient, toQuery, unwrap } from './client';
import type {
  ApiResponse,
  GpsPosition,
  LiveVehicle,
  PaginatedResponse,
  PaginationParams,
} from '@/types';

export interface PositionFilters extends PaginationParams {
  from?: string;
  to?: string;
}

export const telemetryApi = {
  /** Last known position of every vehicle in the organization (live map). */
  async live(): Promise<LiveVehicle[]> {
    const res = await apiClient.get<ApiResponse<LiveVehicle[]>>('/telemetry/live');
    return unwrap(res);
  },

  /** Paginated GPS position history for a vehicle (used to draw trip traces). */
  async positions(
    vehicleId: string,
    filters?: PositionFilters,
  ): Promise<PaginatedResponse<GpsPosition>> {
    const res = await apiClient.get<ApiResponse<PaginatedResponse<GpsPosition>>>(
      `/telemetry/vehicle/${vehicleId}/positions`,
      { params: toQuery(filters) },
    );
    return unwrap(res);
  },
};
