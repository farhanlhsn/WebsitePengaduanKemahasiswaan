/**
 * Granular rate limiters for sensitive endpoints.
 *
 * These are applied IN ADDITION to the global rate limiter (500/15min).
 * Each limiter targets a specific abuse vector.
 */

const rateLimit = require('express-rate-limit');
const redisClient = require('../utils/redis');
const RedisStore = require('rate-limit-redis').default || require('rate-limit-redis');

function createLimiter({ windowMs, max, message, skipSuccessfulRequests = false, keyGenerator }) {
  const options = {
    windowMs,
    max,
    message: {
      status: 'error',
      statusCode: 429,
      message,
      timestamp: new Date().toISOString(),
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests,
  };

  if (redisClient) {
    options.store = new RedisStore({
      sendCommand: (...args) => redisClient.call(...args),
    });
  }

  // Only set keyGenerator if custom one provided; otherwise use default (IP-based)
  if (keyGenerator) {
    options.keyGenerator = keyGenerator;
    // Disable the IPv6 validation since our custom generators use userId, not IP
    options.validate = { xForwardedForHeader: false, default: true };
  }

  return rateLimit(options);
}

// Login: 5 failed attempts per IP per 15 minutes (uses default IP key)
const loginLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Terlalu banyak percobaan login. Coba lagi dalam 15 menit.',
  skipSuccessfulRequests: true,
});

// Register: 3 per IP per hour (uses default IP key)
const registerLimiter = createLimiter({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: 'Terlalu banyak percobaan registrasi dari IP ini. Coba lagi nanti.',
});

// Forgot password: 3 per IP per 15 minutes (uses default IP key)
const forgotPasswordLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 3,
  message: 'Terlalu banyak permintaan reset password. Coba lagi dalam 15 menit.',
});

// Refresh token: 60 per IP per 15 minutes (uses default IP key)
const refreshTokenLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 60,
  message: 'Terlalu banyak permintaan refresh token.',
});

// File upload: 10 per user per minute (custom key: userId)
const uploadLimiter = createLimiter({
  windowMs: 60 * 1000,
  max: 10,
  message: 'Terlalu banyak upload. Tunggu sebentar.',
  keyGenerator: (req) => `upload_${req.user?.userId || 'anon'}`,
});

// Report creation: 5 per user per hour (custom key: userId)
const createReportLimiter = createLimiter({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: 'Anda sudah mencapai batas pembuatan laporan per jam.',
  keyGenerator: (req) => `report_${req.user?.userId || 'anon'}`,
});

module.exports = {
  loginLimiter,
  registerLimiter,
  forgotPasswordLimiter,
  refreshTokenLimiter,
  uploadLimiter,
  createReportLimiter,
};
