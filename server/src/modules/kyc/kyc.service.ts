import { prisma } from '../../config/db';
import { KycStatus } from '@prisma/client';

export const getKycStatus = async (userId: string) => {
  const kyc = await prisma.kyc.findUnique({ where: { userId } });
  if (!kyc) {
    return {
      status: KycStatus.NOT_STARTED,
      panVerified: false,
      aadhaarVerified: false,
    };
  }
  return kyc;
};

export const submitKyc = async (
  userId: string,
  data: {
    panNumber?: string;
    aadhaarNumber?: string;
    documents?: Record<string, unknown>;
  },
) => {
  return prisma.kyc.upsert({
    where: { userId },
    create: {
      userId,
      panNumber: data.panNumber,
      aadhaarNumber: data.aadhaarNumber,
      documents: data.documents ?? undefined,
      status: KycStatus.PENDING,
    },
    update: {
      panNumber: data.panNumber ?? undefined,
      aadhaarNumber: data.aadhaarNumber ?? undefined,
      documents: data.documents ?? undefined,
      status: KycStatus.PENDING,
      rejectionReason: null,
    },
  });
};

/**
 * Mock verification — simulates DigiLocker / external KYC API.
 * In production, replace with actual API integration.
 */
export const mockVerifyKyc = async (userId: string) => {
  const kyc = await prisma.kyc.findUnique({ where: { userId } });
  if (!kyc) throw new Error('KYC submission not found');
  if (kyc.status === KycStatus.VERIFIED) return kyc;

  const panOk = Boolean(kyc.panNumber && kyc.panNumber.length === 10);
  const aadhaarOk = Boolean(kyc.aadhaarNumber && kyc.aadhaarNumber.length === 12);

  if (!panOk && !aadhaarOk) {
    return prisma.kyc.update({
      where: { userId },
      data: {
        status: KycStatus.FAILED,
        rejectionReason: 'Invalid PAN or Aadhaar number format',
      },
    });
  }

  return prisma.kyc.update({
    where: { userId },
    data: {
      status: KycStatus.VERIFIED,
      panVerified: panOk,
      aadhaarVerified: aadhaarOk,
      verifiedAt: new Date(),
      rejectionReason: null,
    },
  });
};

/** Admin-only: manually approve KYC */
export const adminVerifyKyc = async (userId: string) => {
  return prisma.kyc.upsert({
    where: { userId },
    create: {
      userId,
      status: KycStatus.VERIFIED,
      panVerified: true,
      aadhaarVerified: true,
      verifiedAt: new Date(),
    },
    update: {
      status: KycStatus.VERIFIED,
      panVerified: true,
      aadhaarVerified: true,
      verifiedAt: new Date(),
      rejectionReason: null,
    },
  });
};

/** Admin-only: reject KYC */
export const adminRejectKyc = async (userId: string, reason: string) => {
  const kyc = await prisma.kyc.findUnique({ where: { userId } });
  if (!kyc) throw new Error('KYC submission not found');

  return prisma.kyc.update({
    where: { userId },
    data: {
      status: KycStatus.FAILED,
      rejectionReason: reason,
    },
  });
};

/** Check if user has completed KYC */
export const requireKyc = async (userId: string): Promise<boolean> => {
  const kyc = await prisma.kyc.findUnique({ where: { userId } });
  return kyc?.status === KycStatus.VERIFIED;
};
