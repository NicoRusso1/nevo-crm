import type { ErrorRequestHandler, NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { ApiError } from '../utils/ApiError';
import { ApiResponse } from '../utils/ApiResponse';
import { ERROR_CODES, HTTP_STATUS } from '../config/constants';
import { isProduction } from '../config/env';
import { logger } from '../lib/logger';

/**
 * Global error-handling middleware.
 *
 * Must be the LAST middleware registered on the app. Express identifies it by
 * its 4-argument signature, so all four params are required even if unused.
 */
export const errorHandler: ErrorRequestHandler = (
  err: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void => {
  // 1. Operational ApiError thrown by our own code.
  if (err instanceof ApiError) {
    logger.warn(`ApiError ${err.statusCode} on ${req.method} ${req.originalUrl}`, {
      code: err.code,
      message: err.message,
    });
    ApiResponse.error(res, err.statusCode, err.code, err.message, err.details);
    return;
  }

  // 2. Zod validation error (in case it bubbles up un-caught by validate middleware).
  if (err instanceof ZodError) {
    const details = err.issues.map((i) => ({
      path: i.path.join('.'),
      message: i.message,
      code: i.code,
    }));
    ApiResponse.error(
      res,
      HTTP_STATUS.UNPROCESSABLE_ENTITY,
      ERROR_CODES.VALIDATION_ERROR,
      'Validation failed',
      details,
    );
    return;
  }

  // 3. Prisma known request errors → translate common codes to HTTP.
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    const { statusCode, code, message } = mapPrismaError(err);
    logger.warn(`Prisma error on ${req.method} ${req.originalUrl}`, {
      prismaCode: err.code,
      message: err.message,
    });
    ApiResponse.error(res, statusCode, code, message, isProduction ? undefined : err.meta);
    return;
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    ApiResponse.error(
      res,
      HTTP_STATUS.BAD_REQUEST,
      ERROR_CODES.VALIDATION_ERROR,
      'Invalid database query',
      isProduction ? undefined : err.message,
    );
    return;
  }

  // 4. SyntaxError from express.json() on malformed payloads.
  if (err instanceof SyntaxError && 'body' in err) {
    ApiResponse.error(
      res,
      HTTP_STATUS.BAD_REQUEST,
      ERROR_CODES.VALIDATION_ERROR,
      'Malformed JSON in request body',
    );
    return;
  }

  // 5. Anything else is an unexpected programmer error.
  const message = err instanceof Error ? err.message : 'Unknown error';
  const stack = err instanceof Error ? err.stack : undefined;
  logger.error(`Unhandled error on ${req.method} ${req.originalUrl}`, { message, stack });

  ApiResponse.error(
    res,
    HTTP_STATUS.INTERNAL_SERVER_ERROR,
    ERROR_CODES.INTERNAL_ERROR,
    isProduction ? 'Internal server error' : message,
    isProduction ? undefined : stack,
  );
};

function mapPrismaError(err: Prisma.PrismaClientKnownRequestError): {
  statusCode: number;
  code: string;
  message: string;
} {
  switch (err.code) {
    case 'P2002':
      return {
        statusCode: HTTP_STATUS.CONFLICT,
        code: ERROR_CODES.CONFLICT,
        message: 'A record with these unique fields already exists',
      };
    case 'P2025':
      return {
        statusCode: HTTP_STATUS.NOT_FOUND,
        code: ERROR_CODES.NOT_FOUND,
        message: 'Record not found',
      };
    case 'P2003':
      return {
        statusCode: HTTP_STATUS.BAD_REQUEST,
        code: ERROR_CODES.VALIDATION_ERROR,
        message: 'Foreign key constraint failed',
      };
    default:
      return {
        statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
        code: ERROR_CODES.INTERNAL_ERROR,
        message: 'Database error',
      };
  }
}
