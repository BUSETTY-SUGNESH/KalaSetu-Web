import express, { NextFunction, Request, Response } from 'express';
import cors, { CorsOptions } from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';

import authRoutes from './modules/auth/auth.routes';
import artworkRoutes from './modules/artworks/artworks.routes';
import userRoutes from './modules/users/users.routes';
import orderRoutes from './modules/orders/orders.routes';
import bidRoutes from './modules/bids/bids.routes';
import paymentRoutes from './modules/payments/payments.routes';
import eventRoutes from './modules/events/events.routes';
import discussionRoutes from './modules/discussions/discussions.routes';
import walletRoutes from './modules/wallet/wallet.routes';
import kycRoutes from './modules/kyc/kyc.routes';
import deliveryRoutes from './modules/delivery/delivery.routes';
import supportRoutes from './modules/support/support.routes';
import bidRequestRoutes from './modules/bid-requests/bid-requests.routes';
import { prisma } from './config/db';

import { validateEnv } from './config/env';

dotenv.config();
validateEnv();

const app = express();
const PORT = process.env.PORT || 5000;

const isProd = process.env.NODE_ENV === 'production';
const allowedProdOrigins = (process.env.FRONTEND_URL || 'http://localhost:3000')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

const corsOptions: CorsOptions = {
  credentials: true,
  origin: (origin, callback) => {
    if (!origin) {
      callback(null, true);
      return;
    }
    if (!isProd) {
      callback(null, origin);
      return;
    }
    if (allowedProdOrigins.includes(origin)) {
      callback(null, origin);
      return;
    }
    callback(new Error(`CORS blocked origin: ${origin}`));
  },
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/artworks', artworkRoutes);
app.use('/api/users', userRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/bids', bidRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/discussions', discussionRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/kyc', kycRoutes);
app.use('/api/delivery', deliveryRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/bid-requests', bidRequestRoutes);

// Basic health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    data: { status: 'ok' },
    message: 'KalaSetu API is running',
  });
});

app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    data: null,
    message: 'Route not found',
    error: 'Route not found',
  });
});

app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error('ERROR:', error);
  const message = error instanceof Error ? error.message : 'Internal server error';
  res.status(500).json({
    success: false,
    data: null,
    message: 'Internal server error',
    error: message,
  });
});

app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`Server is running on http://localhost:${PORT} (and LAN)`);
});

export { prisma };
