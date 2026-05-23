/**
 * Process entry point.
 *
 * Responsibilities:
 *   1. Boot the HTTP server.
 *   2. Wire process-level signal handlers for graceful shutdown.
 *   3. Catch otherwise-unhandled errors so the process fails loudly.
 *
 * Keep this file thin — all framework wiring lives in `app.ts`.
 */
import 'express';
import './types/express';

import http from 'node:http';

import { createApp } from './app';
import { env } from './config/env';
import { logger } from './lib/logger';
import { disconnectPrisma } from './lib/prisma';

const app = createApp();
const server = http.createServer(app);

server.listen(env.PORT, () => {
  logger.info(`🚀 ${env.APP_NAME} API listening on http://localhost:${env.PORT}`);
  logger.info(`   Environment : ${env.NODE_ENV}`);
  logger.info(`   API prefix  : ${env.API_PREFIX}`);
});

// ── Graceful shutdown ─────────────────────────────────────────────────────────

async function shutdown(signal: string): Promise<void> {
  logger.info(`Received ${signal}. Shutting down gracefully...`);

  // Stop accepting new connections.
  server.close(async (err) => {
    if (err) {
      logger.error('Error while closing HTTP server', { message: err.message });
      process.exit(1);
    }

    try {
      await disconnectPrisma();
      logger.info('Clean shutdown complete.');
      process.exit(0);
    } catch (e) {
      logger.error('Error disconnecting Prisma', {
        message: e instanceof Error ? e.message : String(e),
      });
      process.exit(1);
    }
  });

  // Force-exit if shutdown hangs (e.g. long-lived connections).
  setTimeout(() => {
    logger.error('Shutdown timed out — forcing exit.');
    process.exit(1);
  }, 10_000).unref();
}

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));

// ── Last-resort handlers ──────────────────────────────────────────────────────

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled promise rejection', {
    reason: reason instanceof Error ? reason.message : String(reason),
  });
});

process.on('uncaughtException', (err) => {
  logger.error('Uncaught exception', { message: err.message, stack: err.stack });
  // Uncaught exceptions leave the process in an undefined state — exit.
  process.exit(1);
});
