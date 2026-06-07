const express = require('express');
const router = express.Router();
const auditLogController = require('../controllers/auditLogControllers');
const authMiddleware = require('../middlewares/authMiddleware');
const isSuperAdminMiddleware = require('../middlewares/isSuperAdminMiddleware');
const { param, query } = require('express-validator');
const validate = require('../middlewares/validationMiddleware');

// All routes require authentication and SUPERADMIN privileges (BE-6)
router.use(authMiddleware);
router.use(isSuperAdminMiddleware);

/**
 * @swagger
 * /v1/api/audit-logs:
 *   get:
 *     tags: [Audit Logs]
 *     summary: List audit logs (admin only)
 *     parameters:
 *       - in: query
 *         name: entityType
 *         schema: { type: string, enum: [USER, REPORT] }
 *       - in: query
 *         name: action
 *         schema: { type: string }
 *       - in: query
 *         name: actorId
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 50 }
 *       - in: query
 *         name: offset
 *         schema: { type: integer, default: 0 }
 *     responses:
 *       200: { description: Paginated audit logs }
 */
router.get('/stats', auditLogController.getAuditStats);

// Get all audit logs with filters and pagination
// GET /api/audit-logs?entityType=USER&action=SOFT_DELETE&actorId=1&limit=50&offset=0&startDate=2024-01-01&endDate=2024-12-31
router.get(
  '/',
  [
    query('entityType').optional().isIn(['USER', 'REPORT', 'CATEGORY', 'ASSIGNMENT']).withMessage('Invalid entity type'),
    query('action')
      .optional()
      .isIn(['SOFT_DELETE', 'RESTORE', 'HARD_DELETE', 'UPDATE_STATUS', 'VERIFY_MAHASISWA', 'VIEW_ANONYMOUS', 'CREATE', 'UPDATE', 'PROMOTE_ADMIN', 'DEMOTE_ADMIN', 'GRANT_CATEGORY', 'REVOKE_CATEGORY'])
      .withMessage('Invalid action'),
    query('actorId').optional().isInt().toInt().withMessage('Actor ID must be an integer'),
    query('entityId').optional().isInt().toInt().withMessage('Entity ID must be an integer'),
    query('limit').optional().isInt({ min: 1, max: 200 }).toInt().withMessage('Invalid limit'),
    query('offset').optional().isInt({ min: 0 }).toInt().withMessage('Invalid offset'),
    query('startDate').optional().isISO8601().withMessage('Invalid start date format'),
    query('endDate').optional().isISO8601().withMessage('Invalid end date format'),
  ],
  validate,
  auditLogController.getAuditLogs
);

// Get audit logs by entity (e.g., all logs for a specific user or report)
// GET /api/audit-logs/entity/USER/123
router.get(
  '/entity/:entityType/:entityId',
  [
    param('entityType').isIn(['USER', 'REPORT', 'CATEGORY', 'ASSIGNMENT']).withMessage('Invalid entity type'),
    param('entityId').isInt().toInt().withMessage('Entity ID must be an integer'),
  ],
  validate,
  auditLogController.getAuditLogsByEntity
);

// Get audit logs by actor (admin user)
// GET /api/audit-logs/actor/123
router.get(
  '/actor/:actorId',
  [param('actorId').isInt().toInt().withMessage('Actor ID must be an integer')],
  validate,
  auditLogController.getAuditLogsByActor
);

// Cleanup old audit logs
// POST /api/audit-logs/cleanup?daysOld=365
router.post(
  '/cleanup',
  [query('daysOld').optional().isInt({ min: 1 }).toInt().withMessage('Days old must be a positive integer')],
  validate,
  auditLogController.cleanupOldAuditLogs
);

module.exports = router;


