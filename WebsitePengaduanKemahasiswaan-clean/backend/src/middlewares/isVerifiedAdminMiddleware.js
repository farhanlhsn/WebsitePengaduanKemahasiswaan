const prisma = require('../utils/prisma');
const ResponseFormatter = require('../utils/responseFormatter');
const { getLogger } = require('../utils/logger');

const log = getLogger('middleware:isVerifiedAdmin');

/**
 * Middleware to verify that the authenticated admin has isVerified=true in the database.
 * Must be used after authMiddleware and isAdminMiddleware in the middleware chain.
 *
 * This queries the database to confirm the admin's verification status,
 * preventing unverified admins from accessing protected endpoints
 * (e.g., registering new admin accounts).
 *
 * @param {import('express').Request} req - Express request object (must have req.user set by authMiddleware)
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} next - Express next function
 * @returns {void}
 */
const isVerifiedAdminMiddleware = async (req, res, next) => {
  try {
    // Check if user exists in request (set by authMiddleware)
    if (!req.user) {
      log.warn('isVerifiedAdminMiddleware: No user in request');
      return res.status(401).json(
        ResponseFormatter.error('Authentication required', 401)
      );
    }

    // Query the database for the admin's current isVerified status
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { isVerified: true }
    });

    if (!user) {
      log.warn('isVerifiedAdminMiddleware: User not found in database', {
        userId: req.user.userId
      });
      return res.status(401).json(
        ResponseFormatter.error('User not found', 401)
      );
    }

    // Check if admin is verified
    if (!user.isVerified) {
      log.warn('isVerifiedAdminMiddleware: Access denied for unverified admin', {
        userId: req.user.userId,
        path: req.originalUrl
      });
      return res.status(403).json(
        ResponseFormatter.error('Access denied. Admin account is not verified.', 403)
      );
    }

    log.info('isVerifiedAdminMiddleware: Verified admin access granted', {
      userId: req.user.userId,
      path: req.originalUrl
    });

    next();
  } catch (error) {
    log.error('isVerifiedAdminMiddleware: Error', { error: error.message });
    return res.status(500).json(
      ResponseFormatter.error('Verification check failed', 500)
    );
  }
};

module.exports = isVerifiedAdminMiddleware;
