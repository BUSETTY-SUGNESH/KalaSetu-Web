import { Response } from 'express';
import { prisma } from '../../index';
import { AuthRequest } from '../../middleware/auth.middleware';
import { z } from 'zod';

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
  try {
    const { artworkId, shippingAddress } = orderSchema.parse(req.body);
    const buyerId = req.user?.userId;

    const artwork = await prisma.artwork.findUnique({ where: { id: artworkId } });
    if (!artwork || artwork.status !== 'LISTED') {
      return res.status(400).json({ error: 'Artwork not available' });
    }

    const order = await prisma.order.create({
      data: {
        buyerId: buyerId!,
        artworkId,
        artistId: artwork.artistId,
        totalAmount: artwork.price,
        shippingAddress: shippingAddress as any,
        status: 'PENDING',
      }
    });

    // Update artwork status to SOLD
    await prisma.artwork.update({
      where: { id: artworkId },
      data: { status: 'SOLD' }
    });

    res.status(201).json(order);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to create order' });
  }
};

export const getMyOrders = async (req: AuthRequest, res: Response) => {
  try {
    const orders = await prisma.order.findMany({
      where: { buyerId: req.user?.userId },
      include: { artwork: true }
    });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
};
