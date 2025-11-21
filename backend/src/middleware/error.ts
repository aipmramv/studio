import { Request, Response, NextFunction } from 'express';
import { logger } from '../lib/logger.js';

export function errorHandler(error: any, req: Request, res: Response, next: NextFunction) {
  logger.error('Error occurred', error);

  // Handle API errors
  if (error.statusCode && error.code) {
    return res.status(error.statusCode).json({
      success: false,
      status: error.statusCode,
      error: {
        message: error.message,
        code: error.code,
        details: error.details,
      },
      timestamp: new Date().toISOString(),
    });
  }

  // Handle MongoDB errors
  if (error.name === 'MongoError' || error.name === 'MongoServerError') {
    return res.status(500).json({
      success: false,
      status: 500,
      error: {
        message: 'Database error',
        code: 'DATABASE_ERROR',
      },
      timestamp: new Date().toISOString(),
    });
  }

  // Default error
  return res.status(500).json({
    success: false,
    status: 500,
    error: {
      message: 'Internal server error',
      code: 'INTERNAL_SERVER_ERROR',
    },
    timestamp: new Date().toISOString(),
  });
}

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    success: false,
    status: 404,
    error: {
      message: 'Endpoint not found',
      code: 'NOT_FOUND',
    },
    timestamp: new Date().toISOString(),
  });
}

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
  });

  next();
}
