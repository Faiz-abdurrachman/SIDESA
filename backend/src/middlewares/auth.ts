import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';
import { config } from '../config';
import { AppError } from '../utils/AppError';

interface JwtPayload {
  id: string;
  role: string;
}

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AppError('Authentication required', 401);
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, config.jwtSecret) as JwtPayload;
    req.user = { id: decoded.id, role: decoded.role as Role };
    next();
  } catch {
    throw new AppError('Invalid or expired token', 401);
  }
}
