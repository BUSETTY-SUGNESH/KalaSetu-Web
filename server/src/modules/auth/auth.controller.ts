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
    .union([
      z.literal('BUYER'),
      z.literal('ARTIST'),
      z.literal('CUSTOMER'),
      z.literal('ADMIN'),
      z.literal('MANAGER'),
      z.literal('SUPPORT'),
    ])
    .optional()
    .default('CUSTOMER')
    .transform((r) => (r === 'BUYER' ? 'CUSTOMER' : r)),
});

const adminCreateUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2),
  roles: z.array(
    z.enum(['CUSTOMER', 'ARTIST', 'DELIVERY', 'MANAGER', 'SUPPORT', 'ADMIN']),
  ).min(1),
});

const switchRoleSchema = z.object({
  role: z.enum(['CUSTOMER', 'BUYER', 'ARTIST', 'DELIVERY', 'MANAGER', 'SUPPORT', 'ADMIN']),
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
  roles?: string[];
}) => ({
  id: user.id,
  email: user.email,
  name: user.name,
  role: user.role,
  roles: user.roles || [user.role],
});

export const signup = async (req: Request, res: Response) => {
  try {
    const { email, password, name, role } = signupSchema.parse(req.body);

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return sendError(res, 400, 'User already exists');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const normalizedRole = role === 'BUYER' ? 'CUSTOMER' : role;
    const rolesArr: UserRole[] = [normalizedRole as UserRole];
    if (normalizedRole === 'ARTIST') rolesArr.push('CUSTOMER' as UserRole);

    const user = await prisma.$transaction(async (tx) => {
      let createdUser;
      try {
        createdUser = await tx.user.create({
          data: {
            email,
            passwordHash,
            name,
            role: normalizedRole as UserRole,
            roles: rolesArr,
          },
        });
      } catch {
        // roles column may not exist in DB yet — retry without it
        createdUser = await tx.user.create({
          data: {
            email,
            passwordHash,
            name,
            role: normalizedRole as UserRole,
          },
        });
      }

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
    const refreshTokenValue = generateRefreshToken(user.id);

    res.cookie('refreshToken', refreshTokenValue, refreshCookieOptions);

    return sendSuccess(
      res,
      {
        user: serializeUser({ ...user, roles: user.roles as string[] }),
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

    // Backfill roles for existing users without roles
    if (!user.roles || user.roles.length === 0) {
      const roles = [user.role];
      try {
        await prisma.user.update({ where: { id: user.id }, data: { roles } });
        user.roles = roles;
      } catch {
        // roles column may not exist yet; continue with derived value
        user.roles = roles;
      }
    }

    const accessToken = generateAccessToken(user.id, user.role);
    const refreshTokenValue = generateRefreshToken(user.id);

    res.cookie('refreshToken', refreshTokenValue, refreshCookieOptions);

    return sendSuccess(
      res,
      {
        user: serializeUser({ ...user, roles: user.roles as string[] }),
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

/** Switch active role — user must have the role in their roles array */
export const switchRole = async (req: Request & { user?: { userId: string } }, res: Response) => {
  try {
    const { role } = switchRoleSchema.parse(req.body);
    const userId = (req as any).user?.userId;
    if (!userId) return sendError(res, 401, 'Not authenticated');

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return sendError(res, 404, 'User not found');

    const normalizedRole = role === 'BUYER' ? 'CUSTOMER' : role;
    if (!user.roles.includes(normalizedRole as UserRole)) {
      return sendError(res, 403, `You do not have the ${role} role`);
    }

    await prisma.user.update({
      where: { id: userId },
      data: { role: normalizedRole as UserRole },
    });

    const accessToken = generateAccessToken(user.id, normalizedRole);
    const refreshTokenValue = generateRefreshToken(user.id);
    res.cookie('refreshToken', refreshTokenValue, refreshCookieOptions);

    return sendSuccess(res, {
      user: serializeUser({ ...user, role: normalizedRole, roles: user.roles as string[] }),
      accessToken,
    }, 'Role switched');
  } catch (error: unknown) {
    logError('auth.switchRole', error);
    const message = getErrorMessage(error, 'Role switch failed');
    return sendError(res, 400, message, error);
  }
};

/** Admin-only: create user with specific roles */
export const adminCreateUser = async (req: Request & { user?: { userId: string } }, res: Response) => {
  try {
    const { email, password, name, roles } = adminCreateUserSchema.parse(req.body);

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) return sendError(res, 400, 'User already exists');

    const passwordHash = await bcrypt.hash(password, 10);
    const primaryRole = roles[0] as UserRole;

    const user = await prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          email,
          passwordHash,
          name,
          role: primaryRole,
          roles: roles as UserRole[],
        },
      });

      await tx.wallet.create({ data: { userId: createdUser.id } });

      if (roles.includes('ARTIST')) {
        await tx.artist.create({ data: { userId: createdUser.id } });
      }

      return createdUser;
    });

    return sendSuccess(res, serializeUser({ ...user, roles: user.roles as string[] }), 'User created', 201);
  } catch (error: unknown) {
    logError('auth.adminCreateUser', error);
    const message = getErrorMessage(error, 'User creation failed');
    return sendError(res, 400, message, error);
  }
};
