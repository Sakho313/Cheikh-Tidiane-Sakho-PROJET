import { apiClient, unwrap } from './client';
import type { ApiResponse, AuthResult, LoginPayload, RegisterPayload, User } from '@/types';

export const authApi = {
  async login(payload: LoginPayload): Promise<AuthResult> {
    const res = await apiClient.post<ApiResponse<AuthResult>>('/auth/login', payload);
    return unwrap(res);
  },

  async register(payload: RegisterPayload): Promise<AuthResult> {
    const res = await apiClient.post<ApiResponse<AuthResult>>('/auth/register', payload);
    return unwrap(res);
  },

  async refresh(refreshToken: string): Promise<{ accessToken: string }> {
    const res = await apiClient.post<ApiResponse<{ accessToken: string }>>('/auth/refresh', {
      refreshToken,
    });
    return unwrap(res);
  },

  async me(): Promise<User> {
    const res = await apiClient.get<ApiResponse<User>>('/auth/me');
    return unwrap(res);
  },
};
