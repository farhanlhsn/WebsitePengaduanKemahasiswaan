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

/**
 * @swagger
 * /v1/api/chat/reports/{reportId}/upload:
 *   post:
 *     tags: [Chat]
 *     summary: Upload chat attachment (pending token, scoped to report)
 *     description: >
 *       Mengunggah file ke pending storage. Response berisi `attachmentToken` yang
 *       wajib dikirim di `attachmentTokens` saat POST pesan. Room join hanya via Socket.IO.
 *     parameters:
 *       - in: path
 *         name: reportId
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               files:
 *                 type: array
 *                 items: { type: string, format: binary }
 *     responses:
 *       201: { description: Pending attachment tokens returned }
 *       403: { description: Tidak punya akses ke laporan }
 *
 * /v1/api/chat/reports:
 *   get:
 *     tags: [Chat]
 *     summary: List laporan dengan pesan terakhir & unread count
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20, maximum: 100 }
 *     responses:
 *       200: { description: Daftar laporan chat }
 *
 * /v1/api/chat/unread-count:
 *   get:
 *     tags: [Chat]
 *     summary: Total pesan belum dibaca (category-scoped untuk admin)
 *     responses:
 *       200: { description: Unread count }
 *
 * /v1/api/chat/reports/{reportId}/messages:
 *   get:
 *     tags: [Chat]
 *     summary: Ambil pesan per laporan (paginated)
 *     parameters:
 *       - in: path
 *         name: reportId
 *         required: true
 *         schema: { type: integer }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 50, maximum: 200 }
 *     responses:
 *       200: { description: Daftar pesan }
 *       403: { description: Tidak punya akses ke laporan }
 *   post:
 *     tags: [Chat]
 *     summary: Kirim pesan (verified users, wajib akses laporan)
 *     parameters:
 *       - in: path
 *         name: reportId
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [content]
 *             properties:
 *               content: { type: string }
 *               attachmentTokens:
 *                 type: array
 *                 items: { type: string }
 *               replyToId: { type: integer }
 *     responses:
 *       201: { description: Pesan terkirim }
 *       403: { description: Tidak punya akses ke laporan }
 *
 * /v1/api/chat/reports/{reportId}/messages/read:
 *   patch:
 *     tags: [Chat]
 *     summary: Tandai semua pesan di laporan sebagai dibaca
 *     parameters:
 *       - in: path
 *         name: reportId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Berhasil ditandai dibaca }
 *       403: { description: Tidak punya akses ke laporan }
 *
 * /v1/api/chat/messages/{messageId}:
 *   delete:
 *     tags: [Chat]
 *     summary: Hapus pesan (sesuai kebijakan role)
 *     parameters:
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Pesan dihapus }
 *       403: { description: Tidak diizinkan menghapus pesan ini }
 */

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
