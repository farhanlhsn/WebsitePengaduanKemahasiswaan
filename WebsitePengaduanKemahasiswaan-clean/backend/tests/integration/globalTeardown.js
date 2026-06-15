const { execSync } = require('node:child_process');
const path = require('node:path');

module.exports = async function globalTeardown() {
  // Close shared singletons before tearing down Postgres.
  try {
    const prisma = require('../../src/utils/prisma');
    if (prisma?.$disconnect) await prisma.$disconnect();
  } catch {
    // ignore if prisma was never loaded
  }

  try {
    const redis = require('../../src/utils/redis');
    if (redis && (redis.status === 'ready' || redis.status === 'connect')) {
      await redis.quit();
    }
  } catch {
    // ignore if redis was never loaded
  }

  if (process.env.KEEP_TEST_DB === '1') {
    console.log('[integration] KEEP_TEST_DB=1 — leaving postgres-test running');
    return;
  }
  if (!global.__INTEGRATION_OWNS_DOCKER__) {
    console.log('[integration] Externally-managed test DB; skipping docker down');
    return;
  }

  try {
    execSync('docker compose -f docker-compose.test.yml down -v', {
      stdio: 'inherit',
      cwd: path.resolve(__dirname, '../..'),
    });
  } catch (err) {
    console.warn('[integration] docker compose down failed:', err.message);
  }
};
