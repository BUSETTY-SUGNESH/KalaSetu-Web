import { prisma } from '../../config/db';
import { TicketStatus, TicketPriority } from '@prisma/client';

export const createTicket = async (
  userId: string,
  data: {
    subject: string;
    description: string;
    orderId?: string;
    priority?: TicketPriority;
  },
) => {
  if (data.orderId) {
    const order = await prisma.order.findFirst({
      where: { id: data.orderId, buyerId: userId },
    });
    if (!order) throw new Error('Order not found or not owned by you');
  }

  return prisma.supportTicket.create({
    data: {
      userId,
      subject: data.subject,
      description: data.description,
      orderId: data.orderId,
      priority: data.priority || TicketPriority.MEDIUM,
    },
  });
};

export const getMyTickets = async (userId: string) => {
  return prisma.supportTicket.findMany({
    where: { userId },
    include: {
      order: { select: { id: true, status: true, totalAmount: true } },
      assignee: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
};

export const getAllTickets = async (filters: {
  status?: TicketStatus;
  priority?: TicketPriority;
  assignedTo?: string;
  page?: number;
  limit?: number;
}) => {
  const page = filters.page || 1;
  const limit = Math.min(filters.limit || 20, 100);

  const where: Record<string, unknown> = {};
  if (filters.status) where.status = filters.status;
  if (filters.priority) where.priority = filters.priority;
  if (filters.assignedTo) where.assignedTo = filters.assignedTo;

  const [tickets, total] = await Promise.all([
    prisma.supportTicket.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true } },
        order: { select: { id: true, status: true, totalAmount: true } },
        assignee: { select: { id: true, name: true } },
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.supportTicket.count({ where }),
  ]);

  return { tickets, total, page, limit };
};

export const assignTicket = async (ticketId: string, assigneeId: string) => {
  const assignee = await prisma.user.findUnique({ where: { id: assigneeId } });
  if (!assignee || !['SUPPORT', 'ADMIN', 'MANAGER'].some((r) => assignee.roles.includes(r as any))) {
    throw new Error('Invalid assignee — must be support/admin/manager');
  }

  return prisma.supportTicket.update({
    where: { id: ticketId },
    data: {
      assignedTo: assigneeId,
      status: TicketStatus.IN_PROGRESS,
    },
  });
};

export const updateTicketStatus = async (
  ticketId: string,
  status: TicketStatus,
  userId: string,
) => {
  const ticket = await prisma.supportTicket.findUnique({ where: { id: ticketId } });
  if (!ticket) throw new Error('Ticket not found');

  const data: Record<string, unknown> = { status };
  if (status === TicketStatus.RESOLVED || status === TicketStatus.CLOSED) {
    data.resolvedAt = new Date();
  }

  return prisma.supportTicket.update({
    where: { id: ticketId },
    data: data as any,
  });
};

export const getTicketById = async (ticketId: string) => {
  return prisma.supportTicket.findUnique({
    where: { id: ticketId },
    include: {
      user: { select: { id: true, name: true, email: true, phone: true } },
      order: {
        select: {
          id: true,
          status: true,
          totalAmount: true,
          shippingAddress: true,
          artwork: { select: { title: true } },
        },
      },
      assignee: { select: { id: true, name: true } },
    },
  });
};
