import { Router } from 'express';
import { Role } from '@prisma/client';
import * as authController from '../controllers/auth.controller';
import { validateRegister, validateLogin, validateCreateUser } from '../middlewares/validate';
import { authenticate } from '../middlewares/auth';
import { authorize } from '../middlewares/role';

const router = Router();

router.post('/register', validateRegister, authController.register);
router.post('/login', validateLogin, authController.login);
router.post('/users', authenticate, authorize(Role.ADMIN), validateCreateUser, authController.createUserByAdmin);

export default router;
