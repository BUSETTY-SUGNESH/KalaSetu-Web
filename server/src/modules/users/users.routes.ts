import { Router } from 'express';
import { getArtistById, getArtists, getDashboardStats, getProfile, getProfileOverview, updateProfile } from './users.controller';
import { authenticate, authorize } from '../../middleware/auth.middleware';

const router = Router();

router.get('/profile', authenticate as any, getProfile as any);
router.get('/profile/overview', authenticate as any, getProfileOverview as any);
router.get('/dashboard-stats', authenticate as any, authorize(['ADMIN', 'MANAGER']) as any, getDashboardStats as any);
router.put('/profile', authenticate as any, updateProfile as any);
router.get('/artists', getArtists as any);
router.get('/artists/:id', getArtistById as any);

export default router;
