const ResponseFormatter = require('../utils/responseFormatter');
const { isSuperAdmin } = require('../utils/rbac');
const { getLogger } = require('../utils/logger');

const log = getLogger('middleware:isSuperAdmin');

/**
 * Gate endpoints that only SUPERADMIN may invoke.
 *
 * Use for: managing categories, granting/revoking admin↔category assignments,
 * promoting/demoting admins, accessing audit logs, viewing the admin roster.
 *
 * Must be used after authMiddleware.
 */
const isSuperAdminMiddleware = (req, res, next) => {
  try {
    if (!req.user) {
      log.warn('isSuperAdminMiddleware: No user in request');
      return res.status(401).json(
        ResponseFormatter.error('Authentication required', 401)
      );
    }

    if (!isSuperAdmin(req.user)) {
      log.warn('isSuperAdminMiddleware: Access denied', {
        userId: req.user.userId,
        role: req.user.role,
        path: req.originalUrl,
      });
      return res.status(403).json(
        ResponseFormatter.error('Access denied. Super-admin privileges required.', 403)
      );
    }

    next();
  } catch (error) {
    log.error('isSuperAdminMiddleware: Error', { error: error.message });
    return res.status(500).json(
      ResponseFormatter.error('Authorization check failed', 500)
    );
  }
};

module.exports = isSuperAdminMiddleware;
