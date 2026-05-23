import type { Response } from 'express';
import { HTTP_STATUS } from '../config/constants';

/**
 * Standard JSON envelope returned by every endpoint.
 *
 * Keeping a single shape means clients can deserialize uniformly and
 * middlewares can introspect responses without per-route knowledge.
 */
export interface SuccessResponse<T> {
  success: true;
  data: T;
  meta?: ResponseMeta;
}

export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface ResponseMeta {
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  [key: string]: unknown;
}

export const ApiResponse = {
  ok<T>(res: Response, data: T, meta?: ResponseMeta): Response<SuccessResponse<T>> {
    const body: SuccessResponse<T> = { success: true, data, ...(meta ? { meta } : {}) };
    return res.status(HTTP_STATUS.OK).json(body);
  },

  created<T>(res: Response, data: T, meta?: ResponseMeta): Response<SuccessResponse<T>> {
    const body: SuccessResponse<T> = { success: true, data, ...(meta ? { meta } : {}) };
    return res.status(HTTP_STATUS.CREATED).json(body);
  },

  accepted<T>(res: Response, data: T): Response<SuccessResponse<T>> {
    return res.status(HTTP_STATUS.ACCEPTED).json({ success: true, data } satisfies SuccessResponse<T>);
  },

  noContent(res: Response): Response {
    return res.status(HTTP_STATUS.NO_CONTENT).send();
  },

  paginated<T>(
    res: Response,
    items: T[],
    pagination: NonNullable<ResponseMeta['pagination']>,
  ): Response<SuccessResponse<T[]>> {
    return ApiResponse.ok(res, items, { pagination });
  },

  error(
    res: Response,
    statusCode: number,
    code: string,
    message: string,
    details?: unknown,
  ): Response<ErrorResponse> {
    const body: ErrorResponse = {
      success: false,
      error: { code, message, ...(details !== undefined ? { details } : {}) },
    };
    return res.status(statusCode).json(body);
  },
};
