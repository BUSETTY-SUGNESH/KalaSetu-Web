import { Request, Response } from 'express';
import { prisma } from '../../config/db';
import { AuthRequest } from '../../middleware/auth.middleware';
import { z } from 'zod';
import { logError } from '../../utils/logger';
import {
  getErrorMessage,
  parsePagination,
  parseSort,
  parseSortOrder,
  parseUuidParam,
  sendError,
  sendSuccess,
} from '../../utils/http';

const artworkSchema = z.object({
  title: z.string().min(2),
  description: z.string().optional(),
  price: z.coerce.number().positive(),
  category: z.string(),
  medium: z.string().optional(),
  images: z.array(z.string().min(1)).min(1),
  dimensions: z
    .object({
      width: z.coerce.number(),
      height: z.coerce.number(),
      unit: z.string(),
    })
    .optional(),
});

const artworkUpdateSchema = artworkSchema.partial();

const normalizePublicArtworkStatus = (value: unknown) => {
  const requestedStatus = value ? String(value).toUpperCase() : 'LISTED';
  return requestedStatus === 'SOLD' ? 'SOLD' : 'LISTED';
};

export const getMyArtworks = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    return sendError(res, 401, 'Authentication required');
  }

  try {
    const { limit, skip } = parsePagination(req.query as Record<string, unknown>);
    const sort = parseSort(req.query.sort, ['createdAt', 'price', 'title'], 'createdAt');
    const order = parseSortOrder(req.query.order, 'desc');

    const artist = await prisma.artist.findUnique({ where: { userId } });
    if (!artist) {
      return sendSuccess(res, []);
    }

    const artworks = await prisma.artwork.findMany({
      where: { artistId: artist.id },
      orderBy: { [sort]: order } as any,
      skip,
      take: limit,
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
    return sendSuccess(res, artworks || []);
  } catch (error: unknown) {
    logError('artworks.getMyArtworks', error, { userId });
    return sendError(res, 500, 'Failed to fetch your artworks', error);
  }
};

export const getMyArtworkById = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    return sendError(res, 401, 'Authentication required');
  }

  const artworkId = parseUuidParam(req.params.id);
  if (!artworkId) {
    return sendError(res, 400, 'Invalid artwork id');
  }

  try {
    const artist = await prisma.artist.findUnique({ where: { userId } });
    if (!artist) {
      return sendError(res, 403, 'Only artists have artworks');
    }

    const artwork = await prisma.artwork.findFirst({
      where: {
        id: artworkId,
        artistId: artist.id,
      },
    });

    if (!artwork) {
      return sendError(res, 404, 'Artwork not found');
    }

    return sendSuccess(res, artwork);
  } catch (error: unknown) {
    logError('artworks.getMyArtworkById', error, { userId, artworkId });
    return sendError(res, 500, 'Failed to fetch artwork', error);
  }
};

