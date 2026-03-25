const prisma = require('../utils/prisma');

class ChatServices {
  // Get messages for a specific report
  async getMessagesByReportId(reportId, page = 1, limit = 50) {
    try {
      const offset = (page - 1) * limit;
      
      const messages = await prisma.message.findMany({
        where: {
          reportId: parseInt(reportId),
          deletedAt: null
        },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              role: true
            }
          },
          attachments: {
            where: {
              deletedAt: null
            },
            select: {
              id: true,
              fileName: true,
              filePath: true,
              fileType: true,
              createdAt: true
            }
          }
        },
        orderBy: {
          createdAt: 'asc'
        },
        skip: offset,
        take: limit
      });

      const totalMessages = await prisma.message.count({
        where: {
          reportId: parseInt(reportId),
          deletedAt: null
        }
      });

      return {
        messages,
        pagination: {
          page,
          limit,
          total: totalMessages,
          totalPages: Math.ceil(totalMessages / limit)
        }
      };
    } catch (error) {
      throw new Error(`Failed to get messages: ${error.message}`);
    }
  }

  // Send a new message
  async sendMessage(data) {
    try {
      const { content, senderId, reportId, attachments = [] } = data;

      // Verify report exists and user has access
      const report = await prisma.report.findUnique({
        where: { id: parseInt(reportId) },
        include: {
          user: {
            select: { id: true, role: true }
          }
        }
      });

      if (!report) {
        throw new Error('Report not found');
      }

      // Check if user has permission to send message to this report
      const sender = await prisma.user.findUnique({
        where: { id: parseInt(senderId) },
        select: { id: true, role: true }
      });

      if (!sender) {
        throw new Error('Sender not found');
      }

      // Only report owner or admin can send messages
      if (sender.role !== 'ADMIN' && report.userId !== sender.id) {
        throw new Error('Unauthorized to send message to this report');
      }

      // Create message with transaction
      const result = await prisma.$transaction(async (tx) => {
        // Create message
        const message = await tx.message.create({
          data: {
            content,
            senderId: parseInt(senderId),
            reportId: parseInt(reportId)
          },
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                role: true
              }
            }
          }
        });

        // Create attachments if any
        if (attachments && attachments.length > 0) {
          const attachmentData = attachments.map(attachment => ({
            ...attachment,
            messageId: message.id,
            reportId: parseInt(reportId)
          }));

          await tx.attachment.createMany({
            data: attachmentData
          });

          // Get created attachments
          const createdAttachments = await tx.attachment.findMany({
            where: {
              messageId: message.id
            },
            select: {
              id: true,
              fileName: true,
              filePath: true,
              fileType: true,
              createdAt: true
            }
          });

          message.attachments = createdAttachments;
        } else {
          message.attachments = [];
        }

        return message;
      });

      return result;
    } catch (error) {
      throw new Error(`Failed to send message: ${error.message}`);
    }
  }

  // Mark messages as read
  async markMessagesAsRead(reportId, userId) {
    try {
      // Only mark messages as read that were not sent by the current user
      await prisma.message.updateMany({
        where: {
          reportId: parseInt(reportId),
          senderId: { not: parseInt(userId) },
          isRead: false
        },
        data: {
          isRead: true
        }
      });

      return { success: true };
    } catch (error) {
      throw new Error(`Failed to mark messages as read: ${error.message}`);
    }
  }

  // Get unread message count for a user
  async getUnreadMessageCount(userId) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: parseInt(userId) },
        select: { role: true }
      });

      if (!user) {
        throw new Error('User not found');
      }

      let whereClause = {
        isRead: false,
        senderId: { not: parseInt(userId) }
      };

      // If user is not admin, only count messages from their reports
      if (user.role !== 'ADMIN') {
        whereClause.report = {
          userId: parseInt(userId)
        };
      }

      const unreadCount = await prisma.message.count({
        where: whereClause
      });

      return { unreadCount };
    } catch (error) {
      throw new Error(`Failed to get unread count: ${error.message}`);
    }
  }

  // Get reports with latest messages (for chat list)
  async getReportsWithMessages(userId, page = 1, limit = 20) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: parseInt(userId) },
        select: { role: true }
      });

      if (!user) {
        throw new Error('User not found');
      }

      let whereClause = {
        deletedAt: null
      };

      // If user is not admin, only show their reports
      if (user.role !== 'ADMIN') {
        whereClause.userId = parseInt(userId);
      }

      const offset = (page - 1) * limit;

      const reports = await prisma.report.findMany({
        where: whereClause,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              role: true
            }
          },
          category: {
            select: {
              id: true,
              name: true
            }
          },
          messages: {
            orderBy: {
              createdAt: 'desc'
            },
            take: 1,
            include: {
              sender: {
                select: {
                  id: true,
                  name: true,
                  role: true
                }
              }
            }
          },
          _count: {
            select: {
              messages: {
                where: {
                  isRead: false,
                  senderId: { not: parseInt(userId) }
                }
              }
            }
          }
        },
        orderBy: [
          {
            messages: {
              _count: 'desc'
            }
          },
          {
            updatedAt: 'desc'
          }
        ],
        skip: offset,
        take: limit
      });

      const totalReports = await prisma.report.count({
        where: whereClause
      });

      return {
        reports: reports.map(report => ({
          ...report,
          lastMessage: report.messages[0] || null,
          unreadCount: report._count.messages,
          messages: undefined,
          _count: undefined
        })),
        pagination: {
          page,
          limit,
          total: totalReports,
          totalPages: Math.ceil(totalReports / limit)
        }
      };
    } catch (error) {
      throw new Error(`Failed to get reports with messages: ${error.message}`);
    }
  }

  // Delete a message (soft delete)
  async deleteMessage(messageId, userId) {
    try {
      // Check if message exists and user has permission
      const message = await prisma.message.findUnique({
        where: { id: parseInt(messageId) },
        include: {
          report: {
            select: {
              userId: true
            }
          },
          sender: {
            select: {
              id: true,
              role: true
            }
          }
        }
      });

      if (!message) {
        throw new Error('Message not found');
      }

      const user = await prisma.user.findUnique({
        where: { id: parseInt(userId) },
        select: { role: true }
      });

      // Only message sender or admin can delete
      if (message.senderId !== parseInt(userId) && user.role !== 'ADMIN') {
        throw new Error('Unauthorized to delete this message');
      }

      // Soft delete message
      await prisma.message.update({
        where: { id: parseInt(messageId) },
        data: {
          deletedAt: new Date()
        }
      });

      return { success: true };
    } catch (error) {
      throw new Error(`Failed to delete message: ${error.message}`);
    }
  }
}

module.exports = new ChatServices();
