const prisma = require('../utils/prisma');
const { isAdmin, isStudent, isSuperAdmin } = require('../utils/rbac');
const { canDeleteChatMessage } = require('../utils/chatPolicies');
const { ChatError, chatError } = require('../utils/chatErrors');
const {
  validateAttachmentTokens,
  MAX_TOTAL_ATTACHMENT_SIZE,
  promotePendingToAttachment,
} = require('./chatPendingUploadService');

const MESSAGE_INCLUDE = {
  sender: { select: { id: true, name: true, role: true } },
  attachments: {
    where: { deletedAt: null },
    select: { id: true, fileName: true, filePath: true, fileType: true, createdAt: true },
  },
  replyTo: {
    select: {
      id: true,
      content: true,
      deletedAt: true,
      sender: { select: { name: true } },
    },
  },
  // Audit M2: read receipt per-user. Dibaca siapa saja pesan ini.
  reads: { select: { userId: true } },
};

/**
 * Hitung flag `isRead` relatif terhadap `viewerId` (read receipt per-user):
 *  - Pesan milik viewer      -> true bila pihak LAIN sudah membacanya.
 *  - Pesan dari pihak lain   -> true bila VIEWER sudah membacanya.
 * Mengganti semantics lama (flag tunggal bersama) yang membuat unread hilang
 * untuk semua admin begitu satu admin membaca.
 */
function computePerUserRead(message, viewerId) {
  const reads = Array.isArray(message.reads) ? message.reads : [];
  const uid = parseInt(viewerId);
  if (message.senderId === uid) {
    return reads.some((r) => r.userId !== uid);
  }
  return reads.some((r) => r.userId === uid);
}

class ChatServices {
  async getMessagesByReportId(reportId, page = 1, limit = 50, viewerId = null) {
    try {
      const offset = (page - 1) * limit;

      const report = await prisma.report.findFirst({
        where: { id: parseInt(reportId), deletedAt: null },
        select: { id: true, userId: true, isAnonymous: true },
      });

      if (!report) {
        throw chatError('ACCESS_DENIED', 403);
      }

      const messages = await prisma.message.findMany({
        where: { reportId: parseInt(reportId), deletedAt: null },
        include: MESSAGE_INCLUDE,
        orderBy: { createdAt: 'asc' },
        skip: offset,
        take: limit,
      });

      const totalMessages = await prisma.message.count({
        where: { reportId: parseInt(reportId), deletedAt: null },
      });

      // Audit M2: isRead kini dihitung per viewer, lalu field `reads` dibuang
      // agar payload tetap ramping dan bentuk response tidak berubah.
      const shapedMessages = messages.map((m) => {
        const { reads, ...rest } = m;
        return {
          ...rest,
          isRead: viewerId != null ? computePerUserRead({ ...rest, reads }, viewerId) : m.isRead,
        };
      });

      return {
        report,
        messages: shapedMessages,
        pagination: {
          page,
          limit,
          total: totalMessages,
          totalPages: Math.ceil(totalMessages / limit),
        },
      };
    } catch (error) {
      if (error instanceof ChatError) throw error;
      throw new Error(`Failed to get messages: ${error.message}`);
    }
  }

