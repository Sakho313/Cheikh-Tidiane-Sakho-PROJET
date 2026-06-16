import { apiClient, unwrap } from './client';
import type {
  ApiResponse,
  AssessmentPayload,
  ComplianceAssessment,
  ComplianceControl,
  ComplianceScore,
} from '@/types';

export const complianceApi = {
  async getControls(): Promise<ComplianceControl[]> {
    const res = await apiClient.get<ApiResponse<ComplianceControl[]>>('/compliance/controls');
    return unwrap(res);
  },

  async getAssessments(
    orgId: string,
    params?: { domain?: string; status?: string },
  ): Promise<ComplianceAssessment[]> {
    const res = await apiClient.get<ApiResponse<ComplianceAssessment[]>>(
      `/compliance/assessments/${orgId}`,
      { params },
    );
    return unwrap(res);
  },

  async getScore(orgId: string): Promise<ComplianceScore> {
    const res = await apiClient.get<ApiResponse<ComplianceScore>>(`/compliance/score/${orgId}`);
    return unwrap(res);
  },

  async upsertAssessment(payload: AssessmentPayload): Promise<ComplianceAssessment> {
    const res = await apiClient.post<ApiResponse<ComplianceAssessment>>(
      '/compliance/assessments',
      payload,
    );
    return unwrap(res);
  },
};
