import { Request, Response } from 'express';
import { prisma } from '../../index';
import { AuthRequest } from '../../middleware/auth.middleware';
import { logError } from '../../utils/logger';

const normalizeRole = (role: string) => (role === 'CUSTOMER' ? 'BUYER' : role);

export const getProfile = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required' });
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
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({
      ...user,
      role: normalizeRole(user.role),
    });
  } catch (error: unknown) {
    logError('users.getProfile', error, { userId });
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const data = req.body;
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        name: data.name,
        phone: data.phone,
        avatarUrl: data.avatarUrl,
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
    res.json({
      ...user,
      role: normalizeRole(user.role),
    });
  } catch (error: unknown) {
    logError('users.updateProfile', error, { userId });
    res.status(400).json({ error: 'Update failed' });
  }
};

export const getProfileOverview = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required' });
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
      return res.status(404).json({ error: 'User not found' });
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

    res.json({
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
    res.status(500).json({ error: 'Failed to fetch profile overview' });
  }
};

export const getArtists = async (_req: Request, res: Response) => {
  try {
    const artists = await prisma.artist.findMany({
      include: {
        user: { select: { name: true, avatarUrl: true } },
      },
      orderBy: {
        rating: 'desc',
      },
    });
    res.json(
      artists.map((artist) => ({
        ...artist,
        name: artist.user.name,
        avatarUrl: artist.user.avatarUrl,
      })),
    );
  } catch (error: unknown) {
    logError('users.getArtists', error);
    res.status(500).json({ error: 'Failed to fetch artists' });
  }
};

export const getArtistById = async (req: Request, res: Response) => {
  const artistId = String(req.params.id);

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
      return res.status(404).json({ error: 'Artist not found' });
    }

    res.json({
      ...artist,
      name: artist.user.name,
      avatarUrl: artist.user.avatarUrl,
    });
  } catch (error: unknown) {
    logError('users.getArtistById', error, { artistId });
    res.status(500).json({ error: 'Failed to fetch artist profile' });
  }
};
