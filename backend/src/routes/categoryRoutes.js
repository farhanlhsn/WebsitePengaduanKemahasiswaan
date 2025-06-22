const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryControllers');
const authMiddleware = require('../middlewares/authMiddleware');

// Public routes (no auth required)
router.get('/search', categoryController.searchCategories);        // GET /api/categories/search?q=term&includeDeleted=true
router.get('/slug/:slug', categoryController.getCategoryBySlug);   // GET /api/categories/slug/akademik?includeDeleted=true
router.get('/', categoryController.getAllCategories);             // GET /api/categories?includeDeleted=true

// Protected routes (auth required)
router.use(authMiddleware); // All routes below require authentication

// Category management routes  
router.get('/stats', categoryController.getCategoryStats);        // GET /api/categories/stats
router.get('/with-reports', categoryController.getCategoriesWithReports); // GET /api/categories/with-reports?includeDeleted=true
router.get('/:id', categoryController.getCategoryById);           // GET /api/categories/123?includeDeleted=true

// Create and update
router.post('/', categoryController.createCategory);              // POST /api/categories
router.put('/:id', categoryController.updateCategory);            // PUT /api/categories/123

// Soft delete operations
router.delete('/:id', categoryController.deleteCategory);         // DELETE /api/categories/123 (soft delete)
router.post('/:id/restore', categoryController.restoreCategory);  // POST /api/categories/123/restore

// Admin-only routes
router.delete('/:id/permanent', categoryController.permanentDeleteCategory); // DELETE /api/categories/123/permanent
router.post('/cleanup', categoryController.cleanupOldDeletedCategories);     // POST /api/categories/cleanup?daysOld=90

module.exports = router;