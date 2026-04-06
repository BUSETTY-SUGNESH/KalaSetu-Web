import { Response } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../../middleware/auth.middleware';
import { sendSuccess, sendError, getErrorMessage, parsePagination } from '../../utils/http';
import { logError } from '../../utils/logger';
import * as walletService from './wallet.service';

const addMoneySchema = z.object({
  amount: z.number().positive('Amount must be positive'),
});

export const getWallet = async (req: AuthRequest, res: Response) => {
  try {
    const wallet = await walletService.getWallet(req.user!.userId);
    if (!wallet) return sendError(res, 404, 'Wallet not found');
    return sendSuccess(res, wallet);
  } catch (error) {
    logError('wallet.getWallet', error);
    return sendError(res, 500, 'Failed to fetch wallet', error);
  }
};

export const getTransactions = async (req: AuthRequest, res: Response) => {
  try {
    const { page, limit } = parsePagination(req.query as Record<string, unknown>);
    const result = await walletService.getTransactions(req.user!.userId, page, limit);
    return sendSuccess(res, result);
  } catch (error) {
    logError('wallet.getTransactions', error);
    return sendError(res, 500, 'Failed to fetch transactions', error);
  }
};

export const addMoney = async (req: AuthRequest, res: Response) => {
  try {
    const { amount } = addMoneySchema.parse(req.body);
    const wallet = await walletService.addMoney(req.user!.userId, amount);
    return sendSuccess(res, wallet, 'Money added successfully');
  } catch (error) {
    logError('wallet.addMoney', error);
    const message = getErrorMessage(error, 'Failed to add money');
    return sendError(res, 400, message, error);
  }
};

export const holdFunds = async (req: AuthRequest, res: Response) => {
  try {
    const { amount, orderId, bidRequestId } = req.body;
    if (!amount || amount <= 0) return sendError(res, 400, 'Invalid amount');
    if (!orderId && !bidRequestId) return sendError(res, 400, 'Must provide orderId or bidRequestId');

    const escrow = await walletService.holdFunds(req.user!.userId, amount, {
      orderId,
      bidRequestId,
    });
    return sendSuccess(res, escrow, 'Funds held in escrow', 201);
  } catch (error) {
    logError('wallet.holdFunds', error);
    const message = getErrorMessage(error, 'Failed to hold funds');
    return sendError(res, 400, message, error);
  }
};

export const releaseFunds = async (req: AuthRequest, res: Response) => {
  try {
    const { escrowId, toUserId } = req.body;
    if (!escrowId || !toUserId) return sendError(res, 400, 'escrowId and toUserId required');

    const escrow = await walletService.releaseFunds(escrowId, toUserId);
    return sendSuccess(res, escrow, 'Funds released');
  } catch (error) {
    logError('wallet.releaseFunds', error);
    const message = getErrorMessage(error, 'Failed to release funds');
    return sendError(res, 400, message, error);
  }
};

export const refundFunds = async (req: AuthRequest, res: Response) => {
  try {
    const { escrowId } = req.body;
    if (!escrowId) return sendError(res, 400, 'escrowId required');

    const escrow = await walletService.refundFunds(escrowId);
    return sendSuccess(res, escrow, 'Funds refunded');
  } catch (error) {
    logError('wallet.refundFunds', error);
    const message = getErrorMessage(error, 'Failed to refund funds');
    return sendError(res, 400, message, error);
  }
};

export const getEscrows = async (req: AuthRequest, res: Response) => {
  try {
    const escrows = await walletService.getEscrows(req.user!.userId);
    return sendSuccess(res, escrows);
  } catch (error) {
    logError('wallet.getEscrows', error);
    return sendError(res, 500, 'Failed to fetch escrows', error);
  }
};
