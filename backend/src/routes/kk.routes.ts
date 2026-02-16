import { Router } from 'express';
import { Role } from '@prisma/client';
import * as kkController from '../controllers/kk.controller';
import { authenticate } from '../middlewares/auth';
import { authorize } from '../middlewares/role';
import { validateKK, validateKKUpdate } from '../middlewares/validate';

const router = Router();

router.use(authenticate);

router.get('/', kkController.findAll);
router.post('/', authorize(Role.ADMIN, Role.RT), validateKK, kkController.create);
router.put('/:id', authorize(Role.ADMIN, Role.RT), validateKKUpdate, kkController.update);

export default router;
