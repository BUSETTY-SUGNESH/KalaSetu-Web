import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.middleware';
import * as supportCtrl from './support.controller';

const router = Router();

router.use(authenticate);

// Customer routes
router.post('/', supportCtrl.createTicket);
router.get('/my', supportCtrl.getMyTickets);

// Support / Admin routes
router.get('/all', authorize(['SUPPORT', 'ADMIN', 'MANAGER']), supportCtrl.getAllTickets);
router.get('/:id', supportCtrl.getTicketById);
router.post('/:id/assign', authorize(['SUPPORT', 'ADMIN', 'MANAGER']), supportCtrl.assignTicket);
router.patch('/:id/status', authorize(['SUPPORT', 'ADMIN', 'MANAGER']), supportCtrl.updateStatus);

export default router;
