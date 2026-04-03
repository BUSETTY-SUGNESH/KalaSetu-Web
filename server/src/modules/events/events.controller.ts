import { Request, Response } from 'express';
import { EventType } from '@prisma/client';
import { prisma } from '../../index';
import { logError } from '../../utils/logger';

export const getEvents = async (req: Request, res: Response) => {
  try {
    const requestedType = req.query.type ? String(req.query.type).toUpperCase() : undefined;
    const allowedTypes = new Set<EventType>(['COMPETITION', 'WORKSHOP', 'EXHIBITION']);
    const type = requestedType && allowedTypes.has(requestedType as EventType) ? (requestedType as EventType) : undefined;

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
        startsAt: 'asc',
      },
    });

    res.json(
      events.map((event) => ({
        ...event,
        registeredCount: event._count.registrations,
      })),
    );
  } catch (error: unknown) {
    logError('events.getEvents', error, { query: req.query });
    res.status(500).json({ error: 'Failed to fetch events' });
  }
};

export const getEventById = async (req: Request, res: Response) => {
  const eventId = String(req.params.id);

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
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json({
      ...event,
      registeredCount: event._count.registrations,
    });
  } catch (error: unknown) {
    logError('events.getEventById', error, { eventId });
    res.status(500).json({ error: 'Failed to fetch event' });
  }
};
