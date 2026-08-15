const chatServices = require('../services/chatServices');
const auditLogServices = require('../services/auditLogServices');
const ResponseFormatter = require('../utils/responseFormatter');
const { anonymizeChatMessage, shouldMaskReporter, socketIdentity } = require('../utils/anonymizer');
const { notifyChatListRefresh } = require('../utils/chatNotify');
const { ChatError } = require('../utils/chatErrors');
const { deleteFileFromDisk } = require('../utils/fileDisk');
const {
  createPendingUploadRecords,
  toPublicDto,
} = require('../services/chatPendingUploadService');
const { scheduleOfflineEmailNotification } = require('../services/chatOfflineNotificationService');
const { getLogger } = require('../utils/logger');

const log = getLogger('chat:controller');

function handleChatError(res, error) {
  if (error instanceof ChatError) {
    return res.status(error.statusCode).json({
      ...ResponseFormatter.error(error.message, error.statusCode),
      code: error.code,
    });
  }
  log.warn('Chat error', { error: error.message });
  return res.status(400).json(ResponseFormatter.error(error.message));
}

/**
 * Audit M5: pesan yang sudah dihapus tidak boleh meninggalkan jejak konten
 * di preview reply. Ganti isi replyTo yang terhapus dengan placeholder.
 */
function redactDeletedReply(message) {
  if (message?.replyTo?.deletedAt) {
    message.replyTo = {
      id: message.replyTo.id,
      content: '[pesan dihapus]',
      deleted: true,
      sender: null,
    };
  }
  return message;
}

class ChatControllers {
  async getMessages(req, res) {
    try {
      const { reportId } = req.params;
      const { page = 1, limit = 50 } = req.query;

      const result = await chatServices.getMessagesByReportId(
        reportId,
        parseInt(page),
        parseInt(limit),
        req.user.userId
      );

      const reportCtx = result.report;
      if (reportCtx) {
        for (const msg of result.messages) {
          redactDeletedReply(msg);
          anonymizeChatMessage(msg, reportCtx, req.user);
          if (msg.replyTo) {
            anonymizeChatMessage(msg.replyTo, reportCtx, req.user);
          }
        }
      }

      res.json(ResponseFormatter.success(result, 'Messages retrieved successfully'));
    } catch (error) {
      return handleChatError(res, error);
    }
  }

  async sendMessage(req, res) {
    try {
      const { reportId } = req.params;
      const { content, attachmentTokens = [], replyToId, clientMessageId, idempotencyKey } = req.body;
      const senderId = req.user.userId;

      const messageData = {
        content,
        senderId,
        reportId,
        attachmentTokens,
        replyToId,
        clientMessageId: clientMessageId || idempotencyKey || null,
      };

      const message = await chatServices.sendMessage(messageData, req.reportAccess);

      const reportCtx = message.report;
      const isReplay = message.replayed === true;
      delete message.report;
      delete message.replayed;
      redactDeletedReply(message);

      const io = req.app.get('io');
      // Audit M3: untuk replay idempoten, jangan memancarkan ulang event
      // socket maupun menjadwalkan email — pesan sudah terkirim sekali.
      if (!isReplay && io) {
        const basePayload = {
          ...message,
          reportId: parseInt(reportId),
          timestamp: new Date().toISOString(),
        };

        if (reportCtx?.isAnonymous && message.senderId === reportCtx.userId) {
          const anonPayload = JSON.parse(JSON.stringify(basePayload));
          anonymizeChatMessage(anonPayload, reportCtx, { userId: -1 });
          io.to(`report_${reportId}`).emit('chat:message', anonPayload);
        } else {
          io.to(`report_${reportId}`).emit('chat:message', basePayload);
        }

        notifyChatListRefresh(io, parseInt(reportId), { hasNew: true });
      }

      res.status(isReplay ? 200 : 201).json(
        ResponseFormatter.success(message, isReplay ? 'Message already sent' : 'Message sent successfully')
      );

      if (!isReplay) {
        scheduleOfflineEmailNotification({
          io,
          reportId,
          sender: { userId: senderId, role: req.user.role, name: req.user.name },
        });
      }
    } catch (error) {
      return handleChatError(res, error);
    }
  }

