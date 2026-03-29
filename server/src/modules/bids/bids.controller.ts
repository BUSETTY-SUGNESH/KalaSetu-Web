import { Response } from 'express';
import { prisma } from '../../index';
import { AuthRequest } from '../../middleware/auth.middleware';
import { z } from 'zod';

const bidSchema = z.object({
  amount: z.number().positive(),
});

export const placeBid = async (req: AuthRequest, res: Response) => {
  try {
    const { amount } = bidSchema.parse(req.body);
    const bidId = req.params.id;
    const userId = req.user?.userId;

    const bid = await prisma.bid.findUnique({
      where: { id: bidId },
      include: { artwork: true }
    });

    if (!bid || bid.status !== 'ACTIVE') {
      return res.status(400).json({ error: 'Bid is not active' });
    }

    if (amount <= bid.currentHighest) {
      return res.status(400).json({ error: 'Bid must be higher than current highest' });
    }

    if (amount < bid.currentHighest + bid.minIncrement) {
      return res.status(400).json({ error: `Minimum increment is ₹${bid.minIncrement}` });
    }

    // Update bid with new highest
    const updatedBid = await prisma.bid.update({
      where: { id: bidId },
      data: {
        currentHighest: amount,
        currentWinnerId: userId,
        participants: {
          create: {
            userId: userId!,
            amount,
            isWinning: true,
          }
        }
      }
    });

    // Mark other participants as not winning for this bid
    await prisma.bidParticipant.updateMany({
      where: {
        bidId,
        userId: { not: userId },
        isWinning: true,
      },
      data: { isWinning: false }
    });

    res.json(updatedBid);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to place bid' });
  }
};

export const getActiveBids = async (res: Response) => {
  try {
    const bids = await prisma.bid.findMany({
      where: { status: 'ACTIVE' },
      include: { artwork: true, artist: { include: { user: { select: { name: true } } } } }
    });
    res.json(bids);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch bids' });
  }
};
