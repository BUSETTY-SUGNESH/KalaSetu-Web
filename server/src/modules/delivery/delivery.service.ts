import { prisma } from '../../config/db';
import { DeliveryStatus } from '@prisma/client';

export const assignDelivery = async (orderId: string, deliveryUserId: string) => {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new Error('Order not found');

  const existing = await prisma.deliveryAssignment.findUnique({ where: { orderId } });
  if (existing) throw new Error('Delivery already assigned for this order');

  const deliveryUser = await prisma.user.findUnique({ where: { id: deliveryUserId } });
  if (!deliveryUser || !deliveryUser.roles.includes('DELIVERY')) {
    throw new Error('Invalid delivery user');
  }

  return prisma.$transaction(async (tx) => {
    const assignment = await tx.deliveryAssignment.create({
      data: {
        orderId,
        deliveryUserId,
        status: DeliveryStatus.ASSIGNED,
      },
    });

    await tx.order.update({
      where: { id: orderId },
      data: { status: 'SHIPPED' },
    });

    await tx.orderEvent.create({
      data: {
        orderId,
        status: 'SHIPPED',
        note: `Delivery assigned to ${deliveryUser.name}`,
      },
    });

    return assignment;
  });
};

export const updateStatus = async (
  assignmentId: string,
  deliveryUserId: string,
  status: DeliveryStatus,
  notes?: string,
) => {
  const assignment = await prisma.deliveryAssignment.findUnique({
    where: { id: assignmentId },
  });

  if (!assignment) throw new Error('Delivery assignment not found');
  if (assignment.deliveryUserId !== deliveryUserId) {
    throw new Error('Not authorized to update this delivery');
  }

  const updateData: Record<string, unknown> = { status, notes };

  if (status === DeliveryStatus.PICKED_UP) {
    updateData.pickedUpAt = new Date();
  } else if (status === DeliveryStatus.DELIVERED) {
    updateData.deliveredAt = new Date();
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.deliveryAssignment.update({
      where: { id: assignmentId },
      data: updateData as any,
    });

    if (status === DeliveryStatus.DELIVERED) {
      await tx.order.update({
        where: { id: assignment.orderId },
        data: { status: 'DELIVERED' },
      });
    }

    await tx.orderEvent.create({
      data: {
        orderId: assignment.orderId,
        status: `DELIVERY_${status}`,
        note: notes || `Delivery status updated to ${status}`,
        createdBy: deliveryUserId,
      },
    });

    return updated;
  });
};

export const getMyDeliveries = async (
  deliveryUserId: string,
  status?: DeliveryStatus,
) => {
  return prisma.deliveryAssignment.findMany({
    where: {
      deliveryUserId,
      ...(status ? { status } : {}),
    },
    include: {
      order: {
        select: {
          id: true,
          totalAmount: true,
          shippingAddress: true,
          status: true,
          artwork: {
            select: { title: true },
          },
          buyer: {
            select: { name: true, phone: true },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
};

export const getDeliveryByOrder = async (orderId: string) => {
  return prisma.deliveryAssignment.findUnique({
    where: { orderId },
    include: {
      deliveryUser: {
        select: { id: true, name: true, phone: true },
      },
    },
  });
};
