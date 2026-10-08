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

router.get('/admins', c.listAdmins);

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

router.post(
  '/users/:userId/categories',
  [
    param('userId').isInt().toInt(),
    body('categoryId').isInt().toInt(),
  ],
  validate,
  c.grantCategory
);

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
