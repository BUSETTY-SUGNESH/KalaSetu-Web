import { Response } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../../middleware/auth.middleware';
import { sendSuccess, sendError, getErrorMessage, parsePagination } from '../../utils/http';
import { logError } from '../../utils/logger';
import { requireKyc } from '../kyc/kyc.service';
import * as bidRequestService from './bid-requests.service';

const createBidRequestSchema = z.object({
  title: z.string().min(5).max(200),
  description: z.string().min(20).max(2000),
  category: z.string().optional(),
  budget: z.number().positive().optional(),
  deadline: z.string().datetime().optional(),
  images: z.array(z.string().url()).optional(),
});

const placeArtistBidSchema = z.object({
  amount: z.number().positive(),
  proposal: z.string().min(10).max(2000),
  estimatedDays: z.number().int().positive().optional(),
});

export const createBidRequest = async (req: AuthRequest, res: Response) => {
  try {
    // KYC required for bid requests
    const kycOk = await requireKyc(req.user!.userId);
    if (!kycOk) {
      return sendError(res, 403, 'KYC verification required to create bid requests');
    }

    const data = createBidRequestSchema.parse(req.body);
    const bidRequest = await bidRequestService.createBidRequest(req.user!.userId, {
      ...data,
      deadline: data.deadline ? new Date(data.deadline) : undefined,
    });
    return sendSuccess(res, bidRequest, 'Bid request created', 201);
  } catch (error) {
    logError('bidRequests.create', error);
    const message = getErrorMessage(error, 'Failed to create bid request');
    return sendError(res, 400, message, error);
  }
};

export const getOpenBidRequests = async (req: AuthRequest, res: Response) => {
  try {
    const { page, limit } = parsePagination(req.query as Record<string, unknown>);
    const result = await bidRequestService.getOpenBidRequests(page, limit);
    return sendSuccess(res, result);
  } catch (error) {
    logError('bidRequests.getOpen', error);
    return sendError(res, 500, 'Failed to fetch bid requests', error);
  }
};

export const getBidRequestById = async (req: AuthRequest, res: Response) => {
  try {
    const bidRequest = await bidRequestService.getBidRequestById(req.params.id);
    if (!bidRequest) return sendError(res, 404, 'Bid request not found');
    return sendSuccess(res, bidRequest);
  } catch (error) {
    logError('bidRequests.getById', error);
    return sendError(res, 500, 'Failed to fetch bid request', error);
  }
};

export const getMyBidRequests = async (req: AuthRequest, res: Response) => {
  try {
    const requests = await bidRequestService.getMyBidRequests(req.user!.userId);
    return sendSuccess(res, requests);
  } catch (error) {
    logError('bidRequests.getMine', error);
    return sendError(res, 500, 'Failed to fetch your bid requests', error);
  }
};

export const placeArtistBid = async (req: AuthRequest, res: Response) => {
  try {
    const data = placeArtistBidSchema.parse(req.body);

    // Find artist profile for current user
    const { prisma } = await import('../../config/db');
    const artist = await prisma.artist.findUnique({ where: { userId: req.user!.userId } });
    if (!artist) return sendError(res, 403, 'Artist profile required');

    const bid = await bidRequestService.placeArtistBid(req.params.id, artist.id, data);
    return sendSuccess(res, bid, 'Bid placed successfully', 201);
  } catch (error) {
    logError('bidRequests.placeBid', error);
    const message = getErrorMessage(error, 'Failed to place bid');
    return sendError(res, 400, message, error);
  }
};

export const acceptBid = async (req: AuthRequest, res: Response) => {
  try {
    const { artistBidId } = req.body;
    if (!artistBidId) return sendError(res, 400, 'artistBidId required');

    const result = await bidRequestService.acceptArtistBid(
      req.params.id,
      artistBidId,
      req.user!.userId,
    );
    return sendSuccess(res, result, 'Bid accepted, funds held in escrow');
  } catch (error) {
    logError('bidRequests.accept', error);
    const message = getErrorMessage(error, 'Failed to accept bid');
    return sendError(res, 400, message, error);
  }
};

export const completeBidRequest = async (req: AuthRequest, res: Response) => {
  try {
    const result = await bidRequestService.completeBidRequest(
      req.params.id,
      req.user!.userId,
    );
    return sendSuccess(res, result, 'Bid request completed, funds released to artist');
  } catch (error) {
    logError('bidRequests.complete', error);
    const message = getErrorMessage(error, 'Failed to complete bid request');
    return sendError(res, 400, message, error);
  }
};

export const cancelBidRequest = async (req: AuthRequest, res: Response) => {
  try {
    const result = await bidRequestService.cancelBidRequest(
      req.params.id,
      req.user!.userId,
    );
    return sendSuccess(res, result, 'Bid request cancelled, funds refunded');
  } catch (error) {
    logError('bidRequests.cancel', error);
    const message = getErrorMessage(error, 'Failed to cancel bid request');
    return sendError(res, 400, message, error);
  }
};

export const getBidAnalytics = async (req: AuthRequest, res: Response) => {
  try {
    const analytics = await bidRequestService.getBidAnalytics(req.params.id);
    return sendSuccess(res, analytics);
  } catch (error) {
    logError('bidRequests.analytics', error);
    return sendError(res, 500, 'Failed to fetch bid analytics', error);
  }
};
