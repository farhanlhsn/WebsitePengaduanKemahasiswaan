/**
 * Spin up the test Postgres container and run Prisma migrations + minimal
 * seed so each integration test starts with a known good schema.
 *
 * If a TEST_DATABASE_URL is already set externally (e.g. CI provisions its
 * own Postgres service), we skip docker management and reuse that URL.
 */

const { execSync, spawnSync } = require('node:child_process');
const path = require('node:path');

const TEST_DB_URL = 'postgresql://test:test@localhost:55432/pengaduan_test?schema=public';
const PROJECT_ROOT = path.resolve(__dirname, '../..');

function run(cmd, opts = {}) {
  return execSync(cmd, { stdio: 'inherit', cwd: PROJECT_ROOT, ...opts });
}

function isContainerHealthy() {
  const out = spawnSync(
    'docker',
    ['inspect', '--format', '{{.State.Health.Status}}', 'pengaduan-postgres-test'],
    { encoding: 'utf8' }
  );
  return out.status === 0 && out.stdout.trim() === 'healthy';
}

async function waitForHealthy(timeoutMs = 30000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (isContainerHealthy()) return;
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error('postgres-test container did not become healthy in time');
}

module.exports = async function globalSetup() {
  // Allow CI to inject its own DB.
  if (process.env.TEST_DATABASE_URL) {
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
    console.log('[integration] Reusing externally-provided TEST_DATABASE_URL');
  } else {
    console.log('[integration] Starting Postgres test container...');
    try {
      run('docker compose -f docker-compose.test.yml up -d --wait');
    } catch (err) {
      // Older docker compose without --wait flag — fall back to manual healthcheck loop.
      run('docker compose -f docker-compose.test.yml up -d');
      await waitForHealthy();
    }
    process.env.DATABASE_URL = TEST_DB_URL;
  }

  // Required by config/env.js validateEnv if loaded by services.
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_'.padEnd(64, 'x');
  process.env.JWT_REFRESH_SECRET =
    process.env.JWT_REFRESH_SECRET || 'test_refresh_secret_'.padEnd(64, 'x');
  process.env.NODE_ENV = 'test';
  // Ensure email service stays disabled during tests.
  delete process.env.SMTP_HOST;
  delete process.env.SMTP_USER;

  console.log('[integration] Applying Prisma migrations to test DB...');
  run('npx prisma migrate deploy', { env: { ...process.env } });

  // Persist URL for the worker processes (jest spawns workers with this env)
  process.env.DATABASE_URL = process.env.DATABASE_URL;

  // Hand state to teardown so it knows whether to docker-compose-down.
  global.__INTEGRATION_OWNS_DOCKER__ = !process.env.CI_PROVIDED_TEST_DB;
};
