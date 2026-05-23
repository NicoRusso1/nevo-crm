import type { Response } from 'express';
import { HTTP_STATUS } from '../config/constants';
import type { CursorPaginatedResult, PaginatedResult } from '../types/common';

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

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface CursorMeta {
  nextCursor: string | null;
  hasMore: boolean;
}

export interface ResponseMeta {
  pagination?: PaginationMeta;
  cursor?: CursorMeta;
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
    return res
      .status(HTTP_STATUS.ACCEPTED)
      .json({ success: true, data } satisfies SuccessResponse<T>);
  },

  noContent(res: Response): Response {
    return res.status(HTTP_STATUS.NO_CONTENT).send();
  },

  /**
   * Offset-paginated response. Pass the `PaginatedResult` returned by the
   * `paginate()` helper — items go to `data`, the rest to `meta.pagination`.
   *
   * `extraMeta` lets call sites tuck in sibling metadata (e.g. `unreadCount`
   * for notifications) without forking the envelope shape.
   */
  paginated<T>(
    res: Response,
    result: PaginatedResult<T>,
    extraMeta: Omit<ResponseMeta, 'pagination'> = {},
  ): Response<SuccessResponse<T[]>> {
    const pagination: PaginationMeta = {
      page: result.page,
      pageSize: result.pageSize,
      total: result.total,
      totalPages: result.totalPages,
      hasNextPage: result.hasNextPage,
      hasPreviousPage: result.hasPreviousPage,
    };
    return ApiResponse.ok(res, result.items, { pagination, ...extraMeta });
  },

  /** Cursor-paginated response. */
  cursorPaginated<T>(
    res: Response,
    result: CursorPaginatedResult<T>,
    extraMeta: Omit<ResponseMeta, 'cursor'> = {},
  ): Response<SuccessResponse<T[]>> {
    const cursor: CursorMeta = {
      nextCursor: result.nextCursor,
      hasMore: result.hasMore,
    };
    return ApiResponse.ok(res, result.items, { cursor, ...extraMeta });
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
