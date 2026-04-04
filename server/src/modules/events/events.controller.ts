import { Request, Response } from 'express';
import { EventType } from '@prisma/client';
import { prisma } from '../../config/db';
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
