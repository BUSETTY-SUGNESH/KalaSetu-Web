import crypto from 'crypto';
import { Response } from 'express';
import Razorpay from 'razorpay';
import { PaymentPurpose, PaymentStatus, Prisma } from '@prisma/client';
import { z, ZodError } from 'zod';
import { prisma } from '../../config/db';
import { AuthRequest } from '../../middleware/auth.middleware';
import { logError } from '../../utils/logger';
import {
  getErrorMessage,
  parsePagination,
  parseSort,
  parseSortOrder,
  sendError,
  sendSuccess,
} from '../../utils/http';

const shippingAddressSchema = z.object({
  address: z.string().min(3),
  city: z.string().min(2),
  state: z.string().min(2),
  zip: z.string().min(3),
  country: z.string().min(2),
});

const createOrderSchema = z.discriminatedUnion('purpose', [
  z.object({
    purpose: z.literal('ORDER'),
    artworkId: z.string().uuid(),
    shippingAddress: shippingAddressSchema,
  }),
  z.object({
    purpose: z.literal('WALLET_TOPUP'),
    amount: z.coerce.number().positive().max(500000),
  }),
]);

const verifyPaymentSchema = z.object({
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
});

const getRazorpay = () => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    throw new Error('RAZORPAY_CONFIG_MISSING');
  }

  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });
};

type PaymentUserResult =
  | { user: { id: string; isVerified: boolean } }
  | { error: string; status: number };

const getPaymentUser = async (userId: string): Promise<PaymentUserResult> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      isVerified: true,
    },
  });

  if (!user) {
    return { error: 'User not found', status: 404 as const };
  }

  return { user };
};

const requireVerifiedForOrder = (user: { isVerified: boolean }): { error: string; status: number } | null => {
  if (!user.isVerified) {
    return { error: 'Only verified users can purchase artwork', status: 403 };
  }
  return null;
};

const orderMetaSchema = z.object({
  artworkId: z.string().uuid(),
  shippingAddress: shippingAddressSchema,
});

export const createPaymentOrder = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    return sendError(res, 401, 'Authentication required');
  }

  try {
    const payload = createOrderSchema.parse(req.body);
    const paymentUser = await getPaymentUser(userId);
    if ('error' in paymentUser) {
      return sendError(res, paymentUser.status, paymentUser.error);
    }

    if (payload.purpose === 'ORDER') {
      const orderGuard = requireVerifiedForOrder(paymentUser.user);
      if (orderGuard) {
        return sendError(res, orderGuard.status, orderGuard.error);
      }
    }

    const razorpay = getRazorpay();

    let amount = 0;
    let purpose: PaymentPurpose;
    let meta: Record<string, unknown> | undefined;

    if (payload.purpose === 'ORDER') {
      const artwork = await prisma.artwork.findUnique({
        where: { id: payload.artworkId },
        include: {
          artist: {
            select: {
              userId: true,
            },
          },
        },
      });

      if (!artwork || artwork.status !== 'LISTED') {
        return sendError(res, 400, 'Artwork not available for purchase');
      }

      if (artwork.artist.userId === userId) {
        return sendError(res, 403, 'You cannot purchase your own artwork');
      }

      amount = Number(artwork.price);
      purpose = PaymentPurpose.ORDER;
      meta = {
        artworkId: payload.artworkId,
        shippingAddress: payload.shippingAddress,
      };
    } else {
      amount = Number(payload.amount);
      purpose = PaymentPurpose.WALLET_TOPUP;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      return sendError(res, 400, 'Invalid payment amount');
    }

    const amountPaise = Math.max(1, Math.round(Number(amount) * 100));
    const receipt = `${purpose}_${Date.now()}_${userId}`.slice(0, 40);
    const razorpayOrder = await razorpay.orders.create({
      amount: amountPaise,
      currency: 'INR',
      receipt,
      payment_capture: 1 as unknown as boolean,
      notes: {
        purpose,
        userId,
      },
    });

    await prisma.payment.create({
      data: {
        userId,
        amount,
        purpose,
        method: 'RAZORPAY',
        status: PaymentStatus.PENDING,
        razorpayOrderId: razorpayOrder.id,
        meta: meta as Prisma.InputJsonValue | undefined,
      },
    });

    const rawAmt = razorpayOrder.amount as unknown;
    const amountNum =
      typeof rawAmt === 'bigint' ? Number(rawAmt) : Number(rawAmt);

    return sendSuccess(res, {
      id: String(razorpayOrder.id),
      amount: Number.isFinite(amountNum) ? amountNum : amountPaise,
      currency: String(razorpayOrder.currency ?? 'INR'),
      purpose,
    }, 'Payment order created');
  } catch (error: unknown) {
    logError('payments.createPaymentOrder', error, {
      userId,
      body: req.body,
      hasRazorpayKeyId: Boolean(process.env.RAZORPAY_KEY_ID),
      hasRazorpayKeySecret: Boolean(process.env.RAZORPAY_KEY_SECRET),
    });
    if (error instanceof ZodError) {
      return sendError(res, 400, error.errors.map((e) => e.message).join(', '), error);
    }
    const message = getErrorMessage(error, 'Failed to create payment order');
    if (message === 'RAZORPAY_CONFIG_MISSING') {
      return sendError(res, 500, 'Payment gateway is not configured on server', error);
    }
    const statusCode =
      error && typeof error === 'object' && 'statusCode' in error && typeof (error as { statusCode: unknown }).statusCode === 'number'
        ? (error as { statusCode: number }).statusCode
        : null;
    if (statusCode && statusCode >= 400 && statusCode < 500) {
      return sendError(res, 400, message || 'Payment provider rejected the request', error);
    }
    return sendError(res, 500, message || 'Failed to create payment order', error);
  }
};

