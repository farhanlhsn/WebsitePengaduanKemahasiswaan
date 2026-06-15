#!/usr/bin/env node
/**
 * JWT Secret Rotation Script
 * 
 * This script generates new cryptographically strong secrets for JWT authentication.
 * It outputs the new values that should be manually placed in the .env file.
 * 
 * Usage:
 *   node scripts/rotate-secrets.js
 * 
 * After running this script:
 * 1. Copy the generated values
 * 2. Update your .env file with the new JWT_SECRET and JWT_REFRESH_SECRET
 * 3. Restart the application
 * 4. All existing tokens will be invalidated (users will need to re-login)
 * 
 * IMPORTANT: Never commit .env files or secrets to version control.
 */

const crypto = require('crypto');

function generateSecret(bytes = 64) {
  return crypto.randomBytes(bytes).toString('hex');
}

console.log('='.repeat(70));
console.log('  JWT Secret Rotation');
console.log('='.repeat(70));
console.log('');
console.log('Generated new cryptographically strong secrets (64 bytes / 128 hex chars):');
console.log('');
console.log(`JWT_SECRET=${generateSecret(64)}`);
console.log('');
console.log(`JWT_REFRESH_SECRET=${generateSecret(64)}`);
console.log('');
console.log('='.repeat(70));
console.log('');
console.log('INSTRUCTIONS:');
console.log('  1. Copy the values above');
console.log('  2. Open backend/.env and replace the existing JWT_SECRET and JWT_REFRESH_SECRET');
console.log('  3. Restart the backend server');
console.log('  4. All existing user sessions will be invalidated');
console.log('');
console.log('WARNING:');
console.log('  - Never commit .env files to version control');
console.log('  - Store secrets securely (use a secrets manager in production)');
console.log('  - Rotate secrets periodically (recommended: every 90 days)');
console.log('');
console.log('='.repeat(70));
