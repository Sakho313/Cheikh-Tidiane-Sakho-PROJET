import { apiClient, toQuery, unwrap } from './client';
import type { ApiResponse, DashboardSummary, DriverScoresResponse } from '@/types';

export const analyticsApi = {
  async dashboard(filters?: { from?: string; to?: string }): Promise<DashboardSummary> {
    const res = await apiClient.get<ApiResponse<DashboardSummary>>('/analytics/dashboard', {
      params: toQuery(filters),
    });
    return unwrap(res);
  },

  async driverScores(filters?: { from?: string; to?: string }): Promise<DriverScoresResponse> {
    const res = await apiClient.get<ApiResponse<DriverScoresResponse>>('/analytics/drivers/scores', {
      params: toQuery(filters),
    });
    return unwrap(res);
  },
};
