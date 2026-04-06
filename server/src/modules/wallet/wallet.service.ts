import { prisma } from '../../config/db';
import { EscrowStatus, WalletTxnType } from '@prisma/client';

export const getWallet = async (userId: string) => {
  return prisma.wallet.findUnique({
    where: { userId },
    include: {
      transactions: {
        orderBy: { createdAt: 'desc' },
        take: 20,
      },
      escrows: {
        where: { status: EscrowStatus.HELD },
        orderBy: { heldAt: 'desc' },
      },
    },
  });
};

export const getTransactions = async (
  userId: string,
  page: number,
  limit: number,
) => {
  const wallet = await prisma.wallet.findUnique({ where: { userId } });
  if (!wallet) return { transactions: [], total: 0 };

  const [transactions, total] = await Promise.all([
    prisma.walletTransaction.findMany({
      where: { walletId: wallet.id },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.walletTransaction.count({ where: { walletId: wallet.id } }),
  ]);

  return { transactions, total };
};

export const addMoney = async (userId: string, amount: number) => {
  if (amount <= 0) throw new Error('Amount must be positive');

  return prisma.$transaction(async (tx) => {
    const wallet = await tx.wallet.update({
      where: { userId },
      data: { balance: { increment: amount } },
    });

    await tx.walletTransaction.create({
      data: {
        walletId: wallet.id,
        amount,
        type: WalletTxnType.CREDIT,
        status: 'COMPLETED',
        description: 'Wallet top-up',
      },
    });

    return wallet;
  });
};

export const holdFunds = async (
  userId: string,
  amount: number,
  reference: { orderId?: string; bidRequestId?: string },
) => {
  if (amount <= 0) throw new Error('Amount must be positive');

  return prisma.$transaction(async (tx) => {
    const wallet = await tx.wallet.findUnique({ where: { userId } });
    if (!wallet) throw new Error('Wallet not found');

    const available = wallet.balance - wallet.holdBalance;
    if (available < amount) {
      throw new Error(
        `Insufficient balance. Available: ₹${available.toFixed(2)}, Required: ₹${amount.toFixed(2)}`,
      );
    }

    await tx.wallet.update({
      where: { userId },
      data: { holdBalance: { increment: amount } },
    });

    const escrow = await tx.escrowTransaction.create({
      data: {
        walletId: wallet.id,
        amount,
        orderId: reference.orderId,
        bidRequestId: reference.bidRequestId,
        status: EscrowStatus.HELD,
      },
    });

    await tx.walletTransaction.create({
      data: {
        walletId: wallet.id,
        amount,
        type: WalletTxnType.HOLD,
        status: 'COMPLETED',
        description: `Funds held in escrow`,
        referenceId: escrow.id,
      },
    });

    return escrow;
  });
};

export const releaseFunds = async (escrowId: string, toUserId: string) => {
  return prisma.$transaction(async (tx) => {
    const escrow = await tx.escrowTransaction.findUnique({
      where: { id: escrowId },
      include: { wallet: true },
    });

    if (!escrow) throw new Error('Escrow transaction not found');
    if (escrow.status !== EscrowStatus.HELD) {
      throw new Error(`Escrow is ${escrow.status}, cannot release`);
    }

    // Deduct from hold balance of buyer
    await tx.wallet.update({
      where: { id: escrow.walletId },
      data: {
        balance: { decrement: escrow.amount },
        holdBalance: { decrement: escrow.amount },
      },
    });

    await tx.walletTransaction.create({
      data: {
        walletId: escrow.walletId,
        amount: escrow.amount,
        type: WalletTxnType.RELEASE,
        status: 'COMPLETED',
        description: 'Escrow released — payment to artist',
        referenceId: escrow.id,
      },
    });

    // Credit to artist wallet
    const artistWallet = await tx.wallet.findUnique({
      where: { userId: toUserId },
    });

    if (artistWallet) {
      await tx.wallet.update({
        where: { userId: toUserId },
        data: { balance: { increment: escrow.amount } },
      });

      await tx.walletTransaction.create({
        data: {
          walletId: artistWallet.id,
          amount: escrow.amount,
          type: WalletTxnType.CREDIT,
          status: 'COMPLETED',
          description: 'Payment received from escrow',
          referenceId: escrow.id,
        },
      });
    }

    return tx.escrowTransaction.update({
      where: { id: escrowId },
      data: {
        status: EscrowStatus.RELEASED,
        releasedAt: new Date(),
      },
    });
  });
};

export const refundFunds = async (escrowId: string) => {
  return prisma.$transaction(async (tx) => {
    const escrow = await tx.escrowTransaction.findUnique({
      where: { id: escrowId },
      include: { wallet: true },
    });

    if (!escrow) throw new Error('Escrow transaction not found');
    if (escrow.status !== EscrowStatus.HELD && escrow.status !== EscrowStatus.DISPUTED) {
      throw new Error(`Escrow is ${escrow.status}, cannot refund`);
    }

    // Release hold and keep balance as-is (money goes back to available)
    await tx.wallet.update({
      where: { id: escrow.walletId },
      data: { holdBalance: { decrement: escrow.amount } },
    });

    await tx.walletTransaction.create({
      data: {
        walletId: escrow.walletId,
        amount: escrow.amount,
        type: WalletTxnType.REFUND,
        status: 'COMPLETED',
        description: 'Escrow refunded',
        referenceId: escrow.id,
      },
    });

    return tx.escrowTransaction.update({
      where: { id: escrowId },
      data: {
        status: EscrowStatus.REFUNDED,
        refundedAt: new Date(),
      },
    });
  });
};

export const getEscrows = async (userId: string) => {
  const wallet = await prisma.wallet.findUnique({ where: { userId } });
  if (!wallet) return [];

  return prisma.escrowTransaction.findMany({
    where: { walletId: wallet.id },
    include: {
      order: { select: { id: true, status: true, totalAmount: true } },
      bidRequest: { select: { id: true, title: true, status: true } },
    },
    orderBy: { heldAt: 'desc' },
  });
};
