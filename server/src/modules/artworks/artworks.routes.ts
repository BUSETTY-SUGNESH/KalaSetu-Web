import { Router } from 'express';
import { getArtworks, getArtworkById, createArtwork, updateArtwork, deleteArtwork } from './artworks.controller';
import { authenticate, authorize } from '../../middleware/auth.middleware';

const router = Router();

router.get('/', getArtworks);
router.get('/:id', getArtworkById);
router.post('/', authenticate as any, authorize(['ARTIST', 'ADMIN']) as any, createArtwork as any);
router.put('/:id', authenticate as any, authorize(['ARTIST', 'ADMIN']) as any, updateArtwork as any);
router.delete('/:id', authenticate as any, authorize(['ARTIST', 'ADMIN']) as any, deleteArtwork as any);

export default router;
