import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';

const sendAuthError = (res: Response, statusCode: number, message: string, error?: unknown) => {
  if (typeof error !== 'undefined') {
    console.error('ERROR:', error);
  }

  return res.status(statusCode).json({
    success: false,
    data: null,
    message,
    error: message,
  });
};

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    role: string;
  };
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return sendAuthError(res, 401, 'Authorization token required');
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return sendAuthError(res, 401, 'Authorization token required');
  }

  try {
    const decoded = verifyAccessToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    return sendAuthError(res, 401, 'Invalid or expired token', error);
  }
};

export const authorize = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return sendAuthError(res, 403, 'Access denied');
    }
    next();
  };
};

/** Like authenticate but does not reject — just attaches user if token is valid. */
export const optionalAuth = (req: AuthRequest, _res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    if (token) {
      try {
        req.user = verifyAccessToken(token);
      } catch {
        /* ignore invalid token — treat as anonymous */
      }
    }
  }
  next();
};
