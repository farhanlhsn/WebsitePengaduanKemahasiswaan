const chatServices = require('../services/chatServices');
const ResponseFormatter = require('../utils/responseFormatter');
const { getLogger } = require('../utils/logger');
const log = getLogger('chat:controller');

class ChatControllers {
  // Get messages for a specific report
  async getMessages(req, res) {
    try {
      const { reportId } = req.params;
      const { page = 1, limit = 50 } = req.query;
      
      log.info('Get messages', { reportId, page, limit });
      const result = await chatServices.getMessagesByReportId(
        reportId, 
        parseInt(page), 
        parseInt(limit)
      );
      
      res.json(ResponseFormatter.success(result, 'Messages retrieved successfully'));
    } catch (error) {
      log.warn('Get messages failed', { error: error.message });
      res.status(400).json(ResponseFormatter.error(error.message));
    }
  }

  // Send a new message
  async sendMessage(req, res) {
    try {
      const { reportId } = req.params;
      const { content, attachments, replyToId } = req.body;
      const senderId = req.user.userId;

      const messageData = {
        content,
        senderId,
        reportId,
        attachments: attachments || [],
        replyToId
      };

      log.info('Send message', { reportId, senderId });
      const message = await chatServices.sendMessage(messageData);
      
      // Emit to Socket.IO room
      const io = req.app.get('io');
      if (io) {
        // Prepare payload with timestamp
        const payload = {
          ...message,
          timestamp: new Date().toISOString()
        };
        // Emit to the specific report room for active chats
        io.to(`report_${reportId}`).emit('newMessage', payload);
        // Also broadcast globally so chat lists update instantly for other users
        io.emit('newMessage', payload);
      }

      res.status(201).json(ResponseFormatter.success(message, 'Message sent successfully'));
    } catch (error) {
      log.warn('Send message failed', { error: error.message });
      res.status(400).json(ResponseFormatter.error(error.message));
    }
  }

  // Mark messages as read
  async markAsRead(req, res) {
    try {
      const { reportId } = req.params;
      const userId = req.user.userId;

      // Mark messages as read and get the result
      log.info('Mark messages as read', { reportId, userId });
      const result = await chatServices.markMessagesAsRead(reportId, userId);
      
      // Emit read status to Socket.IO room
      const io = req.app.get('io');
      if (io) {
        io.to(`report_${reportId}`).emit('messagesRead', {
          reportId,
          userId,
          timestamp: new Date().toISOString()
        });
      }

      // Return success without data payload
      res.json({
        status: 'success',
        statusCode: 200,
        message: 'Messages marked as read',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      log.warn('Mark as read failed', { error: error.message });
      res.status(400).json(ResponseFormatter.error(error.message));
    }
  }

  // Get unread message count
  async getUnreadCount(req, res) {
    try {
      const userId = req.user.userId;
      log.info('Get unread count', { userId });
      const result = await chatServices.getUnreadMessageCount(userId);
      
      res.json(ResponseFormatter.success(result, 'Unread count retrieved'));
    } catch (error) {
      log.warn('Get unread count failed', { error: error.message });
      res.status(400).json(ResponseFormatter.error(error.message));
    }
  }

  // Get reports with messages (chat list)
  async getReportsWithMessages(req, res) {
    try {
      const userId = req.user.userId;
      const { page = 1, limit = 20 } = req.query;
      
      log.info('Get reports with messages', { userId, page, limit });
      const result = await chatServices.getReportsWithMessages(
        userId, 
        parseInt(page), 
        parseInt(limit)
      );
      
      // Build a streamlined payload for chat list
      const { reports, pagination } = result;
      const chatReports = reports.map(r => ({
        id: r.id,
        registrationNumber: r.registrationNumber,
        title: r.title,
        status: r.status,
        user: { name: r.user.name },
        lastMessage: r.lastMessage
          ? {
              content: r.lastMessage.content,
              createdAt: r.lastMessage.createdAt,
              senderRole: r.lastMessage.sender.role
            }
          : null,
        unreadCount: r.unreadCount
      }));
      res.json(ResponseFormatter.success({ reports: chatReports, pagination }, 'Chat list retrieved successfully'));
    } catch (error) {
      log.warn('Get reports with messages failed', { error: error.message });
      res.status(400).json(ResponseFormatter.error(error.message));
    }
  }

  // Delete a message
  async deleteMessage(req, res) {
    try {
      const { messageId } = req.params;
      const userId = req.user.userId;

      log.info('Delete message', { messageId, userId });
      await chatServices.deleteMessage(messageId, userId);
      
      // Emit delete event to Socket.IO
      const io = req.app.get('io');
      if (io) {
        // You might want to emit to specific room based on report ID
        // For now, we'll emit a general message delete event
        io.emit('messageDeleted', {
          messageId,
          deletedBy: userId,
          timestamp: new Date().toISOString()
        });
      }

      res.json(ResponseFormatter.success('Message deleted successfully'));
    } catch (error) {
      log.warn('Delete message failed', { error: error.message });
      res.status(400).json(ResponseFormatter.error(error.message));
    }
  }

  // Join chat room (for Socket.IO)
  async joinRoom(req, res) {
    try {
      const { reportId } = req.params;
      const userId = req.user.userId;

      // Verify user has access to this report
      const user = await require('../utils/prisma').user.findUnique({
        where: { id: userId },
        select: { role: true }
      });

      const report = await require('../utils/prisma').report.findUnique({
        where: { id: parseInt(reportId) },
        select: { userId: true }
      });

      if (!report) {
        return res.status(404).json(ResponseFormatter.error('Report not found'));
      }

      // Check permission
      if (user.role !== 'ADMIN' && report.userId !== userId) {
        return res.status(403).json(ResponseFormatter.error('Unauthorized access to this chat'));
      }

      res.json(ResponseFormatter.success('Room access granted', {
        roomId: `report_${reportId}`,
        reportId,
        userId
      }));
    } catch (error) {
      log.warn('Join room failed', { error: error.message });
      res.status(400).json(ResponseFormatter.error(error.message));
    }
  }

  // Upload a chat attachment file
  async uploadFile(req, res) {
    try {
      const files = req.files;
      if (!files || !files.length) {
        return res.status(400).json(ResponseFormatter.error('No file uploaded', 400));
      }
      // Build metadata array
      const attachments = files.map(file => {
        // Compute public file path
        const rel = file.path.split('uploads')[1];
        const filePath = '/uploads' + rel.replace(/\\/g, '/');
        return {
          fileName: file.originalname,
          fileType: file.mimetype,
          filePath
        };
      });
      // Return the attachment metadata; actual DB save occurs when sending message
      res.status(201).json(ResponseFormatter.success({ attachments }, 'File uploaded successfully'));
    } catch (error) {
      log.warn('Upload file failed', { error: error.message });
      res.status(400).json(ResponseFormatter.error(error.message));
    }
  }
}

module.exports = new ChatControllers();