export const verifyPayment = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    return sendError(res, 401, 'Authentication required');
  }

  try {
    const payload = verifyPaymentSchema.parse(req.body);
    const payment = await prisma.payment.findFirst({
      where: {
        userId,
        razorpayOrderId: payload.razorpay_order_id,
      },
    });

    if (!payment) {
      return sendError(res, 404, 'Payment order not found');
    }

    if (payment.status === PaymentStatus.COMPLETED) {
      return sendSuccess(res, { verified: true }, 'Payment already verified');
    }

    const payUser = await getPaymentUser(userId);
    if ('error' in payUser) {
      return sendError(res, payUser.status, payUser.error);
    }
    if (payment.purpose === PaymentPurpose.ORDER) {
      const orderGuard = requireVerifiedForOrder(payUser.user);
      if (orderGuard) {
        return sendError(res, orderGuard.status, orderGuard.error);
      }
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      return sendError(res, 500, 'Razorpay key secret missing');
    }

    const body = `${payload.razorpay_order_id}|${payload.razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(body)
      .digest('hex');

    if (expectedSignature !== payload.razorpay_signature) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.FAILED,
          razorpayPaymentId: payload.razorpay_payment_id,
        },
      });
      return sendError(res, 400, 'Invalid payment signature');
    }

    const razorpay = getRazorpay();
    const razorpayPayment = await razorpay.payments.fetch(payload.razorpay_payment_id);
    if (
      razorpayPayment.order_id !== payload.razorpay_order_id ||
      Number(razorpayPayment.amount) !== Math.round(Number(payment.amount) * 100)
    ) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.FAILED,
          razorpayPaymentId: payload.razorpay_payment_id,
        },
      });
      return sendError(res, 400, 'Payment amount mismatch');
    }

    if (payment.purpose === PaymentPurpose.ORDER) {
      const meta = orderMetaSchema.parse(payment.meta ?? {});

      const txResult = await prisma.$transaction(async (tx) => {
        const artwork = await tx.artwork.findUnique({
          where: { id: meta.artworkId },
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

        if (artwork.artist.userId === userId) {
          throw new Error('You cannot purchase your own artwork');
        }

        const sold = await tx.artwork.updateMany({
          where: { id: artwork.id, status: 'LISTED' },
          data: { status: 'SOLD' },
        });
        if (sold.count === 0) {
          throw new Error('Artwork has already been sold');
        }

        const order = await tx.order.create({
          data: {
            buyerId: userId,
            artworkId: artwork.id,
            artistId: artwork.artistId,
            totalAmount: artwork.price,
            shippingAddress: meta.shippingAddress as any,
            status: 'CONFIRMED',
          },
        });

        await tx.payment.update({
          where: { id: payment.id },
          data: {
            orderId: order.id,
            status: PaymentStatus.COMPLETED,
            razorpayPaymentId: payload.razorpay_payment_id,
            transactionRef: payload.razorpay_signature,
          },
        });

        return order;
      });

      return sendSuccess(res, { verified: true, orderId: txResult.id }, 'Payment verified');
    }

    const wallet = await prisma.$transaction(async (tx) => {
      const w = await tx.wallet.upsert({
        where: { userId },
        update: {
          balance: {
            increment: Number(payment.amount),
          },
        },
        create: {
          userId,
          balance: Number(payment.amount),
        },
      });

      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.COMPLETED,
          razorpayPaymentId: payload.razorpay_payment_id,
          transactionRef: payload.razorpay_signature,
        },
      });

      await tx.walletTransaction.create({
        data: {
          walletId: w.id,
          amount: Number(payment.amount),
          type: 'CREDIT',
          status: PaymentStatus.COMPLETED,
          description: 'Wallet top-up via Razorpay',
          referenceId: payload.razorpay_payment_id,
        },
      });

      return w;
    });

    return sendSuccess(res, {
      verified: true,
      walletBalance: wallet.balance,
    }, 'Payment verified');
  } catch (error: unknown) {
    logError('payments.verifyPayment', error, { userId });
    const message = getErrorMessage(error, 'Payment verification failed');
    const status =
      message === 'Invalid payment signature' ||
      message === 'Payment amount mismatch' ||
      message === 'Artwork not available' ||
      message === 'You cannot purchase your own artwork' ||
      message === 'Artwork has already been sold'
        ? 400
        : 500;
    return sendError(res, status, message, error);
  }
};

export const getMyPayments = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    return sendError(res, 401, 'Authentication required');
  }

  try {
    const { limit, skip } = parsePagination(req.query as Record<string, unknown>);
    const sort = parseSort(req.query.sort, ['createdAt', 'amount', 'status', 'purpose'], 'createdAt');
    const order = parseSortOrder(req.query.order, 'desc');

    const payments = await prisma.payment.findMany({
      where: { userId },
      orderBy: { [sort]: order } as any,
      skip,
      take: limit,
      include: {
        order: {
          select: {
            id: true,
            artwork: {
              select: {
                title: true,
              },
            },
          },
        },
      },
    });

    return sendSuccess(
      res,
      payments.map((payment) => ({
        id: payment.id,
        amount: payment.amount,
        purpose: payment.purpose,
        status: payment.status,
        createdAt: payment.createdAt,
        order: payment.order,
      })),
      'Payments fetched',
    );
  } catch (error: unknown) {
    logError('payments.getMyPayments', error, { userId });
    return sendError(res, 500, 'Failed to fetch payments', error);
  }
};
