import { Request, Response } from 'express';
import * as kkService from '../services/kk.service';

export async function findAll(_req: Request, res: Response) {
  const data = await kkService.findAll();
  res.json({ status: 'success', data });
}

export async function create(req: Request, res: Response) {
  const data = await kkService.create(req.body, req.user!.id, req.user!.role);
  res.status(201).json({ status: 'success', data });
}

export async function update(req: Request, res: Response) {
  const data = await kkService.update(req.params.id as string, req.body, req.user!.id, req.user!.role);
  res.json({ status: 'success', data });
}
