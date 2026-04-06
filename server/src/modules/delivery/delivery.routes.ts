import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.middleware';
import * as deliveryCtrl from './delivery.controller';

const router = Router();

router.use(authenticate);

// Delivery person routes
router.get('/my', authorize(['DELIVERY']), deliveryCtrl.getMyDeliveries);
router.patch('/:id/status', authorize(['DELIVERY']), deliveryCtrl.updateStatus);

// Manager/Admin routes
router.post('/assign', authorize(['ADMIN', 'MANAGER']), deliveryCtrl.assignDelivery);
router.get('/order/:orderId', deliveryCtrl.getDeliveryByOrder);

export default router;
