import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';
import { config } from '../config';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      status: 'error',
      message: err.message,
    });
    return;
  }

  console.error('Unexpected error:', err);

  res.status(500).json({
    status: 'error',
    message: config.nodeEnv === 'production' ? 'Internal server error' : err.message,
  });
}
