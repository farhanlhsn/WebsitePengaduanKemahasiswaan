const path = require('path');

// E2E bootstrap passes env explicitly — do not let backend/.env override test settings.
if (process.env.E2E_BOOTSTRAP !== 'true') {
  require('dotenv').config({ path: path.resolve(__dirname, '../../.env'), override: true });
}

/**
 * Required environment variables — server will refuse to start if missing.
 */
const REQUIRED_VARS = [
  { name: 'DATABASE_URL', description: 'PostgreSQL connection string' },
  { name: 'JWT_SECRET', description: 'Secret key for access token signing' },
  { name: 'JWT_REFRESH_SECRET', description: 'Secret key for refresh token signing' },
];

/**
 * Optional environment variables with defaults.
 */
const OPTIONAL_VARS = [
  { name: 'PORT', default: '6060', description: 'Server port' },
  { name: 'NODE_ENV', default: 'development', description: 'Environment mode' },
  { name: 'FRONTEND_URL', default: 'http://localhost:5173', description: 'Frontend URL for CORS' },
  { name: 'SMTP_HOST', default: null, description: 'SMTP host (notifications disabled if missing)' },
  { name: 'SMTP_USER', default: null, description: 'SMTP username' },
  { name: 'SMTP_PASS', default: null, description: 'SMTP password' },
  { name: 'SMTP_PORT', default: '587', description: 'SMTP port' },
  { name: 'SMTP_FROM', default: null, description: 'Email sender address' },
  { name: 'SEED_SUPERADMIN_EMAIL', default: null, description: 'SUPERADMIN bootstrap email (seed only)' },
  { name: 'SEED_SUPERADMIN_NAME', default: null, description: 'SUPERADMIN bootstrap display name' },
  { name: 'SEED_SUPERADMIN_PASSWORD', default: null, description: 'SUPERADMIN bootstrap password' },
];

/**
 * Validate environment variables on startup.
 * Exits process if required vars are missing.
 */
function validateEnv() {
  const missing = [];
  const warnings = [];

  // Check required vars
  for (const { name, description } of REQUIRED_VARS) {
    if (!process.env[name] || process.env[name].trim() === '') {
      missing.push(`  - ${name}: ${description}`);
    }
  }

  if (missing.length > 0) {
    const message = [
      '',
      '══════════════════════════════════════════════════════════',
      '  FATAL: Missing required environment variables',
      '══════════════════════════════════════════════════════════',
      '',
      ...missing,
      '',
      '  Please set these variables in your .env file.',
      '',
    ].join('\n');

    console.error(message);
    process.exit(1);
  }

  // Set defaults for optional vars
  for (const { name, default: defaultValue, description } of OPTIONAL_VARS) {
    if (!process.env[name] && defaultValue) {
      process.env[name] = defaultValue;
      warnings.push(`${name} not set, using default: ${defaultValue}`);
    } else if (!process.env[name] && !defaultValue) {
      warnings.push(`${name} not set — ${description}`);
    }
  }

  // Log warnings
  if (warnings.length > 0) {
    console.warn('[env] Warnings:');
    warnings.forEach(w => console.warn(`  - ${w}`));
  }

  // Security checks for production
  if (process.env.NODE_ENV === 'production') {
    const defaultSecrets = ['your-secret-key', 'change-me', 'secret', 'jwt_secret'];
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
      console.error('[env] FATAL: JWT_SECRET must be at least 32 characters in production');
      process.exit(1);
    }
    if (defaultSecrets.some((s) => process.env.JWT_SECRET.toLowerCase().includes(s))) {
      console.error('[env] FATAL: JWT_SECRET appears to use a default/weak value');
      process.exit(1);
    }
    if (!process.env.JWT_REFRESH_SECRET || process.env.JWT_REFRESH_SECRET.length < 32) {
      console.error('[env] FATAL: JWT_REFRESH_SECRET must be at least 32 characters in production');
      process.exit(1);
    }
    if (!process.env.FRONTEND_URL || process.env.FRONTEND_URL.trim() === '') {
      console.error('[env] FATAL: FRONTEND_URL is required in production');
      process.exit(1);
    }
    if (!process.env.REDIS_URL && process.env.ALLOW_IN_MEMORY_RATE_LIMIT !== 'true') {
      console.error(
        '[env] FATAL: REDIS_URL is required in production (set ALLOW_IN_MEMORY_RATE_LIMIT=true to override)'
      );
      process.exit(1);
    }
    if (!process.env.SMTP_HOST) {
      console.warn('[env] WARNING: SMTP not configured — email notifications disabled in production');
    }
  }

  console.log(`[env] Validation passed (${process.env.NODE_ENV}, port: ${process.env.PORT})`);
}

module.exports = { validateEnv };
