import { Router } from 'express';
import { createOrder, getMyOrders, updateOrderStatus, getOrderTimeline, getOrderById } from './orders.controller';
import { authenticate, authorize } from '../../middleware/auth.middleware';

const router = Router();

router.post('/', authenticate as any, createOrder as any);
router.get('/my', authenticate as any, getMyOrders as any);
router.get('/:id', authenticate as any, getOrderById as any);
router.get('/:id/timeline', authenticate as any, getOrderTimeline as any);
router.patch('/:id/status', authenticate as any, authorize(['ARTIST', 'ADMIN', 'MANAGER']) as any, updateOrderStatus as any);

export default router;
