import type { CorsOptions } from 'cors';
import { env } from './env';

/**
 * CORS configuration.
 *
 * Reads CORS_ORIGIN from env. Supports:
 *   - "*"    → allow any origin
 *   - "a,b"  → comma-separated whitelist
 */
function parseOrigins(raw: string): string[] | '*' {
  const trimmed = raw.trim();
  if (trimmed === '*' || trimmed === '') return '*';
  return trimmed
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

const allowedOrigins = parseOrigins(env.CORS_ORIGIN);

export const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    if (allowedOrigins === '*' || !origin) {
      callback(null, true);
      return;
    }
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error(`CORS: origin "${origin}" is not allowed`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-Request-Id'],
  maxAge: 86400,
};
