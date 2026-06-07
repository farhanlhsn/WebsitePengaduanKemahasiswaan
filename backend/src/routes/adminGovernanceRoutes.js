const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const validate = require('../middlewares/validationMiddleware');
const authMiddleware = require('../middlewares/authMiddleware');
const isSuperAdminMiddleware = require('../middlewares/isSuperAdminMiddleware');
const c = require('../controllers/adminGovernanceControllers');

// All admin governance endpoints require SUPERADMIN.
router.use(authMiddleware);
router.use(isSuperAdminMiddleware);

/**
 * @swagger
 * tags:
 *   - name: Admin Governance
 *     description: SUPERADMIN-only endpoints for managing admins and assignments.
 */

/**
 * @swagger
 * /v1/api/admin-governance/admins:
 *   get:
 *     tags: [Admin Governance]
 *     summary: List all ADMIN-tier users with their category assignments
 *     responses:
 *       200: { description: List of admins }
 */
router.get('/admins', c.listAdmins);

/**
 * @swagger
 * /v1/api/admin-governance/users/{userId}/promote-admin:
 *   post:
 *     tags: [Admin Governance]
 *     summary: Promote a user to ADMIN
 */
router.post(
  '/users/:userId/promote-admin',
  [param('userId').isInt().toInt()],
  validate,
  c.promoteToAdmin
);

router.post(
  '/users/:userId/demote-admin',
  [param('userId').isInt().toInt()],
  validate,
  c.demoteAdmin
);

router.post(
  '/users/:userId/promote-superadmin',
  [param('userId').isInt().toInt()],
  validate,
  c.promoteToSuperAdmin
);

router.post(
  '/users/:userId/demote-superadmin',
  [param('userId').isInt().toInt()],
  validate,
  c.demoteSuperAdmin
);

/**
 * @swagger
 * /v1/api/admin-governance/users/{userId}/categories:
 *   post:
 *     tags: [Admin Governance]
 *     summary: Grant the admin access to a category
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [categoryId]
 *             properties:
 *               categoryId: { type: integer }
 */
router.post(
  '/users/:userId/categories',
  [
    param('userId').isInt().toInt(),
    body('categoryId').isInt().toInt(),
  ],
  validate,
  c.grantCategory
);

/**
 * @swagger
 * /v1/api/admin-governance/users/{userId}/categories/{categoryId}:
 *   delete:
 *     tags: [Admin Governance]
 *     summary: Revoke the admin's access to a category
 */
router.delete(
  '/users/:userId/categories/:categoryId',
  [
    param('userId').isInt().toInt(),
    param('categoryId').isInt().toInt(),
  ],
  validate,
  c.revokeCategory
);

module.exports = router;
