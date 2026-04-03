import { Request, Response } from 'express';
import { prisma } from '../../index';
import { AuthRequest } from '../../middleware/auth.middleware';
import { z } from 'zod';
import { logError } from '../../utils/logger';

const artworkSchema = z.object({
  title: z.string().min(2),
  description: z.string().optional(),
  price: z.number().positive(),
  category: z.string(),
  medium: z.string().optional(),
  images: z.array(z.string()),
  dimensions: z.object({
    width: z.number(),
    height: z.number(),
    unit: z.string(),
  }).optional(),
});

const artworkUpdateSchema = artworkSchema.partial();

export const getMyArtworks = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const artist = await prisma.artist.findUnique({ where: { userId } });
    if (!artist) {
      return res.json([]);
    }

    const artworks = await prisma.artwork.findMany({
      where: { artistId: artist.id },
      orderBy: { createdAt: 'desc' },
      include: {
        artist: {
          include: {
            user: {
              select: { name: true, avatarUrl: true },
            },
          },
        },
      },
    });
    res.json(artworks);
  } catch (error: unknown) {
    logError('artworks.getMyArtworks', error, { userId });
    res.status(500).json({ error: 'Failed to fetch your artworks' });
  }
};

export const getMyArtworkById = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const artworkId = String(req.params.id);

  try {
    const artist = await prisma.artist.findUnique({ where: { userId } });
    if (!artist) {
      return res.status(403).json({ error: 'Only artists have artworks' });
    }

    const artwork = await prisma.artwork.findFirst({
      where: {
        id: artworkId,
        artistId: artist.id,
      },
    });

    if (!artwork) {
      return res.status(404).json({ error: 'Artwork not found' });
    }

    res.json(artwork);
  } catch (error: unknown) {
    logError('artworks.getMyArtworkById', error, { userId, artworkId });
    res.status(500).json({ error: 'Failed to fetch artwork' });
  }
};

export const getArtworks = async (req: Request, res: Response) => {
  try {
    const { category, minPrice, maxPrice, artistId, status } = req.query;
    const requestedStatus = status ? String(status).toUpperCase() : 'LISTED';
    const publicStatuses = new Set(['LISTED', 'SOLD']);

    const where: any = {
      status: publicStatuses.has(requestedStatus) ? requestedStatus : 'LISTED',
    };

    if (category) {
      where.category = String(category);
    }

    if (artistId) {
      where.artistId = String(artistId);
    }

    if (minPrice || maxPrice) {
      const min = minPrice ? Number(minPrice) : undefined;
      const max = maxPrice ? Number(maxPrice) : undefined;

      where.price = {
        gte: Number.isFinite(min as number) ? min : undefined,
        lte: Number.isFinite(max as number) ? max : undefined,
      };
    }

    const artworks = await prisma.artwork.findMany({
      where,
      include: {
        artist: {
          include: {
            user: {
              select: { name: true, avatarUrl: true }
            }
          }
        }
      }
    });
    res.json(artworks);
  } catch (error: unknown) {
    logError('artworks.getArtworks', error, { query: req.query });
    res.status(500).json({ error: 'Failed to fetch artworks' });
  }
};

export const getArtworkById = async (req: Request, res: Response) => {
  const artworkId = String(req.params.id);
  const publicStatuses = new Set(['LISTED', 'SOLD']);

  try {
    const artwork = await prisma.artwork.findUnique({
      where: { id: artworkId },
      include: {
        artist: {
          include: {
            user: {
              select: { name: true, avatarUrl: true }
            }
          }
        },
        reviews: {
          include: {
            user: { select: { name: true, avatarUrl: true } }
          }
        }
      }
    });
    if (!artwork || !publicStatuses.has(artwork.status)) {
      return res.status(404).json({ error: 'Artwork not found' });
    }
    res.json(artwork);
  } catch (error: unknown) {
    logError('artworks.getArtworkById', error, { artworkId });
    res.status(500).json({ error: 'Failed to fetch artwork' });
  }
};

export const createArtwork = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const artist = await prisma.artist.findUnique({ where: { userId } });
    if (!artist) return res.status(403).json({ error: 'Only artists can list art' });

    const data = artworkSchema.parse(req.body);
    const artwork = await prisma.artwork.create({
      data: {
        ...data,
        artistId: artist.id,
        status: 'PENDING_REVIEW',
        images: data.images as any,
        dimensions: data.dimensions as any,
      }
    });
    res.status(201).json(artwork);
  } catch (error: unknown) {
    logError('artworks.createArtwork', error, { userId });
    const message = error instanceof Error ? error.message : 'Failed to create artwork';
    res.status(400).json({ error: message });
  }
};

export const updateArtwork = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const artworkId = String(req.params.id);

  try {
    const artwork = await prisma.artwork.findUnique({ where: { id: artworkId } });
    if (!artwork) return res.status(404).json({ error: 'Artwork not found' });

    const artist = await prisma.artist.findUnique({ where: { userId } });
    if (artwork.artistId !== artist?.id && req.user?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const data = artworkUpdateSchema.parse(req.body);
    const { images, dimensions, ...rest } = data;

    const updated = await prisma.artwork.update({
      where: { id: artworkId },
      data: {
        ...rest,
        images: images ? (images as any) : undefined,
        dimensions: dimensions ? (dimensions as any) : undefined,
      }
    });
    res.json(updated);
  } catch (error: unknown) {
    logError('artworks.updateArtwork', error, { userId, artworkId });
    const message = error instanceof Error ? error.message : 'Update failed';
    res.status(400).json({ error: message });
  }
};

export const deleteArtwork = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const artworkId = String(req.params.id);

  try {
    const artwork = await prisma.artwork.findUnique({ where: { id: artworkId } });
    if (!artwork) return res.status(404).json({ error: 'Artwork not found' });

    const artist = await prisma.artist.findUnique({ where: { userId } });
    if (artwork.artistId !== artist?.id && req.user?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await prisma.artwork.delete({ where: { id: artworkId } });
    res.json({ message: 'Artwork deleted' });
  } catch (error: unknown) {
    logError('artworks.deleteArtwork', error, { userId, artworkId });
    res.status(500).json({ error: 'Delete failed' });
  }
};
