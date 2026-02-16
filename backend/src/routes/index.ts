import { Router } from 'express';
import authRoutes from './auth.routes';
import pendudukRoutes from './penduduk.routes';
import kkRoutes from './kk.routes';
import suratRoutes from './surat.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/penduduk', pendudukRoutes);
router.use('/kk', kkRoutes);
router.use('/surat', suratRoutes);

export default router;
