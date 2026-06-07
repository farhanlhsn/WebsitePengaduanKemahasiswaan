/**
 * Integration test environment bootstrap.
 * Runs once before each test file via setupFilesAfterEnv.
 */

// Disable Redis unless explicitly enabled for integration tests.
if (!process.env.TEST_REDIS_URL) {
  delete process.env.REDIS_URL;
} else {
  process.env.REDIS_URL = process.env.TEST_REDIS_URL;
}

process.env.NODE_ENV = process.env.NODE_ENV || 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_'.padEnd(64, 'x');
process.env.JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET || 'test_refresh_secret_'.padEnd(64, 'x');

delete process.env.SMTP_HOST;
delete process.env.SMTP_USER;
