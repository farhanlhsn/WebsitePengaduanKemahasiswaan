const jwt = require('jsonwebtoken');
const prisma = require('../utils/prisma');
const { hashToken } = require('../utils/tokenHash');
const { getLogger } = require('../utils/logger');
const log = getLogger('middleware:uploadAuth');

/**
 * Authentication middleware for file uploads/downloads.
 * Supports Bearer access token (API calls) and refresh token cookie (browser <img> tags).
 * Validation rules differ by authSource — never mix them on a single decoded payload.
 */
const uploadAuthMiddleware = async (req, res, next) => {
  try {
    let decoded = null;
    let authSource = null;

    // 1. Try Authorization header (Bearer access token)
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
        authSource = 'access';
      } catch (err) {
        // Invalid/expired bearer — fall through to refresh cookie
      }
    }

    // 2. Fallback to refresh token cookie (browser <img> elements)
    if (!decoded && req.cookies?.refreshToken) {
      const refreshToken = req.cookies.refreshToken;
      try {
        const refreshDecoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        authSource = 'refresh';

        const storedToken = await prisma.refreshToken.findFirst({
          where: {
            tokenHash: hashToken(refreshToken),
            userId: refreshDecoded.userId,
            deviceId: refreshDecoded.deviceId,
            expiresAt: { gt: new Date() },
          },
        });

        if (!storedToken) {
          log.warn('Refresh cookie not found or expired in DB', {
            ip: req.ip,
            path: req.originalUrl,
            userId: refreshDecoded.userId,
          });
          return res.status(401).json({ error: 'Unauthorized access to file' });
        }

        decoded = refreshDecoded;
      } catch (err) {
        // Cookie invalid or expired
      }
    }

    if (!decoded || !authSource) {
      log.warn('Unauthorized file access attempt', { ip: req.ip, path: req.originalUrl });
      return res.status(401).json({ error: 'Unauthorized access to file' });
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, role: true, name: true, tokenVersion: true, deletedAt: true },
    });

    if (!user || user.deletedAt) {
      return res.status(401).json({ error: 'Unauthorized access to file' });
    }

    if (authSource === 'access') {
      if (decoded.tokenVersion === undefined || decoded.tokenVersion !== user.tokenVersion) {
        log.warn('Revoked access token used for file access', { userId: user.id });
        return res.status(401).json({ error: 'Unauthorized access to file' });
      }
    }

    req.user = {
      userId: user.id,
      role: user.role,
      name: user.name,
      authSource,
    };

    next();
  } catch (error) {
    log.error('File authentication error', { error: error.message });
    return res.status(500).json({ error: 'Server error during file authentication' });
  }
};

module.exports = uploadAuthMiddleware;
