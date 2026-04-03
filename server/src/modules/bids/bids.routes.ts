import { Router } from 'express';
import { placeBid, getActiveBids } from './bids.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();

router.get('/active', getActiveBids as any);
router.post('/:id/place', authenticate as any, placeBid as any);

export default router;
