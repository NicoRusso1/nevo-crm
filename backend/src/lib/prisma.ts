/**
 * Prisma Client singleton.
 *
 * In development, `tsx watch` reloads modules on file changes which would
 * otherwise create a new PrismaClient (and a new connection pool) on every
 * reload. We attach the instance to `globalThis` to survive HMR reloads.
 */
import { PrismaClient } from '@prisma/client';
import { isProduction } from '../config/env';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma: PrismaClient =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: isProduction ? ['error', 'warn'] : ['query', 'error', 'warn'],
    errorFormat: isProduction ? 'minimal' : 'pretty',
  });

if (!isProduction) {
  globalForPrisma.prisma = prisma;
}

/**
 * Gracefully disconnect from the database. Call from process shutdown hooks.
 */
export async function disconnectPrisma(): Promise<void> {
  await prisma.$disconnect();
}
