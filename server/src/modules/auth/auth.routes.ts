import { Router } from 'express';
import { signup, login, logout, refreshToken, switchRole, adminCreateUser } from './auth.controller';
import { authenticate, authorize } from '../../middleware/auth.middleware';

const router = Router();

router.post('/signup', signup);
router.post('/login', login);
router.post('/logout', logout);
router.post('/refresh-token', refreshToken);
router.post('/switch-role', authenticate, switchRole);
router.post('/admin/create-user', authenticate, authorize(['ADMIN']), adminCreateUser);

export default router;
