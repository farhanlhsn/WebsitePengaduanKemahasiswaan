const prisma = require('../utils/prisma');
const emailService = require('./emailService');
const { getLogger } = require('../utils/logger');

const log = getLogger('chat:offline-notification');

/**
 * Send email notifications to offline chat participants.
 * Runs fire-and-forget; errors are logged and never propagated to the caller.
 */
async function sendOfflineEmailNotification({ io, reportId, sender }) {
  try {
    const reportDetails = await prisma.report.findUnique({
      where: { id: parseInt(reportId) },
      select: {
        title: true,
        registrationNumber: true,
        userId: true,
        assignedToId: true,
        categoryId: true,
        isAnonymous: true,
        user: { select: { id: true, name: true, email: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
      },
    });

    if (!reportDetails) return;

    const activeUserIdsInRoom = new Set();
    if (io) {
      const roomSocketIds = io.sockets.adapter.rooms.get(`report_${reportId}`);
      if (roomSocketIds) {
        for (const socketId of roomSocketIds) {
          const s = io.sockets.sockets.get(socketId);
          if (s?.data?.user?.userId) {
            activeUserIdsInRoom.add(s.data.user.userId);
          }
        }
      }
    }

    const senderRole = sender.role;
    const isSenderAdmin = senderRole === 'ADMIN' || senderRole === 'SUPERADMIN';

    if (isSenderAdmin) {
      if (reportDetails.user && !activeUserIdsInRoom.has(reportDetails.userId)) {
        await emailService.notifyNewMessage(
          reportDetails.user.email,
          reportDetails.user.name,
          reportDetails.title,
          reportDetails.registrationNumber,
          sender.name,
          { isAnonymous: reportDetails.isAnonymous, senderRole }
        );
      }
    } else if (reportDetails.assignedToId) {
      if (reportDetails.assignedTo && !activeUserIdsInRoom.has(reportDetails.assignedToId)) {
        await emailService.notifyNewMessage(
          reportDetails.assignedTo.email,
          reportDetails.assignedTo.name,
          reportDetails.title,
          reportDetails.registrationNumber,
          sender.name,
          { isAnonymous: reportDetails.isAnonymous, senderRole }
        );
      }
    } else if (reportDetails.categoryId) {
      const categoryAssignments = await prisma.adminCategoryAssignment.findMany({
        where: { categoryId: reportDetails.categoryId },
        include: { admin: { select: { id: true, name: true, email: true } } },
      });

      for (const assignment of categoryAssignments) {
        if (assignment.admin && !activeUserIdsInRoom.has(assignment.adminId)) {
          await emailService.notifyNewMessage(
            assignment.admin.email,
            assignment.admin.name,
            reportDetails.title,
            reportDetails.registrationNumber,
            sender.name,
            { isAnonymous: reportDetails.isAnonymous, senderRole }
          );
        }
      }
    }
  } catch (err) {
    log.error('Failed to send offline chat email notification', { error: err.message });
  }
}

/**
 * Schedule offline notification without blocking the HTTP response.
 */
function scheduleOfflineEmailNotification(params) {
  setImmediate(() => {
    sendOfflineEmailNotification(params).catch((err) => {
      log.error('Unhandled offline notification error', { error: err.message });
    });
  });
}

module.exports = {
  sendOfflineEmailNotification,
  scheduleOfflineEmailNotification,
};
