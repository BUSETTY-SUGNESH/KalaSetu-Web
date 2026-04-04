import { Response } from 'express';
import { ZodError } from 'zod';

export const getErrorMessage = (error: unknown, fallback = 'Unexpected error'): string => {
  if (error instanceof ZodError) {
    return error.errors.map((item) => item.message).join(', ') || fallback;
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  if (typeof error === 'string' && error.trim()) {
    return error;
  }
  return fallback;
};

export const sendSuccess = <T>(
  res: Response,
  data: T,
  message?: string,
  statusCode = 200,
) => {
  return res.status(statusCode).json({
    success: true,
    data,
    ...(message ? { message } : {}),
  });
};

export const sendError = (
  res: Response,
  statusCode: number,
  message: string,
  error?: unknown,
) => {
  if (typeof error !== 'undefined') {
    console.error('ERROR:', error);
  }

  return res.status(statusCode).json({
    success: false,
    data: null,
    message,
    error: getErrorMessage(error, message),
  });
};

const toSingle = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
};

const toPositiveInt = (value: unknown, fallback: number): number => {
  const raw = toSingle(value);
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  const safe = Math.floor(parsed);
  return safe > 0 ? safe : fallback;
};

export const parsePagination = (query: Record<string, unknown>) => {
  const page = toPositiveInt(query.page, 1);
  const limit = Math.min(toPositiveInt(query.limit, 10), 100);

  return {
    page,
    limit,
    skip: (page - 1) * limit,
  };
};

export const parseSort = (
  value: unknown,
  allowedFields: string[],
  fallback: string,
) => {
  const raw = String(toSingle(value) || '').trim();
  if (!raw) {
    return fallback;
  }
  return allowedFields.includes(raw) ? raw : fallback;
};

export const parseSortOrder = (value: unknown, fallback: 'asc' | 'desc' = 'desc'): 'asc' | 'desc' => {
  const raw = String(toSingle(value) || '').toLowerCase();
  if (raw === 'asc' || raw === 'desc') {
    return raw;
  }
  return fallback;
};

export const parseUuidParam = (value: unknown): string | null => {
  const raw = String(toSingle(value) || '').trim();
  if (!raw) {
    return null;
  }

  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  return uuidRegex.test(raw) ? raw : null;
};
