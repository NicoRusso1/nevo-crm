import type { RequestHandler } from 'express';
import { randomUUID } from 'node:crypto';

/**
 * Attaches a unique request id to each incoming request and echoes it back as
 * an `X-Request-Id` response header. Useful for tracing logs across services.
 *
 * If the client supplies an `X-Request-Id` header, it is respected — otherwise
 * a fresh UUID v4 is generated.
 */
export const requestId: RequestHandler = (req, res, next): void => {
  const incoming = req.header('x-request-id');
  const id = incoming && incoming.length <= 128 ? incoming : randomUUID();
  req.id = id;
  res.setHeader('X-Request-Id', id);
  next();
};
