const express = require('express');
const router = express.Router();
const userController = require('../controllers/userControllers');
const authMiddleware = require('../middlewares/authMiddleware');
const prisma = require('../utils/prisma');

// Public routes (no auth required)
router.get('/search/:email', userController.getUserByEmail);

// Protected routes (auth required)
router.use(authMiddleware); // All routes below require authentication

// User management routes
router.get('/', userController.getAllUsers);              // GET /api/users?includeDeleted=true
router.get('/stats', userController.getUserStats);        // GET /api/users/stats
router.get('/test', async (req, res) => {
    const categories = await prisma.category.findMany();
    res.json(categories);
  });
router.put('/verify/:id', userController.verifyStudent);  // PUT /api/users/verify/123
router.put('/:id', userController.updateUser);            // PUT /api/users/123
router.delete('/:id', userController.deleteUser);         // DELETE /api/users/123 (soft delete)
router.post('/:id/restore', userController.restoreUser);  // POST /api/users/123/restore
router.delete('/:id/permanent', userController.permanentDeleteUser);  // DELETE /api/users/123/permanent
router.post('/cleanup', userController.cleanupOldDeletedUsers);       // POST /api/users/cleanup?daysOld=90
router.get('/:id', userController.getUserById);           // GET /api/users/123?includeDeleted=true

module.exports = router;