import { Router } from 'express';
import { Role } from '@prisma/client';
import * as suratController from '../controllers/surat.controller';
import { authenticate } from '../middlewares/auth';
import { authorize } from '../middlewares/role';
import { validateSurat } from '../middlewares/validate';

const router = Router();

router.use(authenticate);

router.get('/', suratController.findAll);
router.post('/', authorize(Role.ADMIN, Role.RT), validateSurat, suratController.create);
router.put('/:id/approve', authorize(Role.ADMIN, Role.KEPALA_DESA), suratController.approve);
router.put('/:id/reject', authorize(Role.ADMIN, Role.KEPALA_DESA), suratController.reject);

export default router;
