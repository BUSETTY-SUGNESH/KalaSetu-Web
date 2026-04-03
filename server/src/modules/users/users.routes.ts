import { Router } from 'express';
import { getArtistById, getArtists, getProfile, getProfileOverview, updateProfile } from './users.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();

router.get('/profile', authenticate as any, getProfile as any);
router.get('/profile/overview', authenticate as any, getProfileOverview as any);
router.put('/profile', authenticate as any, updateProfile as any);
router.get('/artists', getArtists as any);
router.get('/artists/:id', getArtistById as any);

export default router;
