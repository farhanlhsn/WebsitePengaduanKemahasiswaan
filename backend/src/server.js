// Validate environment variables before anything else
const { validateEnv } = require('./config/env');
validateEnv();

const { getLogger } = require('./utils/logger');
const log = getLogger('server');
const { app, attachSocket } = require('./app');
const prisma = require('./utils/prisma');
const { connectWithRetry } = require('./utils/prisma');
const { startCleanupJob, stopCleanupJob } = require('./jobs/cleanupJob');
const PORT = process.env.PORT || 6060;

connectWithRetry();

const server = app.listen(PORT, () => {
  log.info(`Server running on port ${PORT}`);
  log.info(`Base URL: http://localhost:${PORT}/api`);
});
attachSocket(server);

// Start scheduled cleanup jobs (skip in test env)
if (process.env.NODE_ENV !== 'test') {
  startCleanupJob();
}

// Hard limit on graceful shutdown — if we don't exit by then, force.
const SHUTDOWN_TIMEOUT_MS = 10_000;

let isShuttingDown = false;

const shutdown = async (signal) => {
  // Idempotent: ignore subsequent Ctrl+C presses while we're already shutting down.
  if (isShuttingDown) {
    log.info(`\nReceived ${signal} again — already shutting down. Press Ctrl+C once more to force exit.`);
    process.exit(1);
    return;
  }
  isShuttingDown = true;

  log.info(`\nReceived ${signal}, shutting down gracefully...`);

  // Safety net: if shutdown takes too long (idle Socket.IO clients,
  // hanging DB query, stuck cron tick), force exit.
  const forceExitTimer = setTimeout(() => {
    log.error(`Shutdown took longer than ${SHUTDOWN_TIMEOUT_MS}ms — forcing exit.`);
    process.exit(1);
  }, SHUTDOWN_TIMEOUT_MS);
  forceExitTimer.unref(); // don't keep the loop alive just because of this timer

  try {
    // 1) Stop accepting new HTTP requests.
    //    Wrap server.close() in a promise so we can await it.
    const closeHttp = new Promise((resolve) => {
      server.close((err) => {
        if (err) console.warn('server.close warning:', err.message);
        resolve();
      });
    });

    // 2) Disconnect Socket.IO clients explicitly. Without this,
    //    server.close() will hang on long-polling / websocket connections.
    const io = app.get('io');
    if (io) {
      try {
        // Close all sockets (true = also close underlying transports)
        io.close();
      } catch (err) {
        console.warn('io.close warning:', err.message);
      }
    }

    // 3) Stop scheduled cron jobs.
    try {
      stopCleanupJob();
    } catch (err) {
      console.warn('stopCleanupJob warning:', err.message);
    }

    // 4) Wait for HTTP server to drain (now that sockets are gone, this resolves quickly).
    await closeHttp;
    log.info('HTTP server closed');

    // 5) Disconnect Prisma last so any in-flight handlers above can finish their queries.
    await prisma.$disconnect();
    log.info('Prisma disconnected from database');

    clearTimeout(forceExitTimer);
    process.exit(0);
  } catch (error) {
    log.error('Error during shutdown:', error);
    clearTimeout(forceExitTimer);
    process.exit(1);
  }
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

// Surface late errors instead of letting the process linger silently.
process.on('uncaughtException', (err) => {
  log.error('Uncaught exception:', err);
  shutdown('uncaughtException');
});
process.on('unhandledRejection', (reason) => {
  log.error('Unhandled rejection:', reason);
});
