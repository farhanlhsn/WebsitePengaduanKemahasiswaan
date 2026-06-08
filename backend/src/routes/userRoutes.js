const express = require('express');
const router = express.Router();
const userController = require('../controllers/userControllers');
const authMiddleware = require('../middlewares/authMiddleware');
const isAdminMiddleware = require('../middlewares/isAdminMiddleware');
const isSuperAdminMiddleware = require('../middlewares/isSuperAdminMiddleware');
const { body, param, query } = require('express-validator');
const validate = require('../middlewares/validationMiddleware');

// No public routes - all routes require authentication

// Protected routes (auth required)
router.use(authMiddleware); // All routes below require authentication

/**
 * @swagger
 * /v1/api/users:
 *   get:
 *     tags: [Users]
 *     summary: List users (auth required; admin sees all)
 *     parameters:
 *       - in: query
 *         name: includeDeleted
 *         schema: { type: boolean }
 *     responses:
 *       200: { description: User list }
 *
 * /v1/api/users/verify/{id}:
 *   put:
 *     tags: [Users]
 *     summary: Verify a student account
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Account verified }
 */

// User management routes
router.get('/', isAdminMiddleware, [query('includeDeleted').optional().isBoolean().toBoolean()], validate, userController.getAllUsers);              // GET /api/users?includeDeleted=true
router.get('/stats', isAdminMiddleware, userController.getUserStats);        // GET /api/users/stats
router.get('/unverified/students', isAdminMiddleware, userController.getUnverifiedStudents);  // GET /api/users/unverified/students
router.get('/unverified/admins', isAdminMiddleware, userController.getUnverifiedAdmins);      // GET /api/users/unverified/admins
router.put('/verify/:id', isAdminMiddleware, [param('id').isInt().withMessage('id must be an integer')], validate, userController.verifyStudent);  // PUT /api/users/verify/123
router.put('/reject/:id', isAdminMiddleware, [param('id').isInt().withMessage('id must be an integer'), body('reason').trim().notEmpty().withMessage('Reason is required')], validate, userController.rejectStudent);  // PUT /api/users/reject/123
router.get('/search/:email', isAdminMiddleware, [param('email').isEmail().withMessage('Invalid email')], validate, userController.getUserByEmail);  // GET /api/users/search/:email (admin only)
router.put('/profile/me', [body('name').optional().isString(), body('email').optional().isEmail(), body('nim').optional({ checkFalsy: true }).isString().isLength({ min: 8 })], validate, userController.updateProfile); // PUT /api/users/profile/me
router.put('/:id', isAdminMiddleware, [param('id').isInt().withMessage('id must be an integer'), body('name').optional().isString(), body('email').optional().isEmail(), body('nim').optional().isString().isLength({ min: 8 })], validate, userController.updateUser);            // PUT /api/users/123
router.delete('/:id', isAdminMiddleware, [param('id').isInt().withMessage('id must be an integer')], validate, userController.deleteUser);         // DELETE /api/users/123 (soft delete)
router.post('/:id/restore', isAdminMiddleware, [param('id').isInt().withMessage('id must be an integer')], validate, userController.restoreUser);  // POST /api/users/123/restore
router.delete('/:id/permanent', isSuperAdminMiddleware, [param('id').isInt().withMessage('id must be an integer')], validate, userController.permanentDeleteUser);
router.post('/cleanup', isSuperAdminMiddleware, [query('daysOld').optional().isInt({ min: 1 }).toInt()], validate, userController.cleanupOldDeletedUsers);
router.get('/:id', [param('id').isInt().withMessage('id must be an integer'), query('includeDeleted').optional().isBoolean().toBoolean()], validate, userController.getUserById);           // GET /api/users/123?includeDeleted=true
router.get('/:id/stats', [param('id').isInt().withMessage('id must be an integer')], validate, userController.getUserStatsById);  // GET /api/users/123/stats

module.exports = router;
