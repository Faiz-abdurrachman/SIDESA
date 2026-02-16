import { Router } from 'express';
import { Role } from '@prisma/client';
import * as pendudukController from '../controllers/penduduk.controller';
import { authenticate } from '../middlewares/auth';
import { authorize } from '../middlewares/role';
import { validatePenduduk, validatePendudukUpdate } from '../middlewares/validate';

const router = Router();

router.use(authenticate);

router.get('/', pendudukController.findAll);
router.get('/:id', pendudukController.findById);
router.post('/', authorize(Role.ADMIN, Role.RT), validatePenduduk, pendudukController.create);
router.put('/:id', authorize(Role.ADMIN, Role.RT), validatePendudukUpdate, pendudukController.update);
router.delete('/:id', authorize(Role.ADMIN), pendudukController.remove);

export default router;
