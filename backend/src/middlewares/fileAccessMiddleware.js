const prisma = require('../utils/prisma');
const { isAdmin } = require('../utils/rbac');
const { canAccessReport } = require('../utils/accessPolicy');
const { getLogger } = require('../utils/logger');

const log = getLogger('middleware:fileAccess');

/**
 * Check if user owns the KTM file.
 * Admins are always granted access.
 */
async function checkKtmOwnership(req, res, next) {
  try {
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    // Admins can access any KTM
    if (isAdmin(req.user)) return next();

    // Extract filename from path: /ktm/filename.jpg
    const filename = req.path.replace('/ktm/', '');

    if (!filename) {
      return res.status(400).json({ error: 'Invalid file path' });
    }

    // Check if this KTM belongs to the requesting user
    const owner = await prisma.user.findFirst({
      where: {
        id: userId,
        ktmPath: { contains: filename }
      },
      select: { id: true }
    });

    if (!owner) {
      log.warn('KTM access denied', { userId, filename });
      return res.status(403).json({ error: 'Access denied to this file' });
    }

    next();
  } catch (error) {
    log.error('checkKtmOwnership error', { error: error.message });
    return res.status(500).json({ error: 'Server error during file access check' });
  }
}

/**
 * Check if user owns the report attachment.
 * Admins are always granted access.
 * Report owner can access their own report's attachments.
 */
async function checkReportAttachmentOwnership(req, res, next) {
  try {
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    // Admins can access any attachment
    // Extract filename from the end of the path
    const pathParts = req.path.split('/');
    const filename = pathParts[pathParts.length - 1];

    if (!filename) {
      return res.status(400).json({ error: 'Invalid file path' });
    }

    // Find the attachment and check if the report belongs to this user
    const attachment = await prisma.attachment.findFirst({
      where: {
        filePath: { contains: filename },
        messageId: null // Report attachments have no messageId
      },
      include: {
        report: { select: { id: true, userId: true, categoryId: true, status: true, deletedAt: true } }
      }
    });

    if (!attachment) {
      return res.status(404).json({ error: 'File not found' });
    }

    const access = await canAccessReport(req.user, attachment.report);
    if (!access.allowed) {
      log.warn('Report attachment access denied', { userId, filename });
      return res.status(403).json({ error: 'Access denied to this file' });
    }

    next();
  } catch (error) {
    log.error('checkReportAttachmentOwnership error', { error: error.message });
    return res.status(500).json({ error: 'Server error during file access check' });
  }
}

/**
 * Check if user is a participant in the chat thread that owns the attachment.
 * Admins are always granted access.
 * Report owner (student who filed the report) can access chat attachments.
 */
async function checkChatAttachmentOwnership(req, res, next) {
  try {
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    // Admins can access any chat attachment
    // Extract filename from the end of the path
    const pathParts = req.path.split('/');
    const filename = pathParts[pathParts.length - 1];

    if (!filename) {
      return res.status(400).json({ error: 'Invalid file path' });
    }

    // Find the attachment via its message, then check report ownership
    const attachment = await prisma.attachment.findFirst({
      where: {
        filePath: { contains: filename },
        messageId: { not: null } // Chat attachments have a messageId
      },
      include: {
        message: {
          select: {
            senderId: true,
            deletedAt: true,
            report: { select: { id: true, userId: true, categoryId: true, status: true, deletedAt: true } }
          }
        }
      }
    });

    if (!attachment) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Audit M5: attachment pesan yang sudah dihapus tidak boleh lagi
    // bisa diunduh — penghapusan pesan harus memutus akses file.
    if (attachment.message?.deletedAt) {
      log.warn('Chat attachment of deleted message blocked', { userId, filename });
      return res.status(403).json({ error: 'Access denied to this file' });
    }

    const access = await canAccessReport(req.user, attachment.message?.report);
    if (!access.allowed) {
      log.warn('Chat attachment access denied', { userId, filename });
      return res.status(403).json({ error: 'Access denied to this file' });
    }

    next();
  } catch (error) {
    log.error('checkChatAttachmentOwnership error', { error: error.message });
    return res.status(500).json({ error: 'Server error during file access check' });
  }
}

const ALLOWED_UPLOAD_PREFIXES = [
  '/ktm/',
  '/reports/attachments/',
  '/chat/attachments/',
];

/**
 * File access middleware that detects file type from the request path
 * and routes to the appropriate ownership check.
 *
 * Unknown paths under /uploads are denied by default.
 * /uploads/chat-pending is never served.
 */
const fileAccessMiddleware = async (req, res, next) => {
  try {
    const filePath = req.path;

    if (filePath.startsWith('/chat-pending')) {
      log.warn('Blocked chat-pending static access', { path: filePath, userId: req.user?.userId });
      return res.status(404).json({ error: 'File not found' });
    }

    const isAllowed = ALLOWED_UPLOAD_PREFIXES.some((prefix) => filePath.startsWith(prefix));
    if (!isAllowed) {
      log.warn('Blocked unknown upload path', { path: filePath, userId: req.user?.userId });
      return res.status(404).json({ error: 'File not found' });
    }

    if (filePath.startsWith('/ktm/')) {
      return await checkKtmOwnership(req, res, next);
    }

    if (filePath.startsWith('/reports/attachments/')) {
      return await checkReportAttachmentOwnership(req, res, next);
    }

    if (filePath.startsWith('/chat/attachments/')) {
      return await checkChatAttachmentOwnership(req, res, next);
    }

    return res.status(404).json({ error: 'File not found' });
  } catch (error) {
    log.error('File access middleware error', {
      error: error.message,
      path: req.originalUrl,
      userId: req.user?.userId,
    });
    return res.status(500).json({ error: 'Server error during file access check' });
  }
};

module.exports = fileAccessMiddleware;
