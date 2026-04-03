import { Router } from 'express';
import { getProfile, updateProfile } from './users.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();

router.get('/profile', authenticate as any, getProfile as any);
router.put('/profile', authenticate as any, updateProfile as any);

export default router;
