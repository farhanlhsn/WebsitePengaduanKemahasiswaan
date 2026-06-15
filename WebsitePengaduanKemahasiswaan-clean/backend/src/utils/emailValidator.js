/**
 * Email domain whitelist validator.
 *
 * Only allows registration from approved campus email domains.
 * Configurable via ALLOWED_EMAIL_DOMAINS env var (comma-separated).
 *
 * If ALLOWED_EMAIL_DOMAINS is not set or empty, all domains are allowed
 * (backward compatible for development).
 */

const ALLOWED_DOMAINS = (process.env.ALLOWED_EMAIL_DOMAINS || '')
  .split(',')
  .map(d => d.trim().toLowerCase())
  .filter(Boolean);

/**
 * Check if email domain is in the whitelist.
 * If no whitelist configured, returns true (allow all).
 *
 * @param {string} email
 * @returns {boolean}
 */
function isAllowedDomain(email) {
  // If no whitelist configured, allow all (dev mode)
  if (ALLOWED_DOMAINS.length === 0) return true;

  if (!email || typeof email !== 'string') return false;
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return false;
  return ALLOWED_DOMAINS.includes(domain);
}

/**
 * Get list of allowed domains for display in error messages.
 * @returns {string[]}
 */
function getAllowedDomains() {
  return ALLOWED_DOMAINS;
}

module.exports = { isAllowedDomain, getAllowedDomains, ALLOWED_DOMAINS };