  async markAsRead(req, res) {
    try {
      const { reportId } = req.params;
      const userId = req.user.userId;

      await chatServices.markMessagesAsRead(reportId, userId, req.reportAccess);

      const io = req.app.get('io');
      if (io) {
        io.to(`report_${reportId}`).emit('chat:read', {
          reportId: parseInt(reportId),
          readByUserId: socketIdentity(req.reportAccess, req.user),
          timestamp: new Date().toISOString(),
        });
      }

      res.json({
        status: 'success',
        statusCode: 200,
        message: 'Messages marked as read',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      return handleChatError(res, error);
    }
  }

  async getUnreadCount(req, res) {
    try {
      const userId = req.user.userId;
      const result = await chatServices.getUnreadMessageCount(userId);
      res.json(ResponseFormatter.success(result, 'Unread count retrieved'));
    } catch (error) {
      return handleChatError(res, error);
    }
  }

  async getReportsWithMessages(req, res) {
    try {
      const userId = req.user.userId;
      const { page = 1, limit = 20 } = req.query;

      const result = await chatServices.getReportsWithMessages(
        userId,
        parseInt(page),
        parseInt(limit)
      );

      const { reports, pagination } = result;
      const chatReports = reports.map((r) => {
        const masked = shouldMaskReporter(r, req.user);
        const reporterName = masked ? 'Anonim' : r.user?.name;

        let lastMessage = null;
        if (r.lastMessage) {
          const lm = { ...r.lastMessage };
          if (masked && lm.senderId === r.userId) {
            lm.sender = lm.sender ? { ...lm.sender, name: 'Anonim' } : { name: 'Anonim' };
          }
          lastMessage = {
            content: lm.content,
            createdAt: lm.createdAt,
            senderRole: lm.sender?.role,
          };
        }

        return {
          id: r.id,
          registrationNumber: r.registrationNumber,
          title: r.title,
          status: r.status,
          isAnonymous: !!r.isAnonymous,
          user: { name: reporterName },
          lastMessage,
          unreadCount: r.unreadCount,
        };
      });

      res.json(ResponseFormatter.success({ reports: chatReports, pagination }, 'Chat list retrieved successfully'));
    } catch (error) {
      return handleChatError(res, error);
    }
  }

  async deleteMessage(req, res) {
    try {
      const { messageId } = req.params;

      const { reportId, report } = await chatServices.deleteMessage(messageId, req.user);

      // Audit L2: penghapusan pesan chat wajib tercatat.
      try {
        await auditLogServices.createAuditLog({
          entityType: 'REPORT',
          action: 'UPDATE',
          entityId: reportId,
          actorId: req.user.userId,
          actorName: req.user.name,
          actorRole: req.user.role,
          ip: req.ip,
          userAgent: req.headers['user-agent'],
          metadata: { operation: 'DELETE_CHAT_MESSAGE', messageId: parseInt(messageId) },
        });
      } catch (auditError) {
        log.error('Failed to create audit log for delete message', { error: auditError.message });
      }

      const io = req.app.get('io');
      if (io) {
        io.to(`report_${reportId}`).emit('chat:message:deleted', {
          messageId: parseInt(messageId),
          reportId,
          deletedBy: socketIdentity(report, req.user),
          timestamp: new Date().toISOString(),
        });
      }

      res.json(ResponseFormatter.success('Message deleted successfully'));
    } catch (error) {
      return handleChatError(res, error);
    }
  }

  async uploadFile(req, res) {
    const files = req.files;
    if (!files || !files.length) {
      return res.status(400).json(ResponseFormatter.error('No file uploaded', 400));
    }

    const writtenPaths = files.map((f) => f.path);
    const reportId = parseInt(req.params.reportId);
    const uploaderId = req.user.userId;

    try {
      const records = await createPendingUploadRecords(files, reportId, uploaderId);
      return res.status(201).json(
        ResponseFormatter.success(
          { attachments: records.map(toPublicDto) },
          'File uploaded successfully'
        )
      );
    } catch (error) {
      await Promise.allSettled(writtenPaths.map(deleteFileFromDisk));
      return handleChatError(res, error);
    }
  }
}

module.exports = new ChatControllers();
