import { Response } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../../middleware/auth.middleware';
import { sendSuccess, sendError, getErrorMessage } from '../../utils/http';
import { logError } from '../../utils/logger';
import * as kycService from './kyc.service';

const submitKycSchema = z.object({
  panNumber: z
    .string()
    .length(10, 'PAN must be 10 characters')
    .regex(/^[A-Z]{5}[0-9]{4}[A-Z]$/, 'Invalid PAN format')
    .optional(),
  aadhaarNumber: z
    .string()
    .length(12, 'Aadhaar must be 12 digits')
    .regex(/^\d{12}$/, 'Aadhaar must be numeric')
    .optional(),
});

export const getKycStatus = async (req: AuthRequest, res: Response) => {
  try {
    const kyc = await kycService.getKycStatus(req.user!.userId);
    return sendSuccess(res, kyc);
  } catch (error) {
    logError('kyc.getStatus', error);
    return sendError(res, 500, 'Failed to fetch KYC status', error);
  }
};

export const submitKyc = async (req: AuthRequest, res: Response) => {
  try {
    const data = submitKycSchema.parse(req.body);
    if (!data.panNumber && !data.aadhaarNumber) {
      return sendError(res, 400, 'At least PAN or Aadhaar is required');
    }

    const kyc = await kycService.submitKyc(req.user!.userId, data);
    return sendSuccess(res, kyc, 'KYC submitted for verification', 201);
  } catch (error) {
    logError('kyc.submit', error);
    const message = getErrorMessage(error, 'KYC submission failed');
    return sendError(res, 400, message, error);
  }
};

export const verifyKyc = async (req: AuthRequest, res: Response) => {
  try {
    const kyc = await kycService.mockVerifyKyc(req.user!.userId);
    return sendSuccess(res, kyc, 'KYC verification processed');
  } catch (error) {
    logError('kyc.verify', error);
    const message = getErrorMessage(error, 'KYC verification failed');
    return sendError(res, 400, message, error);
  }
};

export const adminVerify = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    if (!userId) return sendError(res, 400, 'userId required');

    const kyc = await kycService.adminVerifyKyc(userId);
    return sendSuccess(res, kyc, 'KYC approved');
  } catch (error) {
    logError('kyc.adminVerify', error);
    const message = getErrorMessage(error, 'Admin KYC verification failed');
    return sendError(res, 400, message, error);
  }
};

export const adminReject = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;
    if (!userId) return sendError(res, 400, 'userId required');
    if (!reason) return sendError(res, 400, 'Rejection reason required');

    const kyc = await kycService.adminRejectKyc(userId, reason);
    return sendSuccess(res, kyc, 'KYC rejected');
  } catch (error) {
    logError('kyc.adminReject', error);
    const message = getErrorMessage(error, 'Admin KYC rejection failed');
    return sendError(res, 400, message, error);
  }
};
