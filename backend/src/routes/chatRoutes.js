const express = require('express');
const router = express.Router();
const chatControllers = require('../controllers/chatControllers');
const authMiddleware = require('../middlewares/authMiddleware');
const { body, param, query } = require('express-validator');
const validate = require('../middlewares/validationMiddleware');

// ==== Chat Attachment Upload Configuration ====
const multer = require('multer');
const path = require('path');
const compressImagesMiddleware = require('../middlewares/compressImagesMiddleware');

// Multer storage for chat attachments
const chatStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../../uploads')),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});
const chatUpload = multer({ storage: chatStorage, limits: { fileSize: 5 * 1024 * 1024 } });

// Chat attachment upload endpoint
router.post('/upload', chatUpload.array('files', 10), compressImagesMiddleware, chatControllers.uploadFile);

// Apply authentication middleware to all chat routes
router.use(authMiddleware);

// Get reports with messages (chat list)
router.get('/reports', [query('page').optional().isInt({ min: 1 }).toInt(), query('limit').optional().isInt({ min: 1, max: 100 }).toInt()], validate, chatControllers.getReportsWithMessages);

// Get unread message count
router.get('/unread-count', chatControllers.getUnreadCount);

// Get messages for a specific report
router.get('/reports/:reportId/messages', [param('reportId').isInt().withMessage('reportId must be an integer'), query('page').optional().isInt({ min: 1 }).toInt(), query('limit').optional().isInt({ min: 1, max: 200 }).toInt()], validate, chatControllers.getMessages);

// Send a message to a specific report
router.post('/reports/:reportId/messages', [param('reportId').isInt().withMessage('reportId must be an integer'), body('content').trim().notEmpty().withMessage('content is required'), body('attachments').optional().isArray()], validate, chatControllers.sendMessage);

// Mark messages as read for a specific report
router.patch('/reports/:reportId/messages/read', [param('reportId').isInt().withMessage('reportId must be an integer')], validate, chatControllers.markAsRead);

// Join chat room (for Socket.IO room access verification)
router.post('/reports/:reportId/join', [param('reportId').isInt().withMessage('reportId must be an integer')], validate, chatControllers.joinRoom);

// Delete a specific message
router.delete('/messages/:messageId', [param('messageId').isInt().withMessage('messageId must be an integer')], validate, chatControllers.deleteMessage);

module.exports = router; 