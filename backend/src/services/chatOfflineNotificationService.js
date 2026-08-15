const prisma = require('../utils/prisma');
const emailService = require('./emailService');
const { getLogger } = require('../utils/logger');

const log = getLogger('chat:offline-notification');

/**
 * Audit M6: cek apakah seorang admin masih punya akses ke kategori tertentu
 * (SUPERADMIN selalu ya; ADMIN butuh baris assignment aktif).
 */
async function hasCategoryAccess(adminId, categoryId) {
  if (!adminId || !categoryId) return false;
  const admin = await prisma.user.findUnique({
    where: { id: adminId },
    select: { role: true, deletedAt: true },
  });
  if (!admin || admin.deletedAt) return false;
  if (admin.role === 'SUPERADMIN') return true;
  if (admin.role !== 'ADMIN') return false;
  const assignment = await prisma.adminCategoryAssignment.findUnique({
    where: { adminId_categoryId: { adminId, categoryId } },
    select: { adminId: true },
  });
  return !!assignment;
}

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
      // Audit M6: pastikan admin yang di-assign masih berhak atas kategori
      // laporan ini (assignment bisa dicabut antara penugasan dan notifikasi).
      const stillAssigned = await hasCategoryAccess(
        reportDetails.assignedToId,
        reportDetails.categoryId
      );
      if (
        stillAssigned &&
        reportDetails.assignedTo &&
        !activeUserIdsInRoom.has(reportDetails.assignedToId)
      ) {
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
