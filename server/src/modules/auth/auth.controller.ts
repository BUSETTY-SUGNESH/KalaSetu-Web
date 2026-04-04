import { CookieOptions, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { UserRole } from '@prisma/client';
import { prisma } from '../../config/db';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '../../utils/jwt';
import { z } from 'zod';
import { logError } from '../../utils/logger';
import { getErrorMessage, sendError, sendSuccess } from '../../utils/http';

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2),
  role: z
    .union([z.literal('BUYER'), z.literal('ARTIST'), z.literal('CUSTOMER')])
    .optional()
    .default('BUYER')
    .transform((r) => (r === 'CUSTOMER' ? 'BUYER' : r)),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const refreshCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

const clearRefreshCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
};

const serializeUser = (user: {
  id: string;
  email: string;
  name: string;
  role: string;
}) => ({
  id: user.id,
  email: user.email,
  name: user.name,
  role: user.role === 'CUSTOMER' ? 'BUYER' : user.role,
});

export const signup = async (req: Request, res: Response) => {
  try {
    const { email, password, name, role } = signupSchema.parse(req.body);

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return sendError(res, 400, 'User already exists');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          email,
          passwordHash,
          name,
          role: role as UserRole,
        },
      });

      await tx.wallet.create({
        data: {
          userId: createdUser.id,
        },
      });

      if (role === 'ARTIST') {
        await tx.artist.create({
          data: {
            userId: createdUser.id,
          },
        });
      }

      return createdUser;
    });

    const accessToken = generateAccessToken(user.id, user.role);
    const refreshToken = generateRefreshToken(user.id);

    res.cookie('refreshToken', refreshToken, refreshCookieOptions);

    return sendSuccess(
      res,
      {
        user: serializeUser(user),
        accessToken,
      },
      'Signup successful',
      201,
    );
  } catch (error: unknown) {
    logError('auth.signup', error);
    const message = getErrorMessage(error, 'Signup failed');
    return sendError(res, 400, message, error);
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return sendError(res, 401, 'Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return sendError(res, 401, 'Invalid credentials');
    }

    await prisma.wallet.upsert({
      where: { userId: user.id },
      update: {},
      create: { userId: user.id },
    });

    const accessToken = generateAccessToken(user.id, user.role);
    const refreshToken = generateRefreshToken(user.id);

    res.cookie('refreshToken', refreshToken, refreshCookieOptions);

    return sendSuccess(
      res,
      {
        user: serializeUser(user),
        accessToken,
      },
      'Login successful',
    );
  } catch (error: unknown) {
    logError('auth.login', error);
    const message = getErrorMessage(error, 'Login failed');
    return sendError(res, 400, message, error);
  }
};

export const logout = async (_req: Request, res: Response) => {
  try {
    res.clearCookie('refreshToken', clearRefreshCookieOptions);
    return sendSuccess(res, null, 'Logged out successfully');
  } catch (error: unknown) {
    logError('auth.logout', error);
    return sendError(res, 500, 'Logout failed', error);
  }
};

export const refreshToken = async (req: Request, res: Response) => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) {
      return sendError(res, 401, 'Refresh token missing');
    }

    const decoded = verifyRefreshToken(token);

    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user) {
      return sendError(res, 401, 'User not found');
    }

    const accessToken = generateAccessToken(user.id, user.role);
    return sendSuccess(res, { accessToken }, 'Access token refreshed');
  } catch (error: unknown) {
    logError('auth.refreshToken', error);
    res.clearCookie('refreshToken', clearRefreshCookieOptions);
    return sendError(res, 401, 'Invalid refresh token', error);
  }
};
