import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../../config/db';
import { AuthRequest } from '../../middleware/auth.middleware';
import { logError } from '../../utils/logger';
import { verifyAccessToken } from '../../utils/jwt';
import {
  getErrorMessage,
  parsePagination,
  parseSort,
  parseSortOrder,
  parseUuidParam,
  sendError,
  sendSuccess,
} from '../../utils/http';

const bidSchema = z.object({
  amount: z.coerce.number().positive(),
});

const createBidSchema = z.object({
  artworkId: z.string().uuid(),
  startingPrice: z.coerce.number().positive(),
  minIncrement: z.coerce.number().positive(),
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date(),
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

export const createBid = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    return sendError(res, 401, 'Authentication required');
  }

  try {
    const data = createBidSchema.parse(req.body);

    const artist = await prisma.artist.findUnique({ where: { userId } });
    if (!artist) {
      return sendError(res, 403, 'Artist profile required');
    }

    const artwork = await prisma.artwork.findUnique({ where: { id: data.artworkId } });
    if (!artwork) {
      return sendError(res, 404, 'Artwork not found');
    }
    if (artwork.artistId !== artist.id) {
      return sendError(res, 403, 'You can only start bids on your own artwork');
    }

    const existingBid = await prisma.bid.findFirst({
      where: {
        artworkId: data.artworkId,
        status: { in: ['UPCOMING', 'ACTIVE'] },
      },
    });
    if (existingBid) {
      return sendError(res, 400, 'An active or upcoming bid already exists for this artwork');
    }

    const { startsAt, endsAt } = data;
    if (endsAt <= startsAt) {
      return sendError(res, 400, 'End time must be after start time');
    }

    const bid = await prisma.bid.create({
      data: {
        artworkId: data.artworkId,
        artistId: artist.id,
        startingPrice: data.startingPrice,
        minIncrement: data.minIncrement,
        currentHighest: data.startingPrice,
        startsAt,
        endsAt,
        status: startsAt <= new Date() ? 'ACTIVE' : 'UPCOMING',
      },
      include: {
        artwork: true,
        artist: { include: { user: { select: { name: true } } } },
      },
    });

    return sendSuccess(res, bid, 'Bid created successfully', 201);
  } catch (error: unknown) {
    logError('bids.createBid', error, { userId });
    const message = getErrorMessage(error, 'Failed to create bid');
    return sendError(res, 400, message, error);
  }
};

export const placeBid = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    return sendError(res, 401, 'Authentication required');
  }

  const bidId = parseUuidParam(req.params.id);
  if (!bidId) {
    return sendError(res, 400, 'Invalid bid id');
  }

  try {
    const { amount } = bidSchema.parse(req.body);

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
      return sendError(res, 400, 'Bid is not active');
    }

    if (bid.artist.userId === userId) {
      return sendError(res, 403, 'Artists cannot bid on their own artwork');
    }

    if (new Date() > bid.endsAt) {
      return sendError(res, 400, 'Bid window has closed');
    }

    if (amount <= bid.currentHighest) {
      return sendError(res, 400, 'Bid must be higher than current highest');
    }

    if (amount < bid.currentHighest + bid.minIncrement) {
      return sendError(res, 400, `Minimum increment is Rs ${bid.minIncrement}`);
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

    if (!updatedBid) {
      return sendError(res, 500, 'Failed to load bid after update');
    }

    return sendSuccess(res, updatedBid, 'Bid placed successfully');
  } catch (error: unknown) {
    logError('bids.placeBid', error, { userId });
    const message = getErrorMessage(error, 'Failed to place bid');
    return sendError(res, 400, message, error);
  }
};

export const getActiveBids = async (req: Request, res: Response) => {
  try {
    const { limit, skip } = parsePagination(req.query as Record<string, unknown>);
    const requestedSort = parseSort(
      req.query.sort,
      ['createdAt', 'endsAt', 'startsAt', 'currentHighest'],
      'createdAt',
    );
    const sort = requestedSort === 'createdAt' ? 'endsAt' : requestedSort;
    const order = parseSortOrder(req.query.order, 'asc');

    const bids = await prisma.bid.findMany({
      where: { status: { in: ['ACTIVE', 'UPCOMING'] } },
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
      orderBy: { [sort]: order } as any,
      skip,
      take: limit,
    });

    return sendSuccess(
      res,
      bids.map((bid) => ({
        ...bid,
        participantCount: bid._count.participants,
      })),
      'Active bids fetched',
    );
  } catch (error: unknown) {
    logError('bids.getActiveBids', error);
    return sendError(res, 500, 'Failed to fetch bids', error);
  }
};

export const getBidById = async (req: Request, res: Response) => {
  const bidId = parseUuidParam(req.params.id);
  if (!bidId) {
    return sendError(res, 400, 'Invalid bid id');
  }

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
      return sendError(res, 404, 'Bid not found');
    }

    return sendSuccess(
      res,
      {
        ...bid,
        participantCount: bid._count.participants,
      },
      'Bid fetched',
    );
  } catch (error: unknown) {
    logError('bids.getBidById', error, { bidId });
    return sendError(res, 500, 'Failed to fetch bid', error);
  }
};
