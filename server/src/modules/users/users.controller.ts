import { Request, Response } from 'express';
import { prisma } from '../../config/db';
import { AuthRequest } from '../../middleware/auth.middleware';
import { logError } from '../../utils/logger';
import { z } from 'zod';
import {
  getErrorMessage,
  parsePagination,
  parseSort,
  parseSortOrder,
  parseUuidParam,
  sendError,
  sendSuccess,
} from '../../utils/http';

const normalizeRole = (role: string) => (role === 'CUSTOMER' ? 'BUYER' : role);

const updateProfileSchema = z
  .object({
    name: z.string().min(1).max(120).optional(),
    phone: z.string().max(40).optional().nullable(),
    avatarUrl: z.string().url().max(500).optional().nullable(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field is required for update',
  });

export const getProfile = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    return sendError(res, 401, 'Authentication required');
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        avatarUrl: true,
        isVerified: true,
        createdAt: true,
        updatedAt: true,
        artist: true,
        wallet: true,
      },
    });

    if (!user) {
      return sendError(res, 404, 'User not found');
    }

    return sendSuccess(res, {
      ...user,
      role: normalizeRole(user.role),
    });
  } catch (error: unknown) {
    logError('users.getProfile', error, { userId });
    return sendError(res, 500, 'Failed to fetch profile', error);
  }
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    return sendError(res, 401, 'Authentication required');
  }

  try {
    const data = updateProfileSchema.parse(req.body);
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        name: data.name,
        phone: data.phone ?? undefined,
        avatarUrl: data.avatarUrl ?? undefined,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        avatarUrl: true,
        isVerified: true,
        createdAt: true,
        updatedAt: true,
        artist: true,
        wallet: true,
      },
    });

    return sendSuccess(res, {
      ...user,
      role: normalizeRole(user.role),
    }, 'Profile updated');
  } catch (error: unknown) {
    logError('users.updateProfile', error, { userId });
    const message = getErrorMessage(error, 'Update failed');
    return sendError(res, 400, message, error);
  }
};

export const getProfileOverview = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    return sendError(res, 401, 'Authentication required');
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isVerified: true,
        wallet: {
          select: {
            id: true,
            balance: true,
            updatedAt: true,
          },
        },
        artist: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!user) {
      return sendError(res, 404, 'User not found');
    }

    const walletId = user.wallet?.id;

    const [txR, purR, disR, listR, payR] = await Promise.allSettled([
      walletId
        ? prisma.walletTransaction.findMany({
            where: { walletId },
            orderBy: { createdAt: 'desc' },
            take: 25,
          })
        : Promise.resolve([]),
      prisma.order.findMany({
        where: { buyerId: userId },
        include: {
          artwork: {
            select: {
              id: true,
              title: true,
              status: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 25,
      }),
      prisma.discussion.findMany({
        where: { authorId: userId },
        orderBy: { createdAt: 'desc' },
        take: 25,
      }),
      user.artist
        ? prisma.artwork.findMany({
            where: { artistId: user.artist.id },
            orderBy: { createdAt: 'desc' },
            take: 25,
          })
        : Promise.resolve([]),
      prisma.payment.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 25,
      }),
    ]);

    const transactions = txR.status === 'fulfilled' ? txR.value : [];
    const purchases = purR.status === 'fulfilled' ? purR.value : [];
    const discussions = disR.status === 'fulfilled' ? disR.value : [];
    const listings = listR.status === 'fulfilled' ? listR.value : [];
    const payments = payR.status === 'fulfilled' ? payR.value : [];

    [txR, purR, disR, listR, payR].forEach((r, i) => {
      if (r.status === 'rejected') {
        logError(`users.getProfileOverview.section[${i}]`, r.reason, { userId });
      }
    });

    let earnings = 0;
    if (user.artist) {
      try {
        const agg = await prisma.order.aggregate({
          where: {
            artistId: user.artist.id,
            status: {
              in: ['CONFIRMED', 'SHIPPED', 'DELIVERED'],
            },
          },
          _sum: {
            totalAmount: true,
          },
        });
        earnings = Number(agg._sum.totalAmount || 0);
      } catch (aggErr: unknown) {
        logError('users.getProfileOverview.earnings', aggErr, { userId });
      }
    }

    return sendSuccess(res, {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: normalizeRole(user.role),
        isVerified: user.isVerified,
      },
      wallet: user.wallet,
      transactions,
      payments,
      purchases,
      listings,
      discussions,
      earnings,
    });
  } catch (error: unknown) {
    logError('users.getProfileOverview', error, { userId });
    return sendError(res, 500, 'Failed to fetch profile overview', error);
  }
};

export const getArtists = async (req: Request, res: Response) => {
  try {
    const { limit, skip } = parsePagination(req.query as Record<string, unknown>);
    const requestedSort = parseSort(req.query.sort, ['createdAt', 'rating', 'totalSales'], 'createdAt');
    const sort = requestedSort === 'createdAt' ? 'rating' : requestedSort;
    const order = parseSortOrder(req.query.order, 'desc');

    const artists = await prisma.artist.findMany({
      include: {
        user: { select: { name: true, avatarUrl: true } },
      },
      orderBy: {
        [sort]: order,
      },
      skip,
      take: limit,
    });

    return sendSuccess(
      res,
      artists.map((artist) => ({
        ...artist,
        name: artist.user.name,
        avatarUrl: artist.user.avatarUrl,
      })),
      'Artists fetched',
    );
  } catch (error: unknown) {
    logError('users.getArtists', error);
    return sendError(res, 500, 'Failed to fetch artists', error);
  }
};

export const getArtistById = async (req: Request, res: Response) => {
  const artistId = parseUuidParam(req.params.id);
  if (!artistId) {
    return sendError(res, 400, 'Invalid artist id');
  }

  try {
    const artist = await prisma.artist.findUnique({
      where: { id: artistId },
      include: {
        user: {
          select: {
            name: true,
            avatarUrl: true,
          },
        },
        artworks: {
          where: {
            status: 'LISTED',
          },
          include: {
            artist: {
              include: {
                user: {
                  select: {
                    name: true,
                    avatarUrl: true,
                  },
                },
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!artist) {
      return sendError(res, 404, 'Artist not found');
    }

    return sendSuccess(res, {
      ...artist,
      name: artist.user.name,
      avatarUrl: artist.user.avatarUrl,
    });
  } catch (error: unknown) {
    logError('users.getArtistById', error, { artistId });
    return sendError(res, 500, 'Failed to fetch artist profile', error);
  }
};
