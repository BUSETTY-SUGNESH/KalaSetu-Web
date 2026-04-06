import { Response } from 'express';
import { z } from 'zod';
import { TicketStatus, TicketPriority } from '@prisma/client';
import { AuthRequest } from '../../middleware/auth.middleware';
import { sendSuccess, sendError, getErrorMessage, parsePagination } from '../../utils/http';
import { logError } from '../../utils/logger';
import * as supportService from './support.service';

const createTicketSchema = z.object({
  subject: z.string().min(3).max(200),
  description: z.string().min(10).max(2000),
  orderId: z.string().uuid().optional(),
  priority: z.nativeEnum(TicketPriority).optional(),
});

export const createTicket = async (req: AuthRequest, res: Response) => {
  try {
    const data = createTicketSchema.parse(req.body);
    const ticket = await supportService.createTicket(req.user!.userId, data);
    return sendSuccess(res, ticket, 'Support ticket created', 201);
  } catch (error) {
    logError('support.createTicket', error);
    const message = getErrorMessage(error, 'Failed to create ticket');
    return sendError(res, 400, message, error);
  }
};

export const getMyTickets = async (req: AuthRequest, res: Response) => {
  try {
    const tickets = await supportService.getMyTickets(req.user!.userId);
    return sendSuccess(res, tickets);
  } catch (error) {
    logError('support.getMyTickets', error);
    return sendError(res, 500, 'Failed to fetch tickets', error);
  }
};

export const getAllTickets = async (req: AuthRequest, res: Response) => {
  try {
    const { page, limit } = parsePagination(req.query as Record<string, unknown>);
    const status = req.query.status as TicketStatus | undefined;
    const priority = req.query.priority as TicketPriority | undefined;

    const result = await supportService.getAllTickets({ status, priority, page, limit });
    return sendSuccess(res, result);
  } catch (error) {
    logError('support.getAllTickets', error);
    return sendError(res, 500, 'Failed to fetch tickets', error);
  }
};

export const getTicketById = async (req: AuthRequest, res: Response) => {
  try {
    const ticket = await supportService.getTicketById(req.params.id);
    if (!ticket) return sendError(res, 404, 'Ticket not found');
    return sendSuccess(res, ticket);
  } catch (error) {
    logError('support.getTicketById', error);
    return sendError(res, 500, 'Failed to fetch ticket', error);
  }
};

export const assignTicket = async (req: AuthRequest, res: Response) => {
  try {
    const { assigneeId } = req.body;
    if (!assigneeId) return sendError(res, 400, 'assigneeId required');

    const ticket = await supportService.assignTicket(req.params.id, assigneeId);
    return sendSuccess(res, ticket, 'Ticket assigned');
  } catch (error) {
    logError('support.assignTicket', error);
    const message = getErrorMessage(error, 'Failed to assign ticket');
    return sendError(res, 400, message, error);
  }
};

export const updateStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.body;
    const validStatuses: TicketStatus[] = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];
    if (!validStatuses.includes(status)) {
      return sendError(res, 400, `Invalid status. Valid: ${validStatuses.join(', ')}`);
    }

    const ticket = await supportService.updateTicketStatus(
      req.params.id,
      status as TicketStatus,
      req.user!.userId,
    );
    return sendSuccess(res, ticket, 'Ticket status updated');
  } catch (error) {
    logError('support.updateStatus', error);
    const message = getErrorMessage(error, 'Failed to update ticket');
    return sendError(res, 400, message, error);
  }
};
