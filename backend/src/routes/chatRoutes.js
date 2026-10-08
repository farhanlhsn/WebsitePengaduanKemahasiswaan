const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const chatControllers = require('../controllers/chatControllers');
const authMiddleware = require('../middlewares/authMiddleware');
const isVerifiedMiddleware = require('../middlewares/isVerifiedMiddleware');
const requireReportAccess = require('../middlewares/chatAccessMiddleware');
const { uploadLimiter } = require('../middlewares/rateLimiters');
const { body, param, query } = require('express-validator');
const validate = require('../middlewares/validationMiddleware');
const {
  REPORT_CHAT_MIMES,
  createMulterFilename,
  createMulterFileFilter,
  createValidateUploadedMiddleware,
} = require('../utils/fileValidation');
const compressImagesMiddleware = require('../middlewares/compressImagesMiddleware');
const { CHAT_PENDING_DIR } = require('../services/chatPendingUploadService');

router.use(authMiddleware);

// Ensure chat-pending upload directory exists
fs.mkdirSync(CHAT_PENDING_DIR, { recursive: true });

const chatStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, CHAT_PENDING_DIR),
  filename: (req, file, cb) => createMulterFilename(req, file, cb, REPORT_CHAT_MIMES),
});

const chatUpload = multer({
  storage: chatStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: createMulterFileFilter(REPORT_CHAT_MIMES),
});

const validateChatUpload = createValidateUploadedMiddleware(REPORT_CHAT_MIMES);

router.post(
  '/reports/:reportId/upload',
  requireReportAccess,
  isVerifiedMiddleware,
  uploadLimiter,
  [param('reportId').isInt().withMessage('reportId must be an integer')],
  validate,
  chatUpload.array('files', 10),
  validateChatUpload,
  compressImagesMiddleware,
  chatControllers.uploadFile
);

router.get(
  '/reports',
  [query('page').optional().isInt({ min: 1 }).toInt(), query('limit').optional().isInt({ min: 1, max: 100 }).toInt()],
  validate,
  chatControllers.getReportsWithMessages
);

router.get('/unread-count', chatControllers.getUnreadCount);

router.get(
  '/reports/:reportId/messages',
  requireReportAccess,
  [param('reportId').isInt().withMessage('reportId must be an integer'), query('page').optional().isInt({ min: 1 }).toInt(), query('limit').optional().isInt({ min: 1, max: 200 }).toInt()],
  validate,
  chatControllers.getMessages
);

router.post(
  '/reports/:reportId/messages',
  requireReportAccess,
  isVerifiedMiddleware,
  [
    param('reportId').isInt().withMessage('reportId must be an integer'),
    body('content').trim().notEmpty().withMessage('content is required'),
    body('attachmentTokens').optional().isArray(),
    body('replyToId').optional().isInt(),
    body('clientMessageId').optional().isString().isLength({ min: 8, max: 64 }),
    body('idempotencyKey').optional().isString().isLength({ min: 8, max: 64 }),
  ],
  validate,
  chatControllers.sendMessage
);

router.patch(
  '/reports/:reportId/messages/read',
  requireReportAccess,
  [param('reportId').isInt().withMessage('reportId must be an integer')],
  validate,
  chatControllers.markAsRead
);

router.delete(
  '/messages/:messageId',
  [param('messageId').isInt().withMessage('messageId must be an integer')],
  validate,
  chatControllers.deleteMessage
);

module.exports = router;
