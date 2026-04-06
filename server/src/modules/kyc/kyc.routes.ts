import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.middleware';
import * as kycCtrl from './kyc.controller';

const router = Router();

router.use(authenticate);

router.get('/status', kycCtrl.getKycStatus);
router.post('/submit', kycCtrl.submitKyc);
router.post('/verify', kycCtrl.verifyKyc);

// Admin-only endpoints
router.post('/:userId/approve', authorize(['ADMIN', 'MANAGER']), kycCtrl.adminVerify);
router.post('/:userId/reject', authorize(['ADMIN', 'MANAGER']), kycCtrl.adminReject);

export default router;
