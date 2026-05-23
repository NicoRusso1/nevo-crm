import { ERROR_CODES, HTTP_STATUS, type ErrorCode } from '../config/constants';

/**
 * Operational error thrown by services/controllers and caught by the global
 * error handler. Distinguishes expected failures (validation, not found, etc.)
 * from unexpected ones (bugs, crashes).
 */
export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly code: ErrorCode;
  public readonly details?: unknown;
  public readonly isOperational: boolean;

  constructor(
    statusCode: number,
    message: string,
    code: ErrorCode = ERROR_CODES.INTERNAL_ERROR,
    details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;

    Error.captureStackTrace?.(this, this.constructor);
  }

  static badRequest(message = 'Bad request', details?: unknown): ApiError {
    return new ApiError(HTTP_STATUS.BAD_REQUEST, message, ERROR_CODES.VALIDATION_ERROR, details);
  }

  static unauthorized(message = 'Unauthorized'): ApiError {
    return new ApiError(HTTP_STATUS.UNAUTHORIZED, message, ERROR_CODES.AUTHENTICATION_ERROR);
  }

  static forbidden(message = 'Forbidden'): ApiError {
    return new ApiError(HTTP_STATUS.FORBIDDEN, message, ERROR_CODES.AUTHORIZATION_ERROR);
  }

  static notFound(message = 'Resource not found'): ApiError {
    return new ApiError(HTTP_STATUS.NOT_FOUND, message, ERROR_CODES.NOT_FOUND);
  }

  static conflict(message = 'Conflict', details?: unknown): ApiError {
    return new ApiError(HTTP_STATUS.CONFLICT, message, ERROR_CODES.CONFLICT, details);
  }

  static unprocessable(message = 'Unprocessable entity', details?: unknown): ApiError {
    return new ApiError(
      HTTP_STATUS.UNPROCESSABLE_ENTITY,
      message,
      ERROR_CODES.VALIDATION_ERROR,
      details,
    );
  }

  static internal(message = 'Internal server error', details?: unknown): ApiError {
    return new ApiError(
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      message,
      ERROR_CODES.INTERNAL_ERROR,
      details,
    );
  }
}
