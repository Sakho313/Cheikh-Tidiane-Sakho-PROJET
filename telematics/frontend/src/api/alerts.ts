import { apiClient, toQuery, unwrap } from './client';
import type {
  Alert,
  AlertSeverity,
  AlertStatus,
  AlertType,
  ApiResponse,
  PaginatedResponse,
  PaginationParams,
} from '@/types';

export interface AlertFilters extends PaginationParams {
  status?: AlertStatus;
  severity?: AlertSeverity;
  type?: AlertType;
  vehicleId?: string;
}

export const alertsApi = {
  async list(filters?: AlertFilters): Promise<PaginatedResponse<Alert>> {
    const res = await apiClient.get<ApiResponse<PaginatedResponse<Alert>>>('/alerts', {
      params: toQuery(filters),
    });
    return unwrap(res);
  },

  async acknowledge(id: string): Promise<Alert> {
    const res = await apiClient.post<ApiResponse<Alert>>(`/alerts/${id}/acknowledge`, {});
    return unwrap(res);
  },

  async resolve(id: string): Promise<Alert> {
    const res = await apiClient.post<ApiResponse<Alert>>(`/alerts/${id}/resolve`, {});
    return unwrap(res);
  },
};
