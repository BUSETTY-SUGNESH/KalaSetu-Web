import { Router } from 'express';
import { createOrder, getMyOrders } from './orders.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();

router.post('/', authenticate as any, createOrder as any);
router.get('/my', authenticate as any, getMyOrders as any);

export default router;