  async sendMessage(data, reportAccess) {
    if (!reportAccess) {
      throw new Error('reportAccess is required');
    }

    const reportId = parseInt(data.reportId);
    if (reportAccess.id !== reportId) {
      throw new Error('reportAccess mismatch');
    }

    const { content, senderId, attachmentTokens = [], replyToId, clientMessageId } = data;
    validateAttachmentTokens(attachmentTokens);

    if (clientMessageId) {
      const existing = await prisma.message.findFirst({
        where: {
          reportId,
          senderId: parseInt(senderId),
          clientMessageId: String(clientMessageId),
          deletedAt: null,
        },
        include: MESSAGE_INCLUDE,
      });
      if (existing) {
        const report = await prisma.report.findFirst({
          where: { id: reportId, deletedAt: null },
          select: { id: true, userId: true, isAnonymous: true, status: true },
        });
        existing.report = {
          id: report.id,
          userId: report.userId,
          isAnonymous: report.isAnonymous,
        };
        // Audit M3: tandai replay agar controller tidak memancarkan ulang
        // event socket / email notifikasi untuk pesan yang sama.
        existing.replayed = true;
        return existing;
      }
    }

    const report = await prisma.report.findFirst({
      where: { id: reportId, deletedAt: null },
      select: { id: true, userId: true, isAnonymous: true, status: true },
    });

    if (!report) {
      throw chatError('ACCESS_DENIED', 403);
    }

    const closedStatuses = ['RESOLVED', 'REJECTED', 'CANCELED'];
    if (closedStatuses.includes(report.status)) {
      throw new Error('Cannot send messages on a closed report. Status: ' + report.status);
    }

    const reportContext = {
      id: report.id,
      userId: report.userId,
      isAnonymous: report.isAnonymous,
    };

    let message;
    try {
      message = await prisma.$transaction(async (tx) => {
      // Audit M4: re-check status laporan DI DALAM transaksi — status bisa
      // berubah antara pengecekan awal dan insert (TOCTOU).
      const freshReport = await tx.report.findFirst({
        where: { id: reportId, deletedAt: null },
        select: { status: true },
      });
      if (!freshReport) {
        throw chatError('ACCESS_DENIED', 403);
      }
      if (closedStatuses.includes(freshReport.status)) {
        throw new Error('Cannot send messages on a closed report. Status: ' + freshReport.status);
      }

      const pendings = [];
      for (const token of attachmentTokens) {
        const pending = await tx.chatPendingUpload.findUnique({ where: { token } });
        if (!pending) throw chatError('INVALID_ATTACHMENT', 400);
        if (pending.expiresAt < new Date()) throw chatError('INVALID_ATTACHMENT', 400);
        if (pending.reportId !== reportId) throw chatError('INVALID_ATTACHMENT', 400);
        if (pending.uploaderId !== parseInt(senderId)) throw chatError('INVALID_ATTACHMENT', 400);
        pendings.push(pending);
      }

      const totalSize = pendings.reduce((sum, p) => sum + p.fileSize, 0);
      if (totalSize > MAX_TOTAL_ATTACHMENT_SIZE) {
        throw chatError('ATTACHMENT_TOO_LARGE', 400);
      }

      if (replyToId) {
        const replyTarget = await tx.message.findFirst({
          where: {
            id: parseInt(replyToId),
            reportId,
            deletedAt: null,
          },
        });
        if (!replyTarget) throw chatError('INVALID_REPLY', 400);
      }

      const created = await tx.message.create({
        data: {
          content,
          senderId: parseInt(senderId),
          reportId,
          ...(replyToId && { replyToId: parseInt(replyToId) }),
          ...(clientMessageId && { clientMessageId: String(clientMessageId) }),
        },
      });

      for (const pending of pendings) {
        await tx.attachment.create({
          data: {
            messageId: created.id,
            reportId,
            filePath: pending.filePath,
            fileName: pending.fileName,
            fileType: pending.fileType,
          },
        });
        await tx.chatPendingUpload.delete({ where: { id: pending.id } });
      }

      return { created, pendings };
      });
    } catch (txError) {
      // Audit M3: insert konkuren berbenturan pada unique constraint
      // [reportId, senderId, clientMessageId] — pesan dengan idempotency key
      // yang sama sudah dibuat request paralel. Kembalikan pesan existing
      // sebagai replay alih-alih error mentah.
      if (txError?.code === 'P2002' && clientMessageId) {
        const existing = await prisma.message.findFirst({
          where: {
            reportId,
            senderId: parseInt(senderId),
            clientMessageId: String(clientMessageId),
          },
          include: MESSAGE_INCLUDE,
        });
        if (existing) {
          existing.report = reportContext;
          existing.replayed = true;
          return existing;
        }
      }
      throw txError;
    }

    for (const pending of message.pendings) {
      const publicPath = await promotePendingToAttachment(pending);
      await prisma.attachment.updateMany({
        where: { messageId: message.created.id, filePath: pending.filePath },
        data: { filePath: publicPath },
      });
    }

    const fullMessage = await prisma.message.findUnique({
      where: { id: message.created.id },
      include: MESSAGE_INCLUDE,
    });

    fullMessage.report = reportContext;
    return fullMessage;
  }

  async markMessagesAsRead(reportId, userId, reportAccess) {
    if (!reportAccess) {
      throw new Error('reportAccess is required');
    }
    if (reportAccess.id !== parseInt(reportId)) {
      throw new Error('reportAccess mismatch');
    }

    try {
      const rid = parseInt(reportId);
      const uid = parseInt(userId);

      // Audit M2: tandai dibaca per-user via MessageRead (bukan flag isRead
      // bersama). Ambil pesan pihak lain yang BELUM dibaca user ini, lalu
      // buat baris MessageRead (skipDuplicates agar idempoten).
      const unread = await prisma.message.findMany({
        where: {
          reportId: rid,
          senderId: { not: uid },
          deletedAt: null,
          reads: { none: { userId: uid } },
        },
        select: { id: true },
      });

      if (unread.length > 0) {
        await prisma.messageRead.createMany({
          data: unread.map((m) => ({ messageId: m.id, userId: uid })),
          skipDuplicates: true,
        });
      }

      return { success: true };
    } catch (error) {
      throw new Error(`Failed to mark messages as read: ${error.message}`);
    }
  }

