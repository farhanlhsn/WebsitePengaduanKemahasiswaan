const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryControllers');
const authMiddleware = require('../middlewares/authMiddleware');
const isAdminMiddleware = require('../middlewares/isAdminMiddleware');
const { body, param, query } = require('express-validator');
const validate = require('../middlewares/validationMiddleware');

// Public routes (no auth required)
router.get(
  '/search',
  [
    query('q').trim().notEmpty().withMessage('Search term is required'),
    query('includeDeleted').optional().isBoolean().toBoolean(),
  ],
  validate,
  categoryController.searchCategories
);        // GET /api/categories/search?q=term&includeDeleted=true
router.get(
  '/slug/:slug',
  [param('slug').trim().notEmpty().withMessage('Slug is required'), query('includeDeleted').optional().isBoolean().toBoolean()],
  validate,
  categoryController.getCategoryBySlug
);   // GET /api/categories/slug/akademik?includeDeleted=true
router.get(
  '/',
  [query('includeDeleted').optional().isBoolean().toBoolean()],
  validate,
  categoryController.getAllCategories
);             // GET /api/categories?includeDeleted=true

// Protected routes (auth required)
router.use(authMiddleware); // All routes below require authentication

// Category management routes  
router.get('/stats', categoryController.getCategoryStats);        // GET /api/categories/stats
router.get('/with-reports', [query('includeDeleted').optional().isBoolean().toBoolean()], validate, categoryController.getCategoriesWithReports); // GET /api/categories/with-reports?includeDeleted=true
router.get('/:id', [param('id').isInt().withMessage('id must be an integer'), query('includeDeleted').optional().isBoolean().toBoolean()], validate, categoryController.getCategoryById);           // GET /api/categories/123?includeDeleted=true

// Create and update
router.post('/', [body('name').trim().notEmpty().withMessage('Category name is required')], validate, categoryController.createCategory);              // POST /api/categories
router.put('/:id', [param('id').isInt().withMessage('id must be an integer'), body('name').optional().isString().isLength({ min: 1 })], validate, categoryController.updateCategory);            // PUT /api/categories/123

// Soft delete operations
router.delete('/:id', [param('id').isInt().withMessage('id must be an integer')], validate, categoryController.deleteCategory);         // DELETE /api/categories/123 (soft delete)
router.post('/:id/restore', [param('id').isInt().withMessage('id must be an integer')], validate, categoryController.restoreCategory);  // POST /api/categories/123/restore

// Admin-only routes
router.delete('/:id/permanent', isAdminMiddleware, [param('id').isInt().withMessage('id must be an integer')], validate, categoryController.permanentDeleteCategory); // DELETE /api/categories/123/permanent
router.post('/cleanup', isAdminMiddleware, [query('daysOld').optional().isInt({ min: 1 }).toInt()], validate, categoryController.cleanupOldDeletedCategories);     // POST /api/categories/cleanup?daysOld=90

module.exports = router;