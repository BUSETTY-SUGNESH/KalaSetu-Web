import express from 'express';
import cors, { CorsOptions } from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

import authRoutes from './modules/auth/auth.routes';
import artworkRoutes from './modules/artworks/artworks.routes';
import userRoutes from './modules/users/users.routes';
import orderRoutes from './modules/orders/orders.routes';
import bidRoutes from './modules/bids/bids.routes';
import paymentRoutes from './modules/payments/payments.routes';
import eventRoutes from './modules/events/events.routes';
import discussionRoutes from './modules/discussions/discussions.routes';

import { validateEnv } from './utils/validateEnv';

dotenv.config();
validateEnv();

const app = express();
const prisma = new PrismaClient();
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

// Basic health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'KalaSetu API is running' });
});

app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`Server is running on http://localhost:${PORT} (and LAN)`);
});

export { prisma };
