import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { createDiscussion, getDiscussionById, getDiscussions } from './discussions.controller';

const router = Router();

router.post('/', authenticate as any, createDiscussion as any);
router.get('/', getDiscussions as any);
router.get('/:id', getDiscussionById as any);

export default router;
