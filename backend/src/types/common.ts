/**
 * Common cross-cutting types used by services/controllers.
 */

export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface PaginatedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export type Maybe<T> = T | null | undefined;

export type AsyncResult<T> = Promise<T>;
