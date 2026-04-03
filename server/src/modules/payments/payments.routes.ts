import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { createPaymentOrder, getMyPayments, verifyPayment } from './payments.controller';

const router = Router();

router.post('/create-order', authenticate as any, createPaymentOrder as any);
router.post('/verify', authenticate as any, verifyPayment as any);
router.get('/my', authenticate as any, getMyPayments as any);

export default router;
