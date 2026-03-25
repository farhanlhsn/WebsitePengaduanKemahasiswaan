const ResponseFormatter = require('../utils/responseFormatter');
const { getLogger } = require('../utils/logger');

const log = getLogger('middleware:isAdmin');

/**
 * Middleware to check if the user has ADMIN role
 * Must be used after authMiddleware
 */
const isAdminMiddleware = (req, res, next) => {
  try {
    // Check if user exists in request (set by authMiddleware)
    if (!req.user) {
      log.warn('isAdminMiddleware: No user in request');
      return res.status(401).json(
        ResponseFormatter.error('Authentication required', 401)
      );
    }

    // Check if user has ADMIN role
    if (req.user.role !== 'ADMIN') {
      log.warn('isAdminMiddleware: Access denied for non-admin', {
        userId: req.user.userId,
        role: req.user.role,
        path: req.originalUrl
      });
      return res.status(403).json(
        ResponseFormatter.error('Access denied. Admin privileges required.', 403)
      );
    }

    log.info('isAdminMiddleware: Admin access granted', {
      userId: req.user.userId,
      path: req.originalUrl
    });
    
    next();
  } catch (error) {
    log.error('isAdminMiddleware: Error', { error: error.message });
    return res.status(500).json(
      ResponseFormatter.error('Authorization check failed', 500)
    );
  }
};

module.exports = isAdminMiddleware;


