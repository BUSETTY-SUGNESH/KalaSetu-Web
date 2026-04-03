import { Router } from 'express';
import { getEventById, getEvents } from './events.controller';

const router = Router();

router.get('/', getEvents as any);
router.get('/:id', getEventById as any);

export default router;
