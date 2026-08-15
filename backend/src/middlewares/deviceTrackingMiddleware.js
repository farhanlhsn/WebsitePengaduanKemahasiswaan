const deviceDetection = require('../utils/deviceDetection');

/**
 * Middleware untuk menambahkan informasi device ke request.
 *
 * Security (audit S1): JANGAN menimpa `req.ip` dari header mentah
 * `X-Forwarded-For`. Elemen pertama header itu dapat dikontrol klien dan
 * memungkinkan penyerang mem-bypass rate limiter berbasis IP dengan mengganti
 * header tiap request. Biarkan Express menghitung `req.ip` berdasarkan
 * pengaturan `trust proxy` (lihat app.js) — nilai itulah yang dipakai
 * downstream (rate limiter, device tracking, audit log).
 */
const deviceTrackingMiddleware = (req, res, next) => {
  // Siapkan parameter tambahan untuk kestabilan fingerprint (jika tersedia)
  const extraFingerprint = {
    acceptLanguage: req.headers['accept-language'] || '',
    fingerprintId: req.headers['x-device-fingerprint'] || '', // optional cookie dari frontend
  };

  // Ambil informasi device; ipAddress diambil dari req.ip (trust-proxy-aware).
  req.deviceInfo = deviceDetection.getDeviceInfo(req, extraFingerprint);

  next();
};

module.exports = deviceTrackingMiddleware;