export const getArtworks = async (req: Request, res: Response) => {
  try {
    const { category, minPrice, maxPrice, artistId } = req.query;
    const { limit, skip } = parsePagination(req.query as Record<string, unknown>);
    const sort = parseSort(req.query.sort, ['createdAt', 'price', 'title'], 'createdAt');
    const order = parseSortOrder(req.query.order, 'desc');

    const where: Record<string, unknown> = {
      status: normalizePublicArtworkStatus(req.query.status),
    };

    if (category) {
      where.category = String(category);
    }

    const parsedArtistId = parseUuidParam(artistId);
    if (artistId && parsedArtistId) {
      where.artistId = parsedArtistId;
    }

    if (minPrice || maxPrice) {
      const min = minPrice ? Number(minPrice) : undefined;
      const max = maxPrice ? Number(maxPrice) : undefined;

      const price: { gte?: number; lte?: number } = {};
      if (typeof min === 'number' && Number.isFinite(min)) {
        price.gte = min;
      }
      if (typeof max === 'number' && Number.isFinite(max)) {
        price.lte = max;
      }
      if (Object.keys(price).length > 0) {
        where.price = price;
      }
    }

    const artworks = await prisma.artwork.findMany({
      where: where as any,
      orderBy: { [sort]: order } as any,
      skip,
      take: limit,
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

    return sendSuccess(res, artworks || []);
  } catch (error: unknown) {
    logError('artworks.getArtworks', error, { query: req.query });
    return sendError(res, 500, 'Failed to fetch artworks', error);
  }
};

export const getArtworkById = async (req: Request, res: Response) => {
  const artworkId = parseUuidParam(req.params.id);
  if (!artworkId) {
    return sendError(res, 400, 'Invalid artwork id');
  }

  const publicStatuses = new Set(['LISTED', 'SOLD']);

  try {
    const artwork = await prisma.artwork.findUnique({
      where: { id: artworkId },
      include: {
        artist: {
          include: {
            user: {
              select: { name: true, avatarUrl: true },
            },
          },
        },
        reviews: {
          include: {
            user: { select: { name: true, avatarUrl: true } },
          },
        },
      },
    });
    if (!artwork || !publicStatuses.has(artwork.status)) {
      return sendError(res, 404, 'Artwork not found');
    }
    return sendSuccess(res, artwork);
  } catch (error: unknown) {
    logError('artworks.getArtworkById', error, { artworkId });
    return sendError(res, 500, 'Failed to fetch artwork', error);
  }
};

export const createArtwork = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    return sendError(res, 401, 'Authentication required');
  }

  try {
    const artist = await prisma.artist.findUnique({ where: { userId } });
    if (!artist) {
      return sendError(res, 403, 'Only artists can list art');
    }

    const data = artworkSchema.parse(req.body);
    const artwork = await prisma.artwork.create({
      data: {
        ...data,
        artistId: artist.id,
        status: 'PENDING_REVIEW',
        images: data.images as any,
        dimensions: data.dimensions as any,
      },
    });
    return sendSuccess(res, artwork, 'Artwork created', 201);
  } catch (error: unknown) {
    logError('artworks.createArtwork', error, { userId });
    const message = getErrorMessage(error, 'Failed to create artwork');
    return sendError(res, 400, message, error);
  }
};

export const updateArtwork = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    return sendError(res, 401, 'Authentication required');
  }

  const artworkId = parseUuidParam(req.params.id);
  if (!artworkId) {
    return sendError(res, 400, 'Invalid artwork id');
  }

  try {
    const artwork = await prisma.artwork.findUnique({ where: { id: artworkId } });
    if (!artwork) {
      return sendError(res, 404, 'Artwork not found');
    }

    const artist = await prisma.artist.findUnique({ where: { userId } });
    if (artwork.artistId !== artist?.id && req.user?.role !== 'ADMIN') {
      return sendError(res, 403, 'Not authorized');
    }

    const data = artworkUpdateSchema.parse(req.body);
    const { images, dimensions, ...rest } = data;

    const updated = await prisma.artwork.update({
      where: { id: artworkId },
      data: {
        ...rest,
        images: images ? (images as any) : undefined,
        dimensions: dimensions ? (dimensions as any) : undefined,
      },
    });
    return sendSuccess(res, updated, 'Artwork updated');
  } catch (error: unknown) {
    logError('artworks.updateArtwork', error, { userId, artworkId });
    const message = getErrorMessage(error, 'Update failed');
    return sendError(res, 400, message, error);
  }
};

export const deleteArtwork = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    return sendError(res, 401, 'Authentication required');
  }

  const artworkId = parseUuidParam(req.params.id);
  if (!artworkId) {
    return sendError(res, 400, 'Invalid artwork id');
  }

  try {
    const artwork = await prisma.artwork.findUnique({ where: { id: artworkId } });
    if (!artwork) {
      return sendError(res, 404, 'Artwork not found');
    }

    const artist = await prisma.artist.findUnique({ where: { userId } });
    if (artwork.artistId !== artist?.id && req.user?.role !== 'ADMIN') {
      return sendError(res, 403, 'Not authorized');
    }

    await prisma.artwork.delete({ where: { id: artworkId } });
    return sendSuccess(res, { id: artworkId }, 'Artwork deleted');
  } catch (error: unknown) {
    logError('artworks.deleteArtwork', error, { userId, artworkId });
    return sendError(res, 500, 'Delete failed', error);
  }
};
