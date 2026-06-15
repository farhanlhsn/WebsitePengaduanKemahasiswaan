/**
 * Password policy validation utility.
 *
 * Rules:
 * - Min 8 characters
 * - Max 128 characters (bcrypt limit consideration)
 * - At least 1 lowercase letter
 * - At least 1 uppercase letter
 * - At least 1 digit
 * - Not in common password list
 */

const POLICY = {
  minLength: 8,
  maxLength: 128,
  requireLower: true,
  requireUpper: true,
  requireDigit: true,
  requireSpecial: false, // can be enabled later
};

const COMMON_PASSWORDS = new Set([
  'password', 'password1', 'password123', '12345678', '123456789',
  '1234567890', 'qwerty12', 'qwerty123', 'admin123', 'letmein1',
  'welcome1', 'monkey123', 'dragon12', 'master12', 'login123',
  'abc12345', 'abcdefgh', 'trustno1', 'sunshine1', 'iloveyou1',
  'princess1', 'football1', 'shadow12', 'michael1', 'superman1',
]);

/**
 * Validate password against policy.
 * @param {string} password - The password to validate
 * @returns {{ valid: boolean, errors: string[] }}
 */
function validatePassword(password) {
  const errors = [];

  if (!password || typeof password !== 'string') {
    return { valid: false, errors: ['Password wajib diisi'] };
  }

  if (password.length < POLICY.minLength) {
    errors.push(`Password minimal ${POLICY.minLength} karakter`);
  }
  if (password.length > POLICY.maxLength) {
    errors.push(`Password maksimal ${POLICY.maxLength} karakter`);
  }
  if (POLICY.requireLower && !/[a-z]/.test(password)) {
    errors.push('Password harus mengandung huruf kecil');
  }
  if (POLICY.requireUpper && !/[A-Z]/.test(password)) {
    errors.push('Password harus mengandung huruf besar');
  }
  if (POLICY.requireDigit && !/[0-9]/.test(password)) {
    errors.push('Password harus mengandung angka');
  }
  if (POLICY.requireSpecial && !/[^A-Za-z0-9]/.test(password)) {
    errors.push('Password harus mengandung karakter spesial');
  }
  if (COMMON_PASSWORDS.has(password.toLowerCase())) {
    errors.push('Password terlalu umum, gunakan yang lebih unik');
  }

  return { valid: errors.length === 0, errors };
}

module.exports = { validatePassword, POLICY };
