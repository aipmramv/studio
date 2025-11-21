import { Response } from 'express';
import { ApiResponse } from '../types/index.js';

export function sendSuccess<T>(
  res: Response,
  data: T,
  statusCode: number = 200,
  message?: string
): Response {
  const response: ApiResponse<T> = {
    success: true,
    status: statusCode,
    data,
    timestamp: new Date().toISOString(),
  };

  return res.status(statusCode).json(response);
}

export function sendError(
  res: Response,
  statusCode: number,
  code: string,
  message: string,
  details?: any
): Response {
  const response: ApiResponse<null> = {
    success: false,
    status: statusCode,
    error: {
      message,
      code,
      details,
    },
    timestamp: new Date().toISOString(),
  };

  return res.status(statusCode).json(response);
}

export function sendPaginated<T>(
  res: Response,
  items: T[],
  total: number,
  page: number,
  pageSize: number,
  statusCode: number = 200
): Response {
  const totalPages = Math.ceil(total / pageSize);

  const response: ApiResponse<{
    items: T[];
    pagination: {
      total: number;
      page: number;
      pageSize: number;
      totalPages: number;
    };
  }> = {
    success: true,
    status: statusCode,
    data: {
      items,
      pagination: {
        total,
        page,
        pageSize,
        totalPages,
      },
    },
    timestamp: new Date().toISOString(),
  };

  return res.status(statusCode).json(response);
}
