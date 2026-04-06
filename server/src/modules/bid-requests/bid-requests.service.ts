import { prisma } from '../../config/db';
import { ArtistBidStatus, BidRequestStatus } from '@prisma/client';
import * as walletService from '../wallet/wallet.service';

export const createBidRequest = async (
  customerId: string,
  data: {
    title: string;
    description: string;
    category?: string;
    budget?: number;
    deadline?: Date;
    images?: string[];
  },
) => {
  return prisma.bidRequest.create({
    data: {
      customerId,
      title: data.title,
      description: data.description,
      category: data.category,
      budget: data.budget,
      deadline: data.deadline,
      images: data.images || [],
    },
  });
};

export const getOpenBidRequests = async (page: number, limit: number) => {
  const where = {
    status: { in: [BidRequestStatus.OPEN, BidRequestStatus.BIDDING] as BidRequestStatus[] },
  };

  const [items, total] = await Promise.all([
    prisma.bidRequest.findMany({
      where,
      include: {
        customer: { select: { id: true, name: true, avatarUrl: true } },
        artistBids: {
          select: { id: true, amount: true, status: true },
        },
        _count: { select: { artistBids: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.bidRequest.count({ where }),
  ]);

  return { items, total };
};

export const getBidRequestById = async (id: string) => {
  return prisma.bidRequest.findUnique({
    where: { id },
    include: {
      customer: { select: { id: true, name: true, avatarUrl: true } },
      artistBids: {
        include: {
          artist: {
            select: {
              id: true,
              rating: true,
              totalSales: true,
              user: { select: { name: true, avatarUrl: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
      discussions: {
        select: { id: true, title: true, replyCount: true },
      },
      _count: { select: { artistBids: true } },
    },
  });
};

export const getMyBidRequests = async (customerId: string) => {
  return prisma.bidRequest.findMany({
    where: { customerId },
    include: {
      _count: { select: { artistBids: true } },
      artistBids: {
        select: { id: true, amount: true, status: true, artistId: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
};

export const placeArtistBid = async (
  bidRequestId: string,
  artistId: string,
  data: {
    amount: number;
    proposal: string;
    estimatedDays?: number;
  },
) => {
  const bidRequest = await prisma.bidRequest.findUnique({ where: { id: bidRequestId } });
  if (!bidRequest) throw new Error('Bid request not found');

  if (bidRequest.status !== BidRequestStatus.OPEN && bidRequest.status !== BidRequestStatus.BIDDING) {
    throw new Error('Bid request is not accepting bids');
  }

  const artist = await prisma.artist.findUnique({ where: { id: artistId } });
  if (!artist) throw new Error('Artist profile not found');

  // Prevent duplicate bids from same artist
  const existing = await prisma.artistBid.findFirst({
    where: {
      bidRequestId,
      artistId,
      status: ArtistBidStatus.PENDING,
    },
  });
  if (existing) throw new Error('You already have a pending bid on this request');

  return prisma.$transaction(async (tx) => {
    const artistBid = await tx.artistBid.create({
      data: {
        bidRequestId,
        artistId,
        amount: data.amount,
        proposal: data.proposal,
        estimatedDays: data.estimatedDays,
      },
    });

    // Update request status to BIDDING if it was OPEN
    if (bidRequest.status === BidRequestStatus.OPEN) {
      await tx.bidRequest.update({
        where: { id: bidRequestId },
        data: { status: BidRequestStatus.BIDDING },
      });
    }

    return artistBid;
  });
};

export const acceptArtistBid = async (
  bidRequestId: string,
  artistBidId: string,
  customerId: string,
) => {
  const bidRequest = await prisma.bidRequest.findUnique({ where: { id: bidRequestId } });
  if (!bidRequest) throw new Error('Bid request not found');
  if (bidRequest.customerId !== customerId) throw new Error('Not your bid request');

  const artistBid = await prisma.artistBid.findUnique({
    where: { id: artistBidId },
    include: { artist: true },
  });
  if (!artistBid || artistBid.bidRequestId !== bidRequestId) {
    throw new Error('Artist bid not found for this request');
  }

  return prisma.$transaction(async (tx) => {
    // Accept this bid
    await tx.artistBid.update({
      where: { id: artistBidId },
      data: { status: ArtistBidStatus.ACCEPTED },
    });

    // Reject all other bids
    await tx.artistBid.updateMany({
      where: {
        bidRequestId,
        id: { not: artistBidId },
        status: ArtistBidStatus.PENDING,
      },
      data: { status: ArtistBidStatus.REJECTED },
    });

    // Update request status
    await tx.bidRequest.update({
      where: { id: bidRequestId },
      data: { status: BidRequestStatus.ACCEPTED },
    });

    // Hold funds in escrow
    await walletService.holdFunds(customerId, artistBid.amount, { bidRequestId });

    return artistBid;
  });
};

export const completeBidRequest = async (bidRequestId: string, customerId: string) => {
  const bidRequest = await prisma.bidRequest.findUnique({
    where: { id: bidRequestId },
    include: { escrow: true },
  });

  if (!bidRequest) throw new Error('Bid request not found');
  if (bidRequest.customerId !== customerId) throw new Error('Not your bid request');
  if (bidRequest.status !== BidRequestStatus.ACCEPTED && bidRequest.status !== BidRequestStatus.IN_PROGRESS) {
    throw new Error('Bid request is not in a completable state');
  }

  const acceptedBid = await prisma.artistBid.findFirst({
    where: { bidRequestId, status: ArtistBidStatus.ACCEPTED },
    include: { artist: true },
  });
  if (!acceptedBid) throw new Error('No accepted bid found');

  return prisma.$transaction(async (tx) => {
    await tx.bidRequest.update({
      where: { id: bidRequestId },
      data: { status: BidRequestStatus.COMPLETED },
    });

    // Release escrow to artist
    if (bidRequest.escrow) {
      await walletService.releaseFunds(bidRequest.escrow.id, acceptedBid.artist.userId);
    }

    return bidRequest;
  });
};

export const cancelBidRequest = async (bidRequestId: string, customerId: string) => {
  const bidRequest = await prisma.bidRequest.findUnique({
    where: { id: bidRequestId },
    include: { escrow: true },
  });

  if (!bidRequest) throw new Error('Bid request not found');
  if (bidRequest.customerId !== customerId) throw new Error('Not your bid request');

  return prisma.$transaction(async (tx) => {
    await tx.bidRequest.update({
      where: { id: bidRequestId },
      data: { status: BidRequestStatus.CANCELLED },
    });

    // Reject all pending bids
    await tx.artistBid.updateMany({
      where: { bidRequestId, status: ArtistBidStatus.PENDING },
      data: { status: ArtistBidStatus.REJECTED },
    });

    // Refund escrow if held
    if (bidRequest.escrow && bidRequest.escrow.status === 'HELD') {
      await walletService.refundFunds(bidRequest.escrow.id);
    }

    return bidRequest;
  });
};

export const getBidAnalytics = async (bidRequestId: string) => {
  const bids = await prisma.artistBid.findMany({
    where: { bidRequestId },
    select: { amount: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  });

  if (bids.length === 0) {
    return { count: 0, highest: 0, lowest: 0, average: 0, history: [] };
  }

  const amounts = bids.map((b) => b.amount);
  return {
    count: bids.length,
    highest: Math.max(...amounts),
    lowest: Math.min(...amounts),
    average: amounts.reduce((a, b) => a + b, 0) / amounts.length,
    history: bids.map((b) => ({
      amount: b.amount,
      timestamp: b.createdAt.toISOString(),
    })),
  };
};
