import { Response } from 'express';
import { ApiResponse, PaginatedResponse } from '../types';

export function successResponse<T>(
  res: Response,
  data: T,
  message?: string,
  statusCode = 200,
): Response<ApiResponse<T>> {
  return res.status(statusCode).json({
    success: true,
    data,
    message,
  });
}

export function errorResponse(
  res: Response,
  message: string,
  statusCode = 400,
  errors?: Array<{ field: string; message: string }>,
): Response<ApiResponse<never>> {
  const body: ApiResponse<never> = {
    success: false,
    message,
  };
  if (errors && errors.length > 0) {
    body.errors = errors;
  }
  return res.status(statusCode).json(body);
}

export function paginatedResponse<T>(
  res: Response,
  data: T[],
  total: number,
  page: number,
  limit: number,
): Response<ApiResponse<PaginatedResponse<T>>> {
  const totalPages = Math.ceil(total / limit);
  return res.status(200).json({
    success: true,
    data: {
      data,
      total,
      page,
      limit,
      totalPages,
    },
  });
}
