import { Role } from '@prisma/client';

export interface AuthPayload {
  userId: string;
  email: string;
  role: Role;
  organizationId: string | null;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Array<{ field: string; message: string }>;
}

export interface PaginationQuery {
  page: number;
  limit: number;
  search?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ParsedPagination {
  page: number;
  limit: number;
  skip: number;
  search: string | undefined;
}
