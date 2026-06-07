const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportControllers');
const authMiddleware = require('../middlewares/authMiddleware');
const isAdminMiddleware = require('../middlewares/isAdminMiddleware');
const isVerifiedMiddleware = require('../middlewares/isVerifiedMiddleware');
const compressImagesMiddleware = require('../middlewares/compressImagesMiddleware');
const AttachmentServices = require('../services/attachmentServices');
const { createReportLimiter, uploadLimiter } = require('../middlewares/rateLimiters');
const { body, param, query } = require('express-validator');
const validate = require('../middlewares/validationMiddleware');
const ResponseFormatter = require('../utils/responseFormatter');
const { canAccessReport } = require('../utils/accessPolicy');
const { isAdmin } = require('../utils/rbac');

// Semua route di bawah ini butuh autentikasi
router.use(authMiddleware);

const canUploadReportAttachment = async (req, res, next) => {
  try {
    const access = await canAccessReport(req.user, req.params.reportId);
    if (!access.allowed) {
      return res.status(access.statusCode || 403).json(
        ResponseFormatter.error(access.reason || 'Access denied', access.statusCode || 403)
      );
    }
    if (!isAdmin(req.user) && access.report.status !== 'PENDING') {
      return res.status(400).json(
        ResponseFormatter.error('Lampiran hanya bisa ditambahkan saat laporan masih PENDING', 400)
      );
    }
    req.reportAccess = access.report;
    next();
  } catch (err) {
    next(err);
  }
};

/**
 * @swagger
 * /v1/api/reports:
 *   get:
 *     tags: [Reports]
 *     summary: List reports paginated (admin only)
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10, maximum: 100 }
 *       - in: query
 *         name: lastItemId
 *         schema: { type: integer }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: createdAt
 *         schema: { type: integer, description: 'Days back' }
 *       - in: query
 *         name: categoryId
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Paginated list of reports }
 *       403: { description: Forbidden — admin only }
 *   post:
 *     tags: [Reports]
 *     summary: Create a new report (verified students only)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, description, categoryId]
 *             properties:
 *               title: { type: string, minLength: 3 }
 *               description: { type: string, minLength: 10 }
 *               categoryId: { type: integer }
 *               isAnonymous: { type: boolean }
 *     responses:
 *       201: { description: Report created }
 *       400: { description: Validation failed }
 *       403: { description: Account not verified or anonymous not allowed }
 *       429: { description: Rate limit exceeded }
 */

// Admin: Get all reports paginated (search, filter)
// GET /api/reports?limit=10&lastItemId=xxx&search=keyword&status=PENDING&createdAt=7
router.get('/', isAdminMiddleware, [
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('lastItemId').optional().isInt().toInt(),
  query('search').optional().isString(),
  query('createdAt').optional().isInt({ min: 1 }).toInt(),
  query('categoryId').optional().isInt().toInt(),
], validate, reportController.getAllReportsPaginated);

// Mahasiswa: Get all reports by userId paginated (search, filter)
// GET /api/reports/user?limit=10&lastItemId=xxx&search=keyword&status=PENDING&createdAt=7
router.get('/user', [
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('lastItemId').optional().isInt().toInt(),
  query('search').optional().isString(),
  query('createdAt').optional().isInt({ min: 1 }).toInt(),
  query('categoryId').optional().isInt().toInt(),
], validate, reportController.getAllReportsByUserIdPaginated);

// Get report stats (admin only)
// GET /api/reports/stats
router.get('/stats', isAdminMiddleware, reportController.getReportStats);

// Detail laporan by ID
// GET /api/reports/:id
router.get('/:id', [param('id').isInt().withMessage('id must be an integer'), query('includeDeleted').optional().isBoolean().toBoolean()], validate, reportController.getReportById);

// Buat laporan (requires verified account, rate-limited per user)
// POST /api/reports
// Body: { title, description, categoryId, isAnonymous? }
router.post('/', isVerifiedMiddleware, createReportLimiter, [
  body('title').trim().notEmpty().withMessage('Title is required').isLength({ min: 3 }),
  body('description').trim().notEmpty().withMessage('Description is required').isLength({ min: 10 }),
  body('categoryId').isInt().withMessage('categoryId must be an integer'),
  body('isAnonymous').optional().isBoolean().withMessage('isAnonymous must be a boolean'),
], validate, reportController.createReport);

// Edit laporan (only when status is PENDING, only by report owner)
// PUT /api/reports/:id
// Body: { title?, description?, categoryId? }
router.put('/:id', isVerifiedMiddleware, [
  param('id').isInt().withMessage('id must be an integer'),
  body('title').optional().trim().isLength({ min: 3 }).withMessage('Title must be at least 3 characters'),
  body('description').optional().trim().isLength({ min: 10 }).withMessage('Description must be at least 10 characters'),
  body('categoryId').optional().isInt().withMessage('categoryId must be an integer'),
], validate, reportController.editReport);

// Update status laporan (admin only)
// PATCH /api/reports/:id/status
// Body: { status }
router.patch('/:id/status', isAdminMiddleware, [
  param('id').isInt().withMessage('id must be an integer'),
  body('status').isIn(['PENDING','IN_REVIEW','IN_PROGRESS','RESOLVED','REJECTED','CANCELED']).withMessage('Invalid status'),
  body('reason').optional().trim().isLength({ min: 3 }).withMessage('Reason must be at least 3 characters'),
], validate, reportController.updateReportStatus);

// Update priority laporan (admin only)
// PATCH /api/reports/:id/priority
// Body: { priority }
router.patch('/:id/priority', isAdminMiddleware, [
  param('id').isInt().withMessage('id must be an integer'),
  body('priority').isIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).withMessage('Invalid priority'),
], validate, reportController.updateReportPriority);

// Assign report to admin (admin only)
// PATCH /api/reports/:id/assign
// Body: { assignedToId } (null to unassign)
router.patch('/:id/assign', isAdminMiddleware, [
  param('id').isInt().withMessage('id must be an integer'),
  body('assignedToId').optional({ nullable: true }).isInt().withMessage('assignedToId must be an integer'),
], validate, reportController.assignReport);

// Restore laporan (soft delete restore)
// POST /api/reports/:id/restore
router.post('/:id/restore', [param('id').isInt().withMessage('id must be an integer')], validate, reportController.restoreReport);

// Soft delete laporan
// DELETE /api/reports/:id
router.delete('/:id', [param('id').isInt().withMessage('id must be an integer')], validate, reportController.deleteReport);

// Permanent delete laporan (admin only)
// DELETE /api/reports/:id/permanent
router.delete('/:id/permanent', isAdminMiddleware, [param('id').isInt().withMessage('id must be an integer')], validate, reportController.permanentDeleteReport);

// Upload attachment (max 10 file, 5MB per file, image akan di-compress <= 1MB)
// POST /api/reports/:reportId/attachments
// FormData: files[]
router.post('/:reportId/attachments', uploadLimiter, [param('reportId').isInt().withMessage('reportId must be an integer')], validate, canUploadReportAttachment, AttachmentServices.uploadMiddleware, compressImagesMiddleware, async (req, res, next) => {
    try {
      const attachments = await AttachmentServices.uploadAttachments(req.files, req.params.reportId);
      res.status(201).json({ attachments });
    } catch (err) {
      next(err);
    }
  }
);

// Error handler khusus untuk file size
router.use((err, req, res, next) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'File size should not exceed 5MB per file' });
  }
  next(err);
});

module.exports = router;
