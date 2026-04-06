import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { getEventById, getEvents, registerForEvent, getMyRegistration } from './events.controller';

const router = Router();

router.get('/', getEvents as any);
router.get('/:id', getEventById as any);
router.post('/:id/register', authenticate as any, registerForEvent as any);
router.get('/:id/my-registration', authenticate as any, getMyRegistration as any);

export default router;
