import { Response } from 'express';
import { ApiResponse, PaginatedResponse } from '../types';

export function successResponse<T>(
  res: Response,
  data: T,
  message?: string,
  statusCode = 200,
): void {
  const body: ApiResponse<T> = {
    success: true,
    data,
    message,
  };
  res.status(statusCode).json(body);
}

export function errorResponse(
  res: Response,
  message: string,
  statusCode = 400,
  errors?: Array<{ field: string; message: string }>,
): void {
  const body: ApiResponse<never> = {
    success: false,
    message,
  };
  if (errors && errors.length > 0) {
    body.errors = errors;
  }
  res.status(statusCode).json(body);
}

export function paginatedResponse<T>(
  res: Response,
  data: T[],
  total: number,
  page: number,
  limit: number,
): void {
  const totalPages = Math.ceil(total / limit);
  const body: ApiResponse<PaginatedResponse<T>> = {
    success: true,
    data: {
      data,
      total,
      page,
      limit,
      totalPages,
    },
  };
  res.status(200).json(body);
}
