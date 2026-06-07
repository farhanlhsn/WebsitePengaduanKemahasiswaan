/**
 * Tests for environment variable validation logic.
 */
describe('Environment Validation', () => {
  beforeAll(() => {
    // Ensure required vars are set for tests
    process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/test';
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-32-characters-minimum';
    process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test-refresh-32-characters-min';
  });

  it('should export validateEnv function', () => {
    const { validateEnv } = require('../../src/config/env');
    expect(typeof validateEnv).toBe('function');
  });

  it('should not throw when all required vars are present', () => {
    const { validateEnv } = require('../../src/config/env');
    expect(() => validateEnv()).not.toThrow();
  });

  it('should set default PORT', () => {
    const { validateEnv } = require('../../src/config/env');
    validateEnv();
    expect(process.env.PORT).toBeDefined();
  });

  it('should set default NODE_ENV', () => {
    const { validateEnv } = require('../../src/config/env');
    validateEnv();
    expect(process.env.NODE_ENV).toBeDefined();
  });
});
