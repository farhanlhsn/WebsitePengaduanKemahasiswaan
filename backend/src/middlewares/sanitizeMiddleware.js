const { sanitizeRichText } = require('../utils/htmlSanitize');

/**
 * Middleware to sanitize request body strings to prevent XSS.
 * Rich text fields are allowlisted; other strings are stripped to plain text.
 *
 * Pengecualian: field password tidak boleh dimodifikasi — sanitasi HTML
 * mengubah karakter seperti `&` menjadi `&amp;` dan tag-like sequence dihapus,
 * sehingga hash yang disimpan tidak lagi cocok dengan input user. Password
 * tidak pernah dirender sebagai HTML, jadi risiko XSS tidak berlaku.
 */
const PASSWORD_KEYS = new Set(['password', 'currentPassword', 'newPassword']);

const sanitizeMiddleware = (req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }
  next();
};

/**
 * Recursively sanitize all string values in an object.
 */
function sanitizeObject(obj) {
  if (Array.isArray(obj)) {
    return obj.map(item => {
      if (typeof item === 'string') return sanitizeString(item);
      if (typeof item === 'object' && item !== null) return sanitizeObject(item);
      return item;
    });
  }

  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    if (PASSWORD_KEYS.has(key)) {
      sanitized[key] = value;
    } else if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value);
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

/**
 * Sanitize a single string with rich-text allowlist.
 */
function sanitizeString(str) {
  return sanitizeRichText(str);
}

module.exports = sanitizeMiddleware;
