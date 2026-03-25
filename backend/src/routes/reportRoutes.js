const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportControllers');
const authMiddleware = require('../middlewares/authMiddleware');
const isAdminMiddleware = require('../middlewares/isAdminMiddleware');
const compressImagesMiddleware = require('../middlewares/compressImagesMiddleware');
const AttachmentServices = require('../services/attachmentServices');
const { body, param, query } = require('express-validator');
const validate = require('../middlewares/validationMiddleware');

// Semua route di bawah ini butuh autentikasi
router.use(authMiddleware);

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

// Buat laporan
// POST /api/reports
// Body: { title, description, categoryId, ... }
router.post('/', [
  body('title').trim().notEmpty().withMessage('Title is required').isLength({ min: 3 }),
  body('description').trim().notEmpty().withMessage('Description is required').isLength({ min: 10 }),
  body('categoryId').isInt().withMessage('categoryId must be an integer'),
], validate, reportController.createReport);

// Update status laporan (admin only)
// PATCH /api/reports/:id/status
// Body: { status }
router.patch('/:id/status', isAdminMiddleware, [
  param('id').isInt().withMessage('id must be an integer'),
  body('status').isIn(['PENDING','IN_REVIEW','IN_PROGRESS','RESOLVED','REJECTED','CANCELED']).withMessage('Invalid status'),
], validate, reportController.updateReportStatus);

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
router.post(  '/:reportId/attachments',  [param('reportId').isInt().withMessage('reportId must be an integer')], validate,  AttachmentServices.uploadMiddleware,  compressImagesMiddleware,  async (req, res, next) => {
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
