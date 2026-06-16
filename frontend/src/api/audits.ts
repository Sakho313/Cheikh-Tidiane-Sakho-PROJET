import { apiClient, unwrap } from './client';
import type {
  ApiResponse,
  Audit,
  AuditFinding,
  AuditPayload,
  AuditStats,
  FindingPayload,
  PaginatedData,
} from '@/types';

export const auditsApi = {
  async list(
    orgId: string,
    params?: { page?: number; limit?: number; type?: string; status?: string },
  ): Promise<PaginatedData<Audit>> {
    const res = await apiClient.get<ApiResponse<PaginatedData<Audit>>>(`/audits/org/${orgId}`, {
      params,
    });
    return unwrap(res);
  },

  async get(id: string): Promise<Audit> {
    const res = await apiClient.get<ApiResponse<Audit>>(`/audits/${id}`);
    return unwrap(res);
  },

  async getFindings(id: string): Promise<AuditFinding[]> {
    const res = await apiClient.get<ApiResponse<AuditFinding[]>>(`/audits/${id}/findings`);
    return unwrap(res);
  },

  async getStats(orgId: string): Promise<AuditStats> {
    const res = await apiClient.get<ApiResponse<AuditStats>>(`/audits/stats/${orgId}`);
    return unwrap(res);
  },

  async create(payload: AuditPayload): Promise<Audit> {
    const res = await apiClient.post<ApiResponse<Audit>>('/audits', payload);
    return unwrap(res);
  },

  async addFinding(auditId: string, payload: FindingPayload): Promise<AuditFinding> {
    const res = await apiClient.post<ApiResponse<AuditFinding>>(
      `/audits/${auditId}/findings`,
      payload,
    );
    return unwrap(res);
  },
};
