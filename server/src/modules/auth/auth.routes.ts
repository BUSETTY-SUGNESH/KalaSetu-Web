import { Router } from 'express';
import { signup, login, logout, refreshToken } from './auth.controller';

const router = Router();

router.post('/signup', signup);
router.post('/login', login);
router.post('/logout', logout);
router.post('/refresh-token', refreshToken);

export default router;
