const express = require('express');
const router = express.Router();
const adminDashboardController = require('../controllers/adminDashboardControllers');
const exportController = require('../controllers/exportControllers');
const authMiddleware = require('../middlewares/authMiddleware');
const isAdminMiddleware = require('../middlewares/isAdminMiddleware');

// All routes require authentication and admin privileges
router.use(authMiddleware);
router.use(isAdminMiddleware);

/**
 * @swagger
 * /v1/api/admin/dashboard/stats:
 *   get:
 *     tags: [Admin]
 *     summary: Comprehensive dashboard statistics
 *     responses:
 *       200: { description: Dashboard stats payload }
 *
 * /v1/api/admin/export/reports:
 *   get:
 *     tags: [Admin]
 *     summary: Export reports as CSV
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string }
 *       - in: query
 *         name: startDate
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: endDate
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: categoryId
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: CSV file
 *         content:
 *           text/csv: {}
 *
 * /v1/api/admin/export/users:
 *   get:
 *     tags: [Admin]
 *     summary: Export users as CSV
 *     responses:
 *       200:
 *         description: CSV file
 *         content:
 *           text/csv: {}
 */
router.get('/dashboard/stats', adminDashboardController.getDashboardStats);

// Export endpoints
// GET /api/admin/export/reports?status=...&startDate=...&endDate=...&categoryId=...
router.get('/export/reports', exportController.exportReports);
// GET /api/admin/export/users
router.get('/export/users', exportController.exportUsers);

module.exports = router;