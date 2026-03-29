import { Request, Response } from 'express';
import { prisma } from '../../index';
import { AuthRequest } from '../../middleware/auth.middleware';
import { z } from 'zod';

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

export const getArtworks = async (req: Request, res: Response) => {
  try {
    const { category, minPrice, maxPrice, artistId, status } = req.query;
    const artworks = await prisma.artwork.findMany({
      where: {
        category: category as string,
        price: {
          gte: minPrice ? parseFloat(minPrice as string) : undefined,
          lte: maxPrice ? parseFloat(maxPrice as string) : undefined,
        },
        artistId: artistId as string,
        status: (status as any) || 'LISTED',
      },
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
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch artworks' });
  }
};

export const getArtworkById = async (req: Request, res: Response) => {
  try {
    const artwork = await prisma.artwork.findUnique({
      where: { id: req.params.id },
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
    if (!artwork) return res.status(404).json({ error: 'Artwork not found' });
    res.json(artwork);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch artwork' });
  }
};

export const createArtwork = async (req: AuthRequest, res: Response) => {
  try {
    const artist = await prisma.artist.findUnique({ where: { userId: req.user?.userId } });
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
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to create artwork' });
  }
};

export const updateArtwork = async (req: AuthRequest, res: Response) => {
  try {
    const artwork = await prisma.artwork.findUnique({ where: { id: req.params.id } });
    if (!artwork) return res.status(404).json({ error: 'Artwork not found' });

    const artist = await prisma.artist.findUnique({ where: { userId: req.user?.userId } });
    if (artwork.artistId !== artist?.id && req.user?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const data = req.body;
    const updated = await prisma.artwork.update({
      where: { id: req.params.id },
      data: {
        ...data,
        images: data.images ? (data.images as any) : undefined,
        dimensions: data.dimensions ? (data.dimensions as any) : undefined,
      }
    });
    res.json(updated);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Update failed' });
  }
};

export const deleteArtwork = async (req: AuthRequest, res: Response) => {
  try {
    const artwork = await prisma.artwork.findUnique({ where: { id: req.params.id } });
    if (!artwork) return res.status(404).json({ error: 'Artwork not found' });

    const artist = await prisma.artist.findUnique({ where: { userId: req.user?.userId } });
    if (artwork.artistId !== artist?.id && req.user?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await prisma.artwork.delete({ where: { id: req.params.id } });
    res.json({ message: 'Artwork deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Delete failed' });
  }
};
