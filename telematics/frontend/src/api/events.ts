import { apiClient, toQuery, unwrap } from './client';
import type {
  ApiResponse,
  DrivingEvent,
  EventSeverity,
  EventStats,
  EventType,
  PaginatedResponse,
  PaginationParams,
} from '@/types';

export interface EventFilters extends PaginationParams {
  vehicleId?: string;
  driverId?: string;
  type?: EventType;
  severity?: EventSeverity;
  from?: string;
  to?: string;
}

export const eventsApi = {
  async list(filters?: EventFilters): Promise<PaginatedResponse<DrivingEvent>> {
    const res = await apiClient.get<ApiResponse<PaginatedResponse<DrivingEvent>>>('/events', {
      params: toQuery(filters),
    });
    return unwrap(res);
  },

  async stats(filters?: { from?: string; to?: string; driverId?: string }): Promise<EventStats> {
    const res = await apiClient.get<ApiResponse<EventStats>>('/events/stats', {
      params: toQuery(filters),
    });
    return unwrap(res);
  },
};
