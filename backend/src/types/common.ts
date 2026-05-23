/**
 * Common cross-cutting types used by services/controllers.
 */

export interface PaginationParams {
  page: number;
  pageSize: number;
}

/**
 * Offset-pagination result.
 *
 * `hasNextPage` / `hasPreviousPage` are derived once in the service layer so
 * every consumer (HTTP, future GraphQL, tests) sees the same flags without
 * re-deriving from `page` and `totalPages`.
 */
export interface PaginatedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/**
 * Cursor-pagination result.
 *
 * `nextCursor` is opaque to the client — it's typically the id of the last
 * item but the server is free to encode it however it wants. `null` means
 * "no more pages".
 */
export interface CursorPaginatedResult<T> {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

export type Maybe<T> = T | null | undefined;

export type AsyncResult<T> = Promise<T>;
