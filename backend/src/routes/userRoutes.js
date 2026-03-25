const express = require('express');
const router = express.Router();
const userController = require('../controllers/userControllers');
const authMiddleware = require('../middlewares/authMiddleware');
const isAdminMiddleware = require('../middlewares/isAdminMiddleware');
const prisma = require('../utils/prisma');
const { body, param, query } = require('express-validator');
const validate = require('../middlewares/validationMiddleware');

// Public routes (no auth required)
router.get('/search/:email', [param('email').isEmail().withMessage('Invalid email')], validate, userController.getUserByEmail);

// Protected routes (auth required)
router.use(authMiddleware); // All routes below require authentication

// User management routes
router.get('/', [query('includeDeleted').optional().isBoolean().toBoolean()], validate, userController.getAllUsers);              // GET /api/users?includeDeleted=true
router.get('/stats', userController.getUserStats);        // GET /api/users/stats
router.get('/unverified/students', isAdminMiddleware, userController.getUnverifiedStudents);  // GET /api/users/unverified/students
router.get('/unverified/admins', isAdminMiddleware, userController.getUnverifiedAdmins);      // GET /api/users/unverified/admins
router.get('/test', async (req, res) => {
    const categories = await prisma.category.findMany();
    res.json(categories);
  });
router.put('/verify/:id', [param('id').isInt().withMessage('id must be an integer')], validate, userController.verifyStudent);  // PUT /api/users/verify/123
router.put('/:id', [param('id').isInt().withMessage('id must be an integer'), body('name').optional().isString(), body('email').optional().isEmail(), body('nim').optional().isString().isLength({ min: 8 })], validate, userController.updateUser);            // PUT /api/users/123
router.delete('/:id', [param('id').isInt().withMessage('id must be an integer')], validate, userController.deleteUser);         // DELETE /api/users/123 (soft delete)
router.post('/:id/restore', [param('id').isInt().withMessage('id must be an integer')], validate, userController.restoreUser);  // POST /api/users/123/restore
router.delete('/:id/permanent', isAdminMiddleware, [param('id').isInt().withMessage('id must be an integer')], validate, userController.permanentDeleteUser);  // DELETE /api/users/123/permanent
router.post('/cleanup', isAdminMiddleware, [query('daysOld').optional().isInt({ min: 1 }).toInt()], validate, userController.cleanupOldDeletedUsers);       // POST /api/users/cleanup?daysOld=90
router.get('/:id', [param('id').isInt().withMessage('id must be an integer'), query('includeDeleted').optional().isBoolean().toBoolean()], validate, userController.getUserById);           // GET /api/users/123?includeDeleted=true
router.get('/:id/stats', [param('id').isInt().withMessage('id must be an integer')], validate, userController.getUserStatsById);  // GET /api/users/123/stats

module.exports = router;