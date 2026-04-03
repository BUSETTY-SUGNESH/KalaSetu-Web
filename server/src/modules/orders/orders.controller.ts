import { Response } from 'express';
import { prisma } from '../../index';
import { AuthRequest } from '../../middleware/auth.middleware';
import { z } from 'zod';
import { logError } from '../../utils/logger';

const orderSchema = z.object({
  artworkId: z.string(),
  shippingAddress: z.object({
    address: z.string(),
    city: z.string(),
    state: z.string(),
    zip: z.string(),
    country: z.string(),
  }),
});

export const createOrder = async (req: AuthRequest, res: Response) => {
  const buyerId = req.user?.userId;
  if (!buyerId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const buyer = await prisma.user.findUnique({
      where: { id: buyerId },
      select: { isVerified: true },
    });
    if (!buyer?.isVerified) {
      return res.status(403).json({ error: 'Only verified users can place orders' });
    }

    const { artworkId, shippingAddress } = orderSchema.parse(req.body);

    const order = await prisma.$transaction(async (tx) => {
      const artwork = await tx.artwork.findUnique({
        where: { id: artworkId },
        include: {
          artist: {
            select: {
              userId: true,
            },
          },
        },
      });

      if (!artwork || artwork.status !== 'LISTED') {
        throw new Error('Artwork not available');
      }

      if (artwork.artist.userId === buyerId) {
        throw new Error('You cannot purchase your own artwork');
      }

      const sold = await tx.artwork.updateMany({
        where: { id: artworkId, status: 'LISTED' },
        data: { status: 'SOLD' },
      });

      if (sold.count === 0) {
        throw new Error('Artwork has already been sold');
      }

      return tx.order.create({
        data: {
          buyerId,
          artworkId,
          artistId: artwork.artistId,
          totalAmount: artwork.price,
          shippingAddress: shippingAddress as any,
          status: 'PENDING',
        },
      });
    });

    res.status(201).json(order);
  } catch (error: unknown) {
    logError('orders.createOrder', error, { buyerId });
    const message = error instanceof Error ? error.message : 'Failed to create order';
    res.status(400).json({ error: message });
  }
};

export const getMyOrders = async (req: AuthRequest, res: Response) => {
  const buyerId = req.user?.userId;
  if (!buyerId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const orders = await prisma.order.findMany({
      where: { buyerId },
      include: {
        artwork: {
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
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    res.json(orders);
  } catch (error: unknown) {
    logError('orders.getMyOrders', error, { buyerId });
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
};
