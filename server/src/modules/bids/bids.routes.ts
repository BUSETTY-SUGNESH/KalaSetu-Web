import { Router } from 'express';
import { createBid, placeBid, getActiveBids, getBidById } from './bids.controller';
import { authenticate, authorize } from '../../middleware/auth.middleware';

const router = Router();

router.get('/active', getActiveBids as any);
router.post('/', authenticate as any, authorize(['ARTIST']) as any, createBid as any);
router.get('/:id', getBidById as any);
router.post('/:id/place', authenticate as any, placeBid as any);

export default router;
