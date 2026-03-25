const express = require('express');
const router = express.Router();
const bulkOperationsController = require('../controllers/bulkOperationsControllers');
const authMiddleware = require('../middlewares/authMiddleware');
const isAdminMiddleware = require('../middlewares/isAdminMiddleware');
const { body } = require('express-validator');
const validate = require('../middlewares/validationMiddleware');

// All routes require authentication and admin privileges
router.use(authMiddleware);
router.use(isAdminMiddleware);

// Bulk operations for users
// POST /api/bulk-operations/users/verify
router.post(
  '/users/verify',
  [
    body('userIds')
      .isArray({ min: 1 })
      .withMessage('userIds must be a non-empty array'),
    body('userIds.*')
      .isInt()
      .withMessage('Each userId must be an integer')
  ],
  validate,
  bulkOperationsController.bulkVerifyUsers
);

// POST /api/bulk-operations/users/delete
router.post(
  '/users/delete',
  [
    body('userIds')
      .isArray({ min: 1 })
      .withMessage('userIds must be a non-empty array'),
    body('userIds.*')
      .isInt()
      .withMessage('Each userId must be an integer')
  ],
  validate,
  bulkOperationsController.bulkDeleteUsers
);

// POST /api/bulk-operations/users/restore
router.post(
  '/users/restore',
  [
    body('userIds')
      .isArray({ min: 1 })
      .withMessage('userIds must be a non-empty array'),
    body('userIds.*')
      .isInt()
      .withMessage('Each userId must be an integer')
  ],
  validate,
  bulkOperationsController.bulkRestoreUsers
);

// Bulk operations for reports
// POST /api/bulk-operations/reports/update-status
router.post(
  '/reports/update-status',
  [
    body('reportIds')
      .isArray({ min: 1 })
      .withMessage('reportIds must be a non-empty array'),
    body('reportIds.*')
      .isInt()
      .withMessage('Each reportId must be an integer'),
    body('status')
      .isIn(['PENDING', 'IN_REVIEW', 'IN_PROGRESS', 'RESOLVED', 'REJECTED', 'CANCELED'])
      .withMessage('Invalid status')
  ],
  validate,
  bulkOperationsController.bulkUpdateReportStatus
);

// POST /api/bulk-operations/reports/delete
router.post(
  '/reports/delete',
  [
    body('reportIds')
      .isArray({ min: 1 })
      .withMessage('reportIds must be a non-empty array'),
    body('reportIds.*')
      .isInt()
      .withMessage('Each reportId must be an integer')
  ],
  validate,
  bulkOperationsController.bulkDeleteReports
);

// POST /api/bulk-operations/reports/restore
router.post(
  '/reports/restore',
  [
    body('reportIds')
      .isArray({ min: 1 })
      .withMessage('reportIds must be a non-empty array'),
    body('reportIds.*')
      .isInt()
      .withMessage('Each reportId must be an integer')
  ],
  validate,
  bulkOperationsController.bulkRestoreReports
);

// Bulk operations for categories
// POST /api/bulk-operations/categories/delete
router.post(
  '/categories/delete',
  [
    body('categoryIds')
      .isArray({ min: 1 })
      .withMessage('categoryIds must be a non-empty array'),
    body('categoryIds.*')
      .isInt()
      .withMessage('Each categoryId must be an integer')
  ],
  validate,
  bulkOperationsController.bulkDeleteCategories
);

// POST /api/bulk-operations/categories/restore
router.post(
  '/categories/restore',
  [
    body('categoryIds')
      .isArray({ min: 1 })
      .withMessage('categoryIds must be a non-empty array'),
    body('categoryIds.*')
      .isInt()
      .withMessage('Each categoryId must be an integer')
  ],
  validate,
  bulkOperationsController.bulkRestoreCategories
);

module.exports = router;


