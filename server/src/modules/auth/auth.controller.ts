import { CookieOptions, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { ZodError } from 'zod';
import { UserRole } from '@prisma/client';
import { prisma } from '../../index';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '../../utils/jwt';
import { z } from 'zod';
import { logError } from '../../utils/logger';

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

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof ZodError) {
    return error.errors.map((item) => item.message).join(', ');
  }
  if (error instanceof Error) {
    return error.message;
  }
  return fallback;
};

export const signup = async (req: Request, res: Response) => {
  try {
    const { email, password, name, role } = signupSchema.parse(req.body);

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
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

    res.status(201).json({
      user: serializeUser(user),
      accessToken,
    });
  } catch (error: unknown) {
    logError('auth.signup', error);
    res.status(400).json({ error: getErrorMessage(error, 'Signup failed') });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    await prisma.wallet.upsert({
      where: { userId: user.id },
      update: {},
      create: { userId: user.id },
    });

    const accessToken = generateAccessToken(user.id, user.role);
    const refreshToken = generateRefreshToken(user.id);

    res.cookie('refreshToken', refreshToken, refreshCookieOptions);

    res.json({
      user: serializeUser(user),
      accessToken,
    });
  } catch (error: unknown) {
    logError('auth.login', error);
    res.status(400).json({ error: getErrorMessage(error, 'Login failed') });
  }
};

export const logout = async (_req: Request, res: Response) => {
  res.clearCookie('refreshToken', clearRefreshCookieOptions);
  res.json({ message: 'Logged out successfully' });
};

export const refreshToken = async (req: Request, res: Response) => {
  const token = req.cookies.refreshToken;
  if (!token) return res.status(401).json({ error: 'Refresh token missing' });

  try {
    const decoded = verifyRefreshToken(token);

    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user) return res.status(401).json({ error: 'User not found' });

    const accessToken = generateAccessToken(user.id, user.role);
    res.json({ accessToken });
  } catch (error: unknown) {
    logError('auth.refreshToken', error);
    res.clearCookie('refreshToken', clearRefreshCookieOptions);
    res.status(401).json({ error: 'Invalid refresh token' });
  }
};
