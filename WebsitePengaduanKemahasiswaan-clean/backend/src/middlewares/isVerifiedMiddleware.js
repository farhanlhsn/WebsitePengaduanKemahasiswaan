const prisma = require('../utils/prisma');
const ResponseFormatter = require('../utils/responseFormatter');
const { getLogger } = require('../utils/logger');
const { isAdmin } = require('../utils/rbac');

const log = getLogger('middleware:isVerified');

/**
 * Middleware to ensure the authenticated user is verified (isVerified=true).
 * Must be used after authMiddleware.
 *
 * - Admin tier (ADMIN + SUPERADMIN) bypass this check.
 * - Only blocks MAHASISWA users who are not yet verified.
 * - Use on write endpoints: create report, send message, upload files.
 */
const isVerifiedMiddleware = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json(
        ResponseFormatter.error('Authentication required', 401)
      );
    }

    if (isAdmin(req.user)) return next();

    // Query DB for current verification status
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { isVerified: true }
    });

    if (!user) {
      return res.status(401).json(
        ResponseFormatter.error('User not found', 401)
      );
    }

    if (!user.isVerified) {
      log.warn('Unverified user attempted restricted action', {
        userId: req.user.userId,
        path: req.originalUrl,
        method: req.method
      });
      return res.status(403).json(
        ResponseFormatter.error(
          'Akun Anda belum diverifikasi. Silakan tunggu verifikasi dari admin.',
          403
        )
      );
    }

    next();
  } catch (error) {
    log.error('isVerifiedMiddleware error', { error: error.message });
    return res.status(500).json(
      ResponseFormatter.error('Verification check failed', 500)
    );
  }
};

module.exports = isVerifiedMiddleware;
