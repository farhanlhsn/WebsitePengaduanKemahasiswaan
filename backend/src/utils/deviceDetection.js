const crypto = require('crypto');

/**
 * Generate unique device ID based on user agent and optional fingerprint
 * @param {string} userAgent
 * @param {string} acceptLanguage
 * @param {string} fingerprintId
 * @returns {string}
 */
const generateDeviceId = (userAgent, acceptLanguage = '', fingerprintId = '') => {
  // Gabungkan elemen fingerprinting yang cenderung stabil
  const deviceString = `${userAgent}-${acceptLanguage}-${fingerprintId}`;
  return crypto.createHash('sha256').update(deviceString).digest('hex').substring(0, 32);
};


/**
 * Parse user agent to get readable device information
 * @param {string} userAgent - User agent string
 * @returns {object} - Parsed device info
 */
const parseUserAgent = (userAgent) => {
  let browser = 'Unknown Browser';
  let os = 'Unknown OS';
  let deviceType = 'Desktop';

  // Detect browser
  if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
    browser = 'Chrome';
  } else if (userAgent.includes('Firefox')) {
    browser = 'Firefox';
  } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
    browser = 'Safari';
  } else if (userAgent.includes('Edg')) {
    browser = 'Edge';
  } else if (userAgent.includes('Opera') || userAgent.includes('OPR')) {
    browser = 'Opera';
  }

  // Detect OS
  if (userAgent.includes('Windows')) {
    os = 'Windows';
  } else if (userAgent.includes('Mac OS X') || userAgent.includes('macOS')) {
    os = 'macOS';
  } else if (userAgent.includes('Linux')) {
    os = 'Linux';
  } else if (userAgent.includes('Android')) {
    os = 'Android';
    deviceType = 'Mobile';
  } else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) {
    os = 'iOS';
    deviceType = userAgent.includes('iPad') ? 'Tablet' : 'Mobile';
  }

  // Detect if mobile
  if (userAgent.includes('Mobile') && deviceType === 'Desktop') {
    deviceType = 'Mobile';
  } else if (userAgent.includes('Tablet')) {
    deviceType = 'Tablet';
  }

  return {
    browser,
    os,
    deviceType,
    deviceName: `${browser} on ${os}`,
    fullUserAgent: userAgent
  };
};

/**
 * Get device information from request
 * @param {object} req - Express request object
 * @param {object} extra - Tambahan info fingerprinting (opsional)
 * @returns {object} - Device information
 */
const getDeviceInfo = (req, extra = {}) => {
  const userAgent = req.headers['user-agent'] || '';
  // req.ip sudah trust-proxy-aware (dihitung Express). Jangan baca header
  // X-Forwarded-For mentah di sini — elemen pertamanya bisa dipalsukan klien.
  const ipAddress =
    req.ip || req.socket?.remoteAddress || req.connection?.remoteAddress || 'unknown';
  const { acceptLanguage = '', fingerprintId = '' } = extra;

  const deviceInfo = parseUserAgent(userAgent);

  // Gunakan fingerprint yang lebih stabil tanpa mengandalkan IP
  const deviceId = generateDeviceId(userAgent, acceptLanguage, fingerprintId);

  return {
    deviceId,
    deviceName: deviceInfo.deviceName,
    userAgent,
    ipAddress,
    ...deviceInfo
  };
};

module.exports = {
  generateDeviceId,
  parseUserAgent,
  getDeviceInfo
};

