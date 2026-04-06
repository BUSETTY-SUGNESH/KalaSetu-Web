import { Router } from 'express';
import {
  getArtworks,
  getArtworkById,
  createArtwork,
  updateArtwork,
  deleteArtwork,
  getMyArtworks,
  getMyArtworkById,
} from './artworks.controller';
import { authenticate, authorize, optionalAuth } from '../../middleware/auth.middleware';

const router = Router();

router.get('/', getArtworks);
router.get('/mine', authenticate as any, getMyArtworks as any);
router.get('/mine/:id', authenticate as any, getMyArtworkById as any);
router.get('/:id', optionalAuth as any, getArtworkById as any);
router.post('/', authenticate as any, authorize(['ARTIST', 'ADMIN']) as any, createArtwork as any);
router.put('/:id', authenticate as any, authorize(['ARTIST', 'ADMIN']) as any, updateArtwork as any);
router.delete('/:id', authenticate as any, authorize(['ARTIST', 'ADMIN']) as any, deleteArtwork as any);

export default router;
