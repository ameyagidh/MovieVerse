import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { env } from './config/env.js';
import authRoutes from './routes/authRoutes.js';
import moviesRoutes from './routes/moviesRoutes.js';
import watchlistRoutes from './routes/watchlistRoutes.js';
import reviewsRoutes from './routes/reviewsRoutes.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function createApp() {
  const app = express();

  app.use(
    helmet({
      // Poster images are same-origin static files, but keep this relaxed
      // rather than fighting CSP for a portfolio project's image tag.
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
  );
  app.use(cors({ origin: env.clientOrigin, credentials: true }));
  app.use(express.json());
  app.use(cookieParser());
  if (env.nodeEnv !== 'test') app.use(morgan('dev'));

  app.use('/posters', express.static(path.join(__dirname, '..', 'public', 'posters')));

  app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

  app.use('/api/auth', authRoutes);
  app.use('/api/movies', moviesRoutes);
  app.use('/api/watchlist', watchlistRoutes);
  app.use('/api/reviews', reviewsRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
