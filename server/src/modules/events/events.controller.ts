import { Request, Response } from 'express';
import { EventType } from '@prisma/client';
import { prisma } from '../../config/db';
import { AuthRequest } from '../../middleware/auth.middleware';
import { logError } from '../../utils/logger';
import {
  parsePagination,
  parseSort,
  parseSortOrder,
  parseUuidParam,
  sendError,
  sendSuccess,
} from '../../utils/http';

export const getEvents = async (req: Request, res: Response) => {
  try {
    const requestedType = req.query.type ? String(req.query.type).toUpperCase() : undefined;
    const allowedTypes = new Set<EventType>(['COMPETITION', 'WORKSHOP', 'EXHIBITION']);
    const type = requestedType && allowedTypes.has(requestedType as EventType) ? (requestedType as EventType) : undefined;
    const { limit, skip } = parsePagination(req.query as Record<string, unknown>);
    const requestedSort = parseSort(req.query.sort, ['createdAt', 'startsAt', 'endsAt', 'fee', 'title'], 'createdAt');
    const sort = requestedSort === 'createdAt' ? 'startsAt' : requestedSort;
    const order = parseSortOrder(req.query.order, 'asc');

    const events = await prisma.event.findMany({
      where: type ? { type } : undefined,
      include: {
        _count: {
          select: {
            registrations: true,
          },
        },
      },
      orderBy: {
        [sort]: order,
      } as any,
      skip,
      take: limit,
    });

    return sendSuccess(
      res,
      events.map((event) => ({
        ...event,
        registeredCount: event._count.registrations,
      })),
      'Events fetched',
    );
  } catch (error: unknown) {
    logError('events.getEvents', error, { query: req.query });
    return sendError(res, 500, 'Failed to fetch events', error);
  }
};

export const getEventById = async (req: Request, res: Response) => {
  const eventId = parseUuidParam(req.params.id);
  if (!eventId) {
    return sendError(res, 400, 'Invalid event id');
  }

  try {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        _count: {
          select: {
            registrations: true,
          },
        },
      },
    });

    if (!event) {
      return sendError(res, 404, 'Event not found');
    }

    return sendSuccess(res, {
      ...event,
      registeredCount: event._count.registrations,
    }, 'Event fetched');
  } catch (error: unknown) {
    logError('events.getEventById', error, { eventId });
    return sendError(res, 500, 'Failed to fetch event', error);
  }
};

export const registerForEvent = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    return sendError(res, 401, 'Authentication required');
  }

  const eventId = parseUuidParam(req.params.id);
  if (!eventId) {
    return sendError(res, 400, 'Invalid event id');
  }

  try {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: { _count: { select: { registrations: true } } },
    });

    if (!event) {
      return sendError(res, 404, 'Event not found');
    }

    if (event.maxParticipants && event._count.registrations >= event.maxParticipants) {
      return sendError(res, 400, 'Event is full');
    }

    const existing = await prisma.eventRegistration.findFirst({
      where: { eventId, userId },
    });

    if (existing) {
      return sendError(res, 400, 'Already registered for this event');
    }

    const registration = await prisma.eventRegistration.create({
      data: { eventId, userId },
    });

    return sendSuccess(res, registration, 'Registered successfully', 201);
  } catch (error: unknown) {
    logError('events.registerForEvent', error, { eventId, userId });
    return sendError(res, 500, 'Failed to register for event', error);
  }
};

export const getMyRegistration = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    return sendError(res, 401, 'Authentication required');
  }

  const eventId = parseUuidParam(req.params.id);
  if (!eventId) {
    return sendError(res, 400, 'Invalid event id');
  }

  try {
    const registration = await prisma.eventRegistration.findFirst({
      where: { eventId, userId },
    });

    return sendSuccess(res, { registered: !!registration });
  } catch (error: unknown) {
    logError('events.getMyRegistration', error, { eventId, userId });
    return sendError(res, 500, 'Failed to check registration', error);
  }
};