  async getUnreadMessageCount(userId) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: parseInt(userId) },
        select: { role: true },
      });

      if (!user) {
        throw new Error('User not found');
      }

      let reportFilter = {};

      if (isStudent(user)) {
        reportFilter = { userId: parseInt(userId) };
      } else if (user.role === 'ADMIN') {
        const assignments = await prisma.adminCategoryAssignment.findMany({
          where: { adminId: parseInt(userId) },
          select: { categoryId: true },
        });
        const ids = assignments.map((a) => a.categoryId);
        if (ids.length === 0) return { unreadCount: 0 };
        reportFilter = { categoryId: { in: ids } };
      }
      // SUPERADMIN: no filter

      const unreadCount = await prisma.message.count({
        where: {
          senderId: { not: parseInt(userId) },
          deletedAt: null,
          // Audit M2: unread per-user — pesan yang belum dibaca user ini.
          reads: { none: { userId: parseInt(userId) } },
          report: { deletedAt: null, ...reportFilter },
        },
      });

      return { unreadCount };
    } catch (error) {
      throw new Error(`Failed to get unread count: ${error.message}`);
    }
  }

  async getReportsWithMessages(userId, page = 1, limit = 20) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: parseInt(userId) },
        select: { role: true },
      });

      if (!user) {
        throw new Error('User not found');
      }

      let whereClause = { deletedAt: null };

      if (!isAdmin(user)) {
        whereClause.userId = parseInt(userId);
      } else if (user.role === 'ADMIN') {
        const assignments = await prisma.adminCategoryAssignment.findMany({
          where: { adminId: parseInt(userId) },
          select: { categoryId: true },
        });
        const ids = assignments.map((a) => a.categoryId);
        if (ids.length === 0) {
          return {
            reports: [],
            pagination: { page, limit, total: 0, totalPages: 0 },
          };
        }
        whereClause.categoryId = { in: ids };
      }

      const offset = (page - 1) * limit;

      const reports = await prisma.report.findMany({
        where: whereClause,
        select: {
          id: true,
          registrationNumber: true,
          title: true,
          status: true,
          isAnonymous: true,
          userId: true,
          updatedAt: true,
          user: { select: { id: true, name: true, role: true } },
          category: { select: { id: true, name: true } },
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: {
              id: true,
              content: true,
              createdAt: true,
              senderId: true,
              sender: { select: { id: true, name: true, role: true } },
            },
          },
          _count: {
            select: {
              messages: {
                where: {
                  senderId: { not: parseInt(userId) },
                  deletedAt: null,
                  // Audit M2: unread per-user.
                  reads: { none: { userId: parseInt(userId) } },
                },
              },
            },
          },
        },
        orderBy: [{ updatedAt: 'desc' }],
        skip: offset,
        take: limit,
      });

      const totalReports = await prisma.report.count({ where: whereClause });

      return {
        reports: reports.map((report) => ({
          ...report,
          lastMessage: report.messages[0] || null,
          unreadCount: report._count.messages,
          messages: undefined,
          _count: undefined,
        })),
        pagination: {
          page,
          limit,
          total: totalReports,
          totalPages: Math.ceil(totalReports / limit),
        },
      };
    } catch (error) {
      throw new Error(`Failed to get reports with messages: ${error.message}`);
    }
  }

  async deleteMessage(messageId, actor) {
    try {
      const message = await prisma.message.findFirst({
        where: { id: parseInt(messageId), deletedAt: null },
        select: {
          id: true,
          senderId: true,
          reportId: true,
          // Konteks anonimitas untuk masking event socket (audit C1).
          report: { select: { isAnonymous: true, userId: true } },
        },
      });

      if (!message) {
        throw chatError('ACCESS_DENIED', 403);
      }

      const deleteAccess = await canDeleteChatMessage(actor, message);
      if (!deleteAccess.allowed) {
        throw chatError('ACCESS_DENIED', 403);
      }

      await prisma.message.update({
        where: { id: message.id },
        data: { deletedAt: new Date() },
      });

      return {
        success: true,
        reportId: message.reportId,
        report: message.report,
      };
    } catch (error) {
      if (error.name === 'ChatError') throw error;
      throw new Error(`Failed to delete message: ${error.message}`);
    }
  }
}

module.exports = new ChatServices();
