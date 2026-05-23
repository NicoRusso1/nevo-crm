import path from 'node:path';
import express, { type Application } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import morgan from 'morgan';

import { corsOptions, env, globalRateLimiter, isProduction } from './config';
import { requestId } from './middlewares/requestId';
import { errorHandler } from './middlewares/errorHandler';
import { notFoundHandler } from './middlewares/notFoundHandler';
import { root } from './controllers/health.controller';
import apiRouter from './routes';

/**
 * Build and return the Express application.
 *
 * Kept as a factory (rather than a top-level singleton) so tests can spin up
 * isolated app instances and the entry point (`server.ts`) stays minimal.
 */
export function createApp(): Application {
  const app = express();

  // Trust first proxy (load balancer / reverse proxy). Required for correct
  // client IP detection by rate-limiter and logs in production deployments.
  app.set('trust proxy', 1);
  app.disable('x-powered-by');

  // ── Security & infra middleware ────────────────────────────────────────────
  // helmet's default CSP blocks cross-origin <img> loading of /uploads from
  // the frontend dev server. crossOriginResourcePolicy allows it.
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );
  app.use(cors(corsOptions));
  app.use(compression());
  app.use(requestId);

  // ── Logging ────────────────────────────────────────────────────────────────
  app.use(morgan(isProduction ? 'combined' : 'dev'));

  // ── Body parsing ───────────────────────────────────────────────────────────
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  // ── Static uploads (avatars, etc.) ─────────────────────────────────────────
  // Served from <cwd>/uploads. Multer writes here from `middlewares/upload.ts`.
  // In production, swap for an object-storage CDN and drop this line.
  app.use(
    '/uploads',
    express.static(path.join(process.cwd(), 'uploads'), {
      fallthrough: true,
      maxAge: isProduction ? '7d' : 0,
    }),
  );

  // ── Rate limiting (apply to API surface only) ──────────────────────────────
  app.use(env.API_PREFIX, globalRateLimiter);

  // ── Routes ─────────────────────────────────────────────────────────────────
  app.get('/', root);
  app.use(env.API_PREFIX, apiRouter);

  // ── 404 + error handler (must be last) ─────────────────────────────────────
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
