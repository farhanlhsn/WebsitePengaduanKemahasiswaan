const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryControllers');
const authMiddleware = require('../middlewares/authMiddleware');
const isAdminMiddleware = require('../middlewares/isAdminMiddleware');
const isSuperAdminMiddleware = require('../middlewares/isSuperAdminMiddleware');
const { body, param, query } = require('express-validator');
const validate = require('../middlewares/validationMiddleware');

// Public routes (no auth required)
/**
 * @swagger
 * /v1/api/categories/search:
 *   get:
 *     tags: [Categories]
 *     summary: Search categories by query string
 *     security: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: includeDeleted
 *         schema: { type: boolean }
 *     responses:
 *       200: { description: Matching categories }
 */
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
router.use(authMiddleware);

router.get('/stats', categoryController.getCategoryStats);
router.get(
  '/with-reports',
  isAdminMiddleware,
  [query('includeDeleted').optional().isBoolean().toBoolean()],
  validate,
  categoryController.getCategoriesWithReports
);
router.get('/:id', [param('id').isInt().withMessage('id must be an integer'), query('includeDeleted').optional().isBoolean().toBoolean()], validate, categoryController.getCategoryById);

// Create and update — SUPERADMIN only (BE-6)
router.post(
  '/',
  isSuperAdminMiddleware,
  [
    body('name').trim().notEmpty().withMessage('Category name is required'),
    body('defaultPriority').optional().isIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).withMessage('defaultPriority must be one of LOW, MEDIUM, HIGH, URGENT'),
    body('allowAnonymous').optional().isBoolean().withMessage('allowAnonymous must be a boolean').toBoolean(),
  ],
  validate,
  categoryController.createCategory
);
router.put(
  '/:id',
  isSuperAdminMiddleware,
  [
    param('id').isInt().withMessage('id must be an integer'),
    body('name').optional().isString().isLength({ min: 1 }),
    body('defaultPriority').optional().isIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).withMessage('defaultPriority must be one of LOW, MEDIUM, HIGH, URGENT'),
    body('allowAnonymous').optional().isBoolean().withMessage('allowAnonymous must be a boolean').toBoolean(),
  ],
  validate,
  categoryController.updateCategory
);

// Soft delete operations — SUPERADMIN only (BE-6)
router.delete('/:id', isSuperAdminMiddleware, [param('id').isInt().withMessage('id must be an integer')], validate, categoryController.deleteCategory);
router.post('/:id/restore', isSuperAdminMiddleware, [param('id').isInt().withMessage('id must be an integer')], validate, categoryController.restoreCategory);

// SUPERADMIN-only destructive routes
router.delete('/:id/permanent', isSuperAdminMiddleware, [param('id').isInt().withMessage('id must be an integer')], validate, categoryController.permanentDeleteCategory);
router.post('/cleanup', isSuperAdminMiddleware, [query('daysOld').optional().isInt({ min: 1 }).toInt()], validate, categoryController.cleanupOldDeletedCategories);

module.exports = router;