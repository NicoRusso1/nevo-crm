/**
 * Pagination helpers.
 *
 * Two strategies:
 *
 *   - `paginate()` — offset/limit (the classic page=1&pageSize=20). Best for
 *     UIs with a page picker. Cost grows linearly with `skip`; fine for
 *     datasets up to a few hundred thousand rows on indexed sorts.
 *
 *   - `paginateCursor()` — keyset-style. Best for infinite scroll, real-time
 *     timelines, and very large tables. Constant cost regardless of depth.
 *
 * Both wrap the boilerplate `findMany + count + math` pattern so services
 * call sites stay focused on the query.
 */
import type { Prisma } from '@prisma/client';

import { prisma } from '../lib/prisma';
import type { CursorPaginatedResult, PaginatedResult } from '../types/common';

// ── Offset pagination ───────────────────────────────────────────────────────

export interface OffsetPaginateArgs<T> {
  page: number;
  pageSize: number;
  /** Build the page query. Receives the resolved `skip` and `take`. */
  findMany: (skip: number, take: number) => Prisma.PrismaPromise<T[]>;
  /** Build the matching count query (same WHERE as findMany). */
  count: () => Prisma.PrismaPromise<number>;
}

/**
 * Runs `findMany` + `count` inside a single `$transaction` so the page and
 * its total stay consistent — no risk of off-by-N when rows are added between
 * queries on a busy table.
 */
export async function paginate<T>(args: OffsetPaginateArgs<T>): Promise<PaginatedResult<T>> {
  const skip = (args.page - 1) * args.pageSize;
  const [items, total] = await prisma.$transaction([
    args.findMany(skip, args.pageSize),
    args.count(),
  ]);
  return buildPagination(items, args.page, args.pageSize, total);
}

/**
 * Build a `PaginatedResult` from already-fetched items + total. Useful when
 * pagination data comes from a raw query or aggregate.
 */
export function buildPagination<T>(
  items: T[],
  page: number,
  pageSize: number,
  total: number,
): PaginatedResult<T> {
  const totalPages = total === 0 ? 0 : Math.ceil(total / pageSize);
  return {
    items,
    page,
    pageSize,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
}

// ── Cursor pagination ──────────────────────────────────────────────────────

export interface CursorPaginateArgs<T> {
  /** Opaque cursor from the previous response; `undefined` for the first page. */
  cursor: string | undefined;
  /** Page size. The helper fetches `take + 1` rows internally. */
  take: number;
  /**
   * Run the query. Implementations should:
   *   - apply `cursor` when defined (typically `cursor: { id: cursor }, skip: 1`)
   *   - fetch up to `internalTake` rows (the helper passes `take + 1`)
   *   - apply a stable `orderBy`
   */
  findMany: (cursor: string | undefined, internalTake: number) => Promise<T[]>;
  /** Extract the cursor value from an item. Usually `(item) => item.id`. */
  getCursor: (item: T) => string;
}

/**
 * Cursor-based pagination via the "fetch N+1" trick: ask for one extra row to
 * detect whether more exist, return only `take` to the caller.
 */
export async function paginateCursor<T>(
  args: CursorPaginateArgs<T>,
): Promise<CursorPaginatedResult<T>> {
  const fetched = await args.findMany(args.cursor, args.take + 1);
  const hasMore = fetched.length > args.take;
  const items = hasMore ? fetched.slice(0, args.take) : fetched;
  const last = items[items.length - 1];
  const nextCursor = hasMore && last ? args.getCursor(last) : null;
  return { items, nextCursor, hasMore };
}
