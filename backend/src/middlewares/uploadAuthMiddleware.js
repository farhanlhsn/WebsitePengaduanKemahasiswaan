const jwt = require('jsonwebtoken');
const { getLogger } = require('../utils/logger');
const log = getLogger('middleware:uploadAuth');

const uploadAuthMiddleware = (req, res, next) => {
  try {
    let isAuthenticated = false;

    // 1. Coba periksa Authorization header (Bearer token)
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        jwt.verify(token, process.env.JWT_SECRET);
        isAuthenticated = true;
      } catch (err) {
        // Abaikan sementara, kita akan cek cookie
      }
    }

    // 2. Jika tidak ada header atau header tidak valid (seperti di elemen <img> HTML), cek dari cookie
    if (!isAuthenticated && req.cookies && req.cookies.refreshToken) {
      try {
        jwt.verify(req.cookies.refreshToken, process.env.JWT_REFRESH_SECRET);
        isAuthenticated = true;
      } catch (err) {
        // Cookie gagal diverifikasi
      }
    }

    if (!isAuthenticated) {
      log.warn('Unauthorized access attempt to uploads directory', { ip: req.ip, path: req.originalUrl });
      return res.status(401).json({ error: 'Unauthorized access to file' });
    }

    next();
  } catch (error) {
    log.error('File authentication error', { error: error.message });
    return res.status(500).json({ error: 'Server error during file authentication' });
  }
};

module.exports = uploadAuthMiddleware;
