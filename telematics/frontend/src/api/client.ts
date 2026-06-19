import axios, {
  AxiosError,
  AxiosHeaders,
  type AxiosInstance,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';
import type { ApiResponse } from '@/types';

export const ACCESS_TOKEN_KEY = 'telematics.accessToken';
export const REFRESH_TOKEN_KEY = 'telematics.refreshToken';

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setTokens(accessToken: string, refreshToken?: string): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  if (refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }
}

export function clearTokens(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

// Base URL of the API. In production, set VITE_API_URL to the backend's public
// URL (e.g. https://sao-telematics.onrender.com) — the client calls it
// cross-origin and appends /api/v1. When unset (local dev), it falls back to
// the relative /api/v1 path served by the Vite dev proxy (→ :4000).
function resolveApiBaseUrl(): string {
  const raw = import.meta.env.VITE_API_URL?.trim();
  if (!raw) return '/api/v1';
  const origin = (/^https?:\/\//.test(raw) ? raw : `https://${raw}`).replace(/\/+$/, '');
  return origin.endsWith('/api/v1') ? origin : `${origin}/api/v1`;
}

export const API_BASE_URL = resolveApiBaseUrl();

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// ─── Request interceptor: attach bearer token ───────────────────────────────

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccessToken();
  if (token) {
    const headers = AxiosHeaders.from(config.headers);
    headers.set('Authorization', `Bearer ${token}`);
    config.headers = headers;
  }
  return config;
});

// ─── Response interceptor: refresh on 401, then replay ──────────────────────

interface RetriableConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

let isRefreshing = false;
let pendingRequests: Array<(token: string | null) => void> = [];

function onRefreshed(token: string | null): void {
  pendingRequests.forEach((cb) => cb(token));
  pendingRequests = [];
}

function redirectToLogin(): void {
  clearTokens();
  if (window.location.pathname !== '/login') {
    window.location.assign('/login');
  }
}

apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetriableConfig | undefined;
    const status = error.response?.status;
    const refreshToken = getRefreshToken();

    const isRefreshCall = originalRequest?.url?.includes('/auth/refresh');

    if (
      status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !isRefreshCall &&
      refreshToken
    ) {
      originalRequest._retry = true;

      if (isRefreshing) {
        // Queue this request until the in-flight refresh resolves.
        return new Promise((resolve, reject) => {
          pendingRequests.push((token) => {
            if (!token) {
              reject(error);
              return;
            }
            const headers = AxiosHeaders.from(originalRequest.headers);
            headers.set('Authorization', `Bearer ${token}`);
            originalRequest.headers = headers;
            resolve(apiClient(originalRequest));
          });
        });
      }

      isRefreshing = true;
      try {
        const { data } = await axios.post<ApiResponse<{ accessToken: string }>>(
          `${API_BASE_URL}/auth/refresh`,
          { refreshToken },
        );
        const newAccessToken = data.data?.accessToken;
        if (!newAccessToken) {
          throw new Error('No access token returned by refresh endpoint');
        }
        setTokens(newAccessToken);
        onRefreshed(newAccessToken);

        const headers = AxiosHeaders.from(originalRequest.headers);
        headers.set('Authorization', `Bearer ${newAccessToken}`);
        originalRequest.headers = headers;
        return apiClient(originalRequest);
      } catch (refreshError) {
        onRefreshed(null);
        redirectToLogin();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    if (status === 401 && !refreshToken) {
      redirectToLogin();
    }

    return Promise.reject(error);
  },
);

/**
 * Unwraps the `{ success, data }` envelope and returns the inner `data`.
 * Throws when the API reports `success: false`.
 */
export function unwrap<T>(response: AxiosResponse<ApiResponse<T>>): T {
  const body = response.data;
  if (!body.success) {
    throw new Error(body.message ?? 'Une erreur est survenue');
  }
  return body.data as T;
}

/**
 * Extracts a human-readable message from an axios error (API message or fallback).
 */
export function extractErrorMessage(error: unknown, fallback = 'Une erreur est survenue'): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as ApiResponse | undefined;
    if (data?.message) {
      return data.message;
    }
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
}

/** Serialises an object of query params, dropping null/undefined/empty values. */
export function toQuery(params?: object): Record<string, string | number> {
  const out: Record<string, string | number> = {};
  if (!params) return out;
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    out[key] = typeof value === 'number' ? value : String(value);
  }
  return out;
}
