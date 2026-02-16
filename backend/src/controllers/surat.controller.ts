import { Request, Response } from 'express';
import * as suratService from '../services/surat.service';

export async function findAll(_req: Request, res: Response) {
  const data = await suratService.findAll();
  res.json({ status: 'success', data });
}

export async function create(req: Request, res: Response) {
  const data = await suratService.create(req.body, req.user!.id);
  res.status(201).json({ status: 'success', data });
}

export async function approve(req: Request, res: Response) {
  const data = await suratService.approve(req.params.id as string, req.user!.id, req.user!.role);
  res.json({ status: 'success', data });
}

export async function reject(req: Request, res: Response) {
  const data = await suratService.reject(req.params.id as string, req.user!.id, req.user!.role);
  res.json({ status: 'success', data });
}
