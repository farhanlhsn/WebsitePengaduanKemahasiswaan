/**
 * Stop E2E servers and optional Docker Postgres container.
 */

import { readFileSync, unlinkSync } from 'node:fs';
import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STATE_FILE = path.join(__dirname, '.e2e-state.json');
const BACKEND_ROOT = path.resolve(__dirname, '../../../backend');

function killPid(pid) {
  if (!pid) return;
  try {
    process.kill(pid, 'SIGTERM');
  } catch {
    /* already stopped */
  }
}

export default async function globalTeardown() {
  let state = { skipped: true };
  try {
    state = JSON.parse(readFileSync(STATE_FILE, 'utf8'));
  } catch {
    return;
  }

  if (state.skipped) return;

  console.log('[e2e-teardown] Stopping servers...');
  killPid(state.frontendPid);
  killPid(state.backendPid);

  if (state.ownsDocker) {
    try {
      execSync('docker compose -f docker-compose.test.yml down -v', {
        cwd: BACKEND_ROOT,
        stdio: 'inherit',
      });
    } catch (err) {
      console.warn('[e2e-teardown] Docker cleanup failed:', err.message);
    }
  }

  try {
    unlinkSync(STATE_FILE);
  } catch {
    /* ignore */
  }
}
