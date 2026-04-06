import { Router } from 'express';
import { authenticate, authorize, optionalAuth } from '../../middleware/auth.middleware';
import * as bidRequestCtrl from './bid-requests.controller';

const router = Router();

// Public browsing
router.get('/open', optionalAuth, bidRequestCtrl.getOpenBidRequests);
router.get('/:id', optionalAuth, bidRequestCtrl.getBidRequestById);
router.get('/:id/analytics', optionalAuth, bidRequestCtrl.getBidAnalytics);

// Authenticated routes
router.use(authenticate);

// Customer routes
router.post('/', bidRequestCtrl.createBidRequest);
router.get('/my/requests', bidRequestCtrl.getMyBidRequests);
router.post('/:id/accept', bidRequestCtrl.acceptBid);
router.post('/:id/complete', bidRequestCtrl.completeBidRequest);
router.post('/:id/cancel', bidRequestCtrl.cancelBidRequest);

// Artist routes
router.post('/:id/bid', authorize(['ARTIST']), bidRequestCtrl.placeArtistBid);

export default router;
