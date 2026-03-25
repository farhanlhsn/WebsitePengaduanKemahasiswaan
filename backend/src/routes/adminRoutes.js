const express = require('express');
const router = express.Router();
const adminDashboardController = require('../controllers/adminDashboardControllers');
const authMiddleware = require('../middlewares/authMiddleware');
const isAdminMiddleware = require('../middlewares/isAdminMiddleware');

// All routes require authentication and admin privileges
router.use(authMiddleware);
router.use(isAdminMiddleware);

// Get comprehensive dashboard statistics
// GET /api/admin/dashboard/stats
router.get('/dashboard/stats', adminDashboardController.getDashboardStats);

module.exports = router;


