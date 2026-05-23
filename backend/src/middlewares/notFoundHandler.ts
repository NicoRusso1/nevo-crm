import type { RequestHandler } from 'express';
import { ApiError } from '../utils/ApiError';

/**
 * 404 catch-all. Mount AFTER all real routes; it forwards to the error handler
 * so the response shape stays consistent with the rest of the API.
 */
export const notFoundHandler: RequestHandler = (req, _res, next): void => {
  next(ApiError.notFound(`Route ${req.method} ${req.originalUrl} not found`));
};
