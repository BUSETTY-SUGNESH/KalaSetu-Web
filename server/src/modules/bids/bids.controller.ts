import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../../index';
import { AuthRequest } from '../../middleware/auth.middleware';
import { logError } from '../../utils/logger';
import { verifyAccessToken } from '../../utils/jwt';

const bidSchema = z.object({
  amount: z.number().positive(),
});

const getViewerId = (req: Request): string | null => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return null;
  }

  try {
    const decoded = verifyAccessToken(token);
    return decoded.userId;
  } catch {
    return null;
  }
};

export const placeBid = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const { amount } = bidSchema.parse(req.body);
    const bidId = String(req.params.id);

    const bid = await prisma.bid.findUnique({
      where: { id: bidId },
      include: {
        artwork: true,
        artist: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (!bid || bid.status !== 'ACTIVE') {
      return res.status(400).json({ error: 'Bid is not active' });
    }

    if (bid.artist.userId === userId) {
      return res.status(403).json({ error: 'Artists cannot bid on their own artwork' });
    }

    if (new Date() > bid.endsAt) {
      return res.status(400).json({ error: 'Bid window has closed' });
    }

    if (amount <= bid.currentHighest) {
      return res.status(400).json({ error: 'Bid must be higher than current highest' });
    }

    if (amount < bid.currentHighest + bid.minIncrement) {
      return res.status(400).json({ error: `Minimum increment is Rs ${bid.minIncrement}` });
    }

    const updatedBid = await prisma.$transaction(async (tx) => {
      await tx.bidParticipant.updateMany({
        where: {
          bidId,
          isWinning: true,
        },
        data: { isWinning: false },
      });

      await tx.bidParticipant.create({
        data: {
          bidId,
          userId,
          amount,
          isWinning: true,
        },
      });

      await tx.bid.update({
        where: { id: bidId },
        data: {
          currentHighest: amount,
          currentWinnerId: userId,
        },
      });

      return tx.bid.findUnique({
        where: { id: bidId },
        include: {
          artwork: true,
          artist: {
            include: {
              user: {
                select: {
                  name: true,
                },
              },
            },
          },
          participants: {
            where: {
              userId,
            },
            orderBy: {
              placedAt: 'desc',
            },
            take: 20,
            include: {
              user: {
                select: {
                  name: true,
                },
              },
            },
          },
          _count: {
            select: {
              participants: true,
            },
          },
        },
      });
    });

    res.json(updatedBid);
  } catch (error: unknown) {
    logError('bids.placeBid', error, { userId });
    const message = error instanceof Error ? error.message : 'Failed to place bid';
    res.status(400).json({ error: message });
  }
};

export const getActiveBids = async (_req: Request, res: Response) => {
  try {
    const bids = await prisma.bid.findMany({
      where: { status: 'ACTIVE' },
      include: {
        artwork: true,
        artist: {
          include: {
            user: {
              select: {
                name: true,
              },
            },
          },
        },
        _count: {
          select: {
            participants: true,
          },
        },
      },
      orderBy: {
        endsAt: 'asc',
      },
    });

    res.json(
      bids.map((bid) => ({
        ...bid,
        participantCount: bid._count.participants,
      })),
    );
  } catch (error: unknown) {
    logError('bids.getActiveBids', error);
    res.status(500).json({ error: 'Failed to fetch bids' });
  }
};

export const getBidById = async (req: Request, res: Response) => {
  const bidId = String(req.params.id);
  const viewerId = getViewerId(req);

  try {
    const bid = await prisma.bid.findUnique({
      where: { id: bidId },
      include: {
        artwork: true,
        artist: {
          include: {
            user: {
              select: {
                name: true,
              },
            },
          },
        },
        participants: {
          where: viewerId
            ? {
                userId: viewerId,
              }
            : undefined,
          orderBy: {
            placedAt: 'desc',
          },
          take: viewerId ? 20 : 0,
          include: {
            user: {
              select: {
                name: true,
              },
            },
          },
        },
        _count: {
          select: {
            participants: true,
          },
        },
      },
    });

    if (!bid) {
      return res.status(404).json({ error: 'Bid not found' });
    }

    res.json({
      ...bid,
      participantCount: bid._count.participants,
    });
  } catch (error: unknown) {
    logError('bids.getBidById', error, { bidId });
    res.status(500).json({ error: 'Failed to fetch bid' });
  }
};
