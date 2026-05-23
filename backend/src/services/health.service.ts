import { prisma } from '../lib/prisma';
import { env } from '../config/env';

export interface HealthStatus {
  status: 'ok' | 'degraded';
  app: string;
  environment: string;
  uptime: number;
  timestamp: string;
  checks: {
    database: 'up' | 'down';
  };
}

/**
 * Lightweight liveness/readiness check. Probes the DB with a trivial query.
 */
export async function getHealthStatus(): Promise<HealthStatus> {
  let dbStatus: 'up' | 'down' = 'down';
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = 'up';
  } catch {
    dbStatus = 'down';
  }

  return {
    status: dbStatus === 'up' ? 'ok' : 'degraded',
    app: env.APP_NAME,
    environment: env.NODE_ENV,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    checks: { database: dbStatus },
  };
}
