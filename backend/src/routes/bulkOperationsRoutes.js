const express = require('express');
const router = express.Router();
const bulkOperationsController = require('../controllers/bulkOperationsControllers');
const authMiddleware = require('../middlewares/authMiddleware');
const isAdminMiddleware = require('../middlewares/isAdminMiddleware');
const isSuperAdminMiddleware = require('../middlewares/isSuperAdminMiddleware');
const { body } = require('express-validator');
const validate = require('../middlewares/validationMiddleware');

// Security (audit C3): semua operasi bulk butuh autentikasi + otorisasi per-item.
// - USER ops: tier ADMIN, tiap target divalidasi dengan assertCanManageUser
//   yang sama dengan endpoint tunggal (ADMIN hanya bisa kelola MAHASISWA,
//   last-superadmin guard, self-destructive guard).
// - REPORT ops: tier ADMIN, di-scoped per kategori assignment di service.
// - CATEGORY ops: SUPERADMIN only (CRUD kategori adalah domain superadmin).
router.use(authMiddleware);

const BATCH_LIMIT = { min: 1, max: 100 };

const userIdsRules = [
  body('userIds').isArray(BATCH_LIMIT).withMessage('userIds harus array 1-100 item'),
  body('userIds.*').isInt().withMessage('Each userId must be an integer'),
];
const reportIdsRules = [
  body('reportIds').isArray(BATCH_LIMIT).withMessage('reportIds harus array 1-100 item'),
  body('reportIds.*').isInt().withMessage('Each reportId must be an integer'),
];
const categoryIdsRules = [
  body('categoryIds').isArray(BATCH_LIMIT).withMessage('categoryIds harus array 1-100 item'),
  body('categoryIds.*').isInt().withMessage('Each categoryId must be an integer'),
];

/**
 * @swagger
 * /v1/api/bulk-operations/users/verify:
 *   post:
 *     tags: [Bulk Operations]
 *     summary: Bulk verify multiple students (SUPERADMIN only)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userIds]
 *             properties:
 *               userIds:
 *                 type: array
 *                 maxItems: 100
 *                 items: { type: integer }
 *     responses:
 *       200: { description: Bulk verification result with per-id skipped list }
 */
router.post(
  '/users/verify',
  isAdminMiddleware,
  userIdsRules,
  validate,
  bulkOperationsController.bulkVerifyUsers
);

// POST /api/bulk-operations/users/delete
router.post(
  '/users/delete',
  isAdminMiddleware,
  userIdsRules,
  validate,
  bulkOperationsController.bulkDeleteUsers
);

// POST /api/bulk-operations/users/restore
router.post(
  '/users/restore',
  isAdminMiddleware,
  userIdsRules,
  validate,
  bulkOperationsController.bulkRestoreUsers
);

// Bulk operations for reports (ADMIN tier, category-scoped in service)
// POST /api/bulk-operations/reports/update-status
router.post(
  '/reports/update-status',
  isAdminMiddleware,
  [
    ...reportIdsRules,
    body('status')
      .isIn(['PENDING', 'IN_REVIEW', 'IN_PROGRESS', 'RESOLVED', 'REJECTED', 'CANCELED'])
      .withMessage('Invalid status'),
    body('reason')
      .optional()
      .trim()
      .isLength({ min: 3 })
      .withMessage('Reason must be at least 3 characters'),
    body('reason').custom((value, { req }) => {
      if (['REJECTED', 'CANCELED'].includes(req.body.status) && (!value || !String(value).trim())) {
        throw new Error('Alasan wajib diisi untuk status REJECTED atau CANCELED');
      }
      return true;
    }),
  ],
  validate,
  bulkOperationsController.bulkUpdateReportStatus
);

// POST /api/bulk-operations/reports/delete
router.post(
  '/reports/delete',
  isAdminMiddleware,
  reportIdsRules,
  validate,
  bulkOperationsController.bulkDeleteReports
);

// POST /api/bulk-operations/reports/restore
router.post(
  '/reports/restore',
  isAdminMiddleware,
  reportIdsRules,
  validate,
  bulkOperationsController.bulkRestoreReports
);

// Bulk operations for categories (SUPERADMIN only)
// POST /api/bulk-operations/categories/delete
router.post(
  '/categories/delete',
  isSuperAdminMiddleware,
  categoryIdsRules,
  validate,
  bulkOperationsController.bulkDeleteCategories
);

// POST /api/bulk-operations/categories/restore
router.post(
  '/categories/restore',
  isSuperAdminMiddleware,
  categoryIdsRules,
  validate,
  bulkOperationsController.bulkRestoreCategories
);

module.exports = router;
