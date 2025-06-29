const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportControllers');
const authMiddleware = require('../middlewares/authMiddleware');
const compressImagesMiddleware = require('../middlewares/compressImagesMiddleware');
const AttachmentServices = require('../services/attachmentServices');

// Semua route di bawah ini butuh autentikasi
router.use(authMiddleware);

// Admin: Get all reports paginated (search, filter)
// GET /api/reports?limit=10&lastItemId=xxx&search=keyword&status=PENDING&createdAt=7
router.get('/', reportController.getAllReportsPaginated);

// Mahasiswa: Get all reports by userId paginated (search, filter)
// GET /api/reports/user?limit=10&lastItemId=xxx&search=keyword&status=PENDING&createdAt=7
router.get('/user', reportController.getAllReportsByUserIdPaginated);

// Detail laporan by ID
// GET /api/reports/:id
router.get('/:id', reportController.getReportById);

// Buat laporan
// POST /api/reports
// Body: { title, description, categoryId, ... }
router.post('/', reportController.createReport);

// Update status laporan
// PATCH /api/reports/:id/status
// Body: { status }
router.patch('/:id/status', reportController.updateReportStatus);

// Restore laporan (soft delete restore)
// POST /api/reports/:id/restore
router.post('/:id/restore', reportController.restoreReport);

// Soft delete laporan
// DELETE /api/reports/:id
router.delete('/:id', reportController.deleteReport);

// Get report stats
// GET /api/reports/stats
router.get('/stats', reportController.getReportStats);

// Upload attachment (max 10 file, 5MB per file, image akan di-compress <= 1MB)
// POST /api/reports/:reportId/attachments
// FormData: files[]
router.post(  '/:reportId/attachments',  AttachmentServices.uploadMiddleware,  compressImagesMiddleware,  async (req, res, next) => {
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
