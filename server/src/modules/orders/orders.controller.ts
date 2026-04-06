import { Response } from 'express';
import { prisma } from '../../config/db';
import { AuthRequest } from '../../middleware/auth.middleware';
import { z } from 'zod';
import { logError } from '../../utils/logger';
import {
  getErrorMessage,
  parsePagination,
  parseSort,
  parseSortOrder,
  sendError,
  sendSuccess,
} from '../../utils/http';

const orderSchema = z.object({
  artworkId: z.string().uuid(),
  shippingAddress: z.object({
    address: z.string().min(3),
    city: z.string().min(2),
    state: z.string().min(2),
    zip: z.string().min(3),
    country: z.string().min(2),
  }),
});

export const createOrder = async (req: AuthRequest, res: Response) => {
  const buyerId = req.user?.userId;
  if (!buyerId) {
    return sendError(res, 401, 'Authentication required');
  }

  try {
    const buyer = await prisma.user.findUnique({
      where: { id: buyerId },
      select: { isVerified: true },
    });
    if (!buyer?.isVerified) {
      return sendError(res, 403, 'Only verified users can place orders');
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
          events: {
            create: {
              status: 'PENDING',
              note: 'Order created',
              createdBy: buyerId,
            },
          },
        },
      });
    });

    return sendSuccess(res, order, 'Order created', 201);
  } catch (error: unknown) {
    logError('orders.createOrder', error, { buyerId });
    const message = getErrorMessage(error, 'Failed to create order');
    const status =
      message === 'Artwork not available' ||
      message === 'You cannot purchase your own artwork' ||
      message === 'Artwork has already been sold'
        ? 400
        : 500;
    return sendError(res, status, message, error);
  }
};

export const getMyOrders = async (req: AuthRequest, res: Response) => {
  const buyerId = req.user?.userId;
  if (!buyerId) {
    return sendError(res, 401, 'Authentication required');
  }

  try {
    const { limit, skip } = parsePagination(req.query as Record<string, unknown>);
    const sort = parseSort(req.query.sort, ['createdAt', 'totalAmount', 'status'], 'createdAt');
    const order = parseSortOrder(req.query.order, 'desc');

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
      orderBy: { [sort]: order } as any,
      skip,
      take: limit,
    });
    return sendSuccess(res, orders || []);
  } catch (error: unknown) {
    logError('orders.getMyOrders', error, { buyerId });
    return sendError(res, 500, 'Failed to fetch orders', error);
  }
};

const validOrderTransitions: Record<string, string[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['ACCEPTED', 'CANCELLED'],
  ACCEPTED: ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['COMPLETED', 'CANCELLED'],
  COMPLETED: ['SHIPPED'],
  SHIPPED: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: ['REFUNDED'],
  REFUNDED: [],
};

export const updateOrderStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, note } = req.body;

    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) return sendError(res, 404, 'Order not found');

    const allowed = validOrderTransitions[order.status] || [];
    if (!allowed.includes(status)) {
      return sendError(
        res,
        400,
        `Cannot transition from ${order.status} to ${status}. Allowed: ${allowed.join(', ') || 'none'}`,
      );
    }

    const updated = await prisma.$transaction(async (tx) => {
      const updatedOrder = await tx.order.update({
        where: { id },
        data: { status },
      });

      await tx.orderEvent.create({
        data: {
          orderId: id,
          status,
          note: note || `Status changed to ${status}`,
          createdBy: req.user!.userId,
        },
      });

      return updatedOrder;
    });

    return sendSuccess(res, updated, 'Order status updated');
  } catch (error: unknown) {
    logError('orders.updateStatus', error);
    const message = getErrorMessage(error, 'Failed to update order');
    return sendError(res, 400, message, error);
  }
};

export const getOrderTimeline = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const events = await prisma.orderEvent.findMany({
      where: { orderId: id },
      include: {
        user: { select: { name: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
    return sendSuccess(res, events);
  } catch (error: unknown) {
    logError('orders.getTimeline', error);
    return sendError(res, 500, 'Failed to fetch order timeline', error);
  }
};

export const getOrderById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        artwork: true,
        events: { orderBy: { createdAt: 'asc' } },
        deliveryAssignment: {
          include: {
            deliveryUser: { select: { name: true, phone: true } },
          },
        },
        buyer: { select: { id: true, name: true, email: true } },
      },
    });

    if (!order) return sendError(res, 404, 'Order not found');

    // Only buyer, artist, or admin/manager can view
    const userId = req.user!.userId;
    const isOwner = order.buyerId === userId;
    const isArtist = order.artwork?.artistId
      ? await prisma.artist.findFirst({ where: { id: order.artwork.artistId, userId } })
      : null;
    const privileged = ['ADMIN', 'MANAGER', 'SUPPORT'].includes(req.user!.role);

    if (!isOwner && !isArtist && !privileged) {
      return sendError(res, 403, 'Access denied');
    }

    return sendSuccess(res, order);
  } catch (error: unknown) {
    logError('orders.getById', error);
    return sendError(res, 500, 'Failed to fetch order', error);
  }
};
