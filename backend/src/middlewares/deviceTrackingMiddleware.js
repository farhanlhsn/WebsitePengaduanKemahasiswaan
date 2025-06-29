const deviceDetection = require('../utils/deviceDetection');

/**
 * Middleware untuk menambahkan informasi device ke request
 */
const deviceTrackingMiddleware = (req, res, next) => {
  // Ambil IP address dari header proxy atau fallback ke remoteAddress
  const forwarded = req.headers['x-forwarded-for'];
  const realIp =
    (Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(',')[0]) ||
    req.socket?.remoteAddress ||
    req.connection?.remoteAddress ||
    'unknown';

  // Override req.ip agar semua modul downstream bisa pakai IP yang benar
  req.ip = realIp;

  // Siapkan parameter tambahan untuk kestabilan fingerprint (jika tersedia)
  const extraFingerprint = {
    acceptLanguage: req.headers['accept-language'] || '',
    fingerprintId: req.headers['x-device-fingerprint'] || '', // optional cookie dari frontend
  };

  // Ambil informasi device yang sudah ditingkatkan stabilitasnya
  req.deviceInfo = deviceDetection.getDeviceInfo(req, extraFingerprint);

  next();
};

module.exports = deviceTrackingMiddleware;
