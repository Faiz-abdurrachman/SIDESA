import { Request, Response } from 'express';
import * as pendudukService from '../services/penduduk.service';

export async function findAll(_req: Request, res: Response) {
  const data = await pendudukService.findAll();
  res.json({ status: 'success', data });
}

export async function findById(req: Request, res: Response) {
  const data = await pendudukService.findById(req.params.id as string);
  res.json({ status: 'success', data });
}

export async function create(req: Request, res: Response) {
  const data = await pendudukService.create(req.body, req.user!.id);
  res.status(201).json({ status: 'success', data });
}

export async function update(req: Request, res: Response) {
  const data = await pendudukService.update(req.params.id as string, req.body, req.user!.id);
  res.json({ status: 'success', data });
}

export async function remove(req: Request, res: Response) {
  await pendudukService.remove(req.params.id as string, req.user!.id, req.user!.role);
  res.json({ status: 'success', message: 'Penduduk deleted' });
}
