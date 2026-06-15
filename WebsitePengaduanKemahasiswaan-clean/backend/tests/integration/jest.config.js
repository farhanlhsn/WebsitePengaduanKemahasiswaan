/**
 * Separate Jest config for integration tests (BE-3).
 *
 * Differences from the main unit-test config:
 *   - testMatch points only at this folder
 *   - testTimeout raised to 30s for slow DB queries
 *   - globalSetup / globalTeardown run once for the suite, bringing up Postgres
 *     and applying migrations before tests, then dropping the volume after
 *   - setupFilesAfterEnv resets DB tables before each test (so tests are isolated
 *     without needing full re-migrate per test)
 */

const path = require('path');

module.exports = {
  rootDir: path.resolve(__dirname, '../..'),
  testEnvironment: 'node',
  testMatch: ['<rootDir>/tests/integration/**/*.test.js'],
  testTimeout: 30000,
  globalSetup: '<rootDir>/tests/integration/globalSetup.js',
  globalTeardown: '<rootDir>/tests/integration/globalTeardown.js',
  setupFilesAfterEnv: [
    '<rootDir>/tests/integration/setupEnv.js',
    '<rootDir>/tests/integration/resetDb.js',
  ],
  // Keep coverage off — too slow for integration runs and we collect from unit tests.
  collectCoverage: false,
  // Run integration suites serially so they don't collide on the shared DB.
  maxWorkers: 1,
};
