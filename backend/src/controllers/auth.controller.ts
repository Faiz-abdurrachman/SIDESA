import { Request, Response } from 'express';
import * as authService from '../services/auth.service';

export async function register(req: Request, res: Response) {
  const user = await authService.register(req.body);
  res.status(201).json({ status: 'success', data: user });
}

export async function createUserByAdmin(req: Request, res: Response) {
  const user = await authService.createUserByAdmin(req.body, req.user!.role);
  res.status(201).json({ status: 'success', data: user });
}

export async function login(req: Request, res: Response) {
  const result = await authService.login(req.body);
  res.json({ status: 'success', data: result });
}
