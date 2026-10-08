const express = require('express');
const router = express.Router();
const adminDashboardController = require('../controllers/adminDashboardControllers');
const exportController = require('../controllers/exportControllers');
const authMiddleware = require('../middlewares/authMiddleware');
const isAdminMiddleware = require('../middlewares/isAdminMiddleware');
const isSuperAdminMiddleware = require('../middlewares/isSuperAdminMiddleware');

// All routes require authentication and admin privileges
router.use(authMiddleware);
router.use(isAdminMiddleware);

router.get('/dashboard/stats', adminDashboardController.getDashboardStats);

// Export endpoints
// GET /api/admin/export/reports?status=...&startDate=...&endDate=...&categoryId=...
router.get('/export/reports', exportController.exportReports);
// GET /api/admin/export/users — audit B5: direktori user lengkap hanya
// untuk SUPERADMIN (ADMIN biasa hanya scoped per kategori laporan).
router.get('/export/users', isSuperAdminMiddleware, exportController.exportUsers);

module.exports = router;