/**
 * Scheduled cleanup jobs.
 *
 * - Removes expired refresh tokens (no longer usable, just take up space).
 * - Removes used or expired password reset tokens older than 24 hours.
 *
 * Runs daily at 03:00 server time.
 */

const cron = require('node-cron');
const prisma = require('../utils/prisma');
const { getLogger } = require('../utils/logger');
const {
  cleanupExpiredChatPendingUploads,
  reconcileOrphanChatPendingFiles,
} = require('../services/chatPendingUploadService');

const log = getLogger('jobs:cleanup');

async function cleanupExpiredRefreshTokens() {
  const now = new Date();
  const result = await prisma.refreshToken.deleteMany({
    where: { expiresAt: { lt: now } },
  });
  return result.count;
}

async function cleanupOldPasswordResetTokens() {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
  // Remove tokens that are either expired more than 24h ago, or already used more than 24h ago.
  const result = await prisma.passwordResetToken.deleteMany({
    where: {
      OR: [
        { expiresAt: { lt: cutoff } },
        { usedAt: { lt: cutoff } },
      ],
    },
  });
  return result.count;
}

async function runCleanup() {
  try {
    const refreshDeleted = await cleanupExpiredRefreshTokens();
    const resetDeleted = await cleanupOldPasswordResetTokens();
    const pendingDeleted = await cleanupExpiredChatPendingUploads();
    const orphanFilesRemoved = await reconcileOrphanChatPendingFiles();
    log.info('Cleanup completed', {
      refreshDeleted,
      resetDeleted,
      pendingDeleted,
      orphanFilesRemoved,
    });
  } catch (error) {
    log.error('Cleanup failed', { error: error.message, stack: error.stack });
  }
}

let scheduledTask = null;

function startCleanupJob() {
  if (scheduledTask) {
    log.warn('Cleanup job already started');
    return scheduledTask;
  }
  // Daily at 03:00
  scheduledTask = cron.schedule('0 3 * * *', runCleanup, {
    scheduled: true,
    timezone: process.env.TZ || 'Asia/Jakarta',
  });
  log.info('Cleanup job scheduled (daily at 03:00)');
  return scheduledTask;
}

function stopCleanupJob() {
  if (scheduledTask) {
    scheduledTask.stop();
    scheduledTask = null;
    log.info('Cleanup job stopped');
  }
}

module.exports = {
  startCleanupJob,
  stopCleanupJob,
  runCleanup,
  cleanupExpiredRefreshTokens,
  cleanupOldPasswordResetTokens,
  cleanupExpiredChatPendingUploads,
  reconcileOrphanChatPendingFiles,
};
