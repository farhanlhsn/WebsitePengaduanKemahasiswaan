/**
 * Start Postgres (if needed), migrate, seed E2E fixtures, then boot backend + Vite.
 */

import { spawn, execSync } from 'node:child_process';
import { writeFileSync, readFileSync, unlinkSync, existsSync } from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '../../..');
const BACKEND_ROOT = path.join(REPO_ROOT, 'backend');
const FRONTEND_ROOT = path.join(REPO_ROOT, 'frontend');
const STATE_FILE = path.join(__dirname, '.e2e-state.json');

const DEFAULT_BACKEND_PORT = Number(process.env.E2E_BACKEND_PORT || 6061);
const DEFAULT_FRONTEND_PORT = Number(process.env.E2E_FRONTEND_PORT || 5199);
const DEFAULT_DB_URL =
  'postgresql://test:test@localhost:55432/pengaduan_test?schema=public';

function killPid(pid) {
  if (!pid) return;
  try {
    process.kill(pid, 'SIGTERM');
  } catch {
    /* already stopped */
  }
}

function cleanupStaleE2eState() {
  if (!existsSync(STATE_FILE)) return;
  try {
    const state = JSON.parse(readFileSync(STATE_FILE, 'utf8'));
    if (!state.skipped) {
      console.log('[e2e-setup] Cleaning up stale E2E servers from previous run...');
      killPid(state.frontendPid);
      killPid(state.backendPid);
    }
  } catch {
    /* ignore corrupt state */
  }
  try {
    unlinkSync(STATE_FILE);
  } catch {
    /* ignore */
  }
}

function isPortFree(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.unref();
    server.on('error', () => resolve(false));
    server.listen({ port, host: '127.0.0.1' }, () => {
      server.close(() => resolve(true));
    });
  });
}

async function findFreePort(preferredPort, maxAttempts = 20) {
  for (let offset = 0; offset < maxAttempts; offset += 1) {
    const port = preferredPort + offset;
    if (await isPortFree(port)) return port;
  }
  throw new Error(`No free port found near ${preferredPort}`);
}

async function waitForUrl(url, timeoutMs = 90_000) {
  const deadline = Date.now() + timeoutMs;
  let lastError = null;

  while (Date.now() < deadline) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
      if (res.ok) return;
      lastError = new Error(`HTTP ${res.status}`);
    } catch (err) {
      lastError = err;
    }
    await new Promise((r) => setTimeout(r, 750));
  }

  throw new Error(`Timeout waiting for ${url}: ${lastError?.message || 'unknown'}`);
}

function run(cmd, opts = {}) {
  execSync(cmd, { stdio: 'inherit', cwd: BACKEND_ROOT, ...opts });
}

function canReachDatabase(databaseUrl) {
  try {
    execSync(`node scripts/check-db.js "${databaseUrl}"`, {
      cwd: BACKEND_ROOT,
      stdio: 'ignore',
      timeout: 10_000,
    });
    return true;
  } catch {
    return false;
  }
}

async function startPostgresIfNeeded(databaseUrl) {
  if (process.env.E2E_DATABASE_URL || process.env.CI) {
    console.log('[e2e-setup] Using provided database URL');
    return false;
  }

  if (canReachDatabase(databaseUrl)) {
    console.log('[e2e-setup] Reusing existing Postgres at default test URL');
    return false;
  }

  console.log('[e2e-setup] Starting Postgres test container...');
  try {
    run('docker compose -f docker-compose.test.yml up -d --wait');
    return true;
  } catch (dockerErr) {
    if (canReachDatabase(databaseUrl)) {
      console.log('[e2e-setup] Docker unavailable; reusing reachable Postgres');
      return false;
    }

    const message = [
      'E2E setup failed: Postgres is not reachable.',
      'Start Docker and run: cd backend && npm run test:integration:up',
      'Or set E2E_DATABASE_URL to a running PostgreSQL instance.',
      `Docker error: ${dockerErr.message}`,
    ].join('\n');
    throw new Error(message);
  }
}

function spawnProcess(command, args, cwd, env) {
  const child = spawn(command, args, {
    cwd,
    env,
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: false,
  });

  child.stdout?.on('data', (chunk) => {
    const line = chunk.toString().trim();
    if (line) console.log(`[${path.basename(cwd)}] ${line}`);
  });
  child.stderr?.on('data', (chunk) => {
    const line = chunk.toString().trim();
    if (line) console.error(`[${path.basename(cwd)}] ${line}`);
  });

  return child;
}

export default async function globalSetup() {
  if (process.env.E2E_SKIP === 'true') {
    console.log('[e2e-setup] E2E_SKIP=true — skipping server bootstrap');
    writeFileSync(STATE_FILE, JSON.stringify({ skipped: true }));
    return;
  }

  cleanupStaleE2eState();

  const backendPort = await findFreePort(DEFAULT_BACKEND_PORT);
  const frontendPort = await findFreePort(DEFAULT_FRONTEND_PORT);
  const backendPortStr = String(backendPort);
  const frontendPortStr = String(frontendPort);

  const databaseUrl = process.env.E2E_DATABASE_URL || DEFAULT_DB_URL;
  const ownsDocker = await startPostgresIfNeeded(databaseUrl);
  const frontendUrl = `http://127.0.0.1:${frontendPortStr}`;

  const backendEnv = {
    ...process.env,
    DATABASE_URL: databaseUrl,
    JWT_SECRET: process.env.JWT_SECRET || 'e2e_jwt_secret_'.padEnd(64, 'x'),
    JWT_REFRESH_SECRET:
      process.env.JWT_REFRESH_SECRET || 'e2e_refresh_secret_'.padEnd(64, 'x'),
    NODE_ENV: 'test',
    E2E_BOOTSTRAP: 'true',
    PORT: backendPortStr,
    FRONTEND_URL: frontendUrl,
  };
  delete backendEnv.SMTP_HOST;
  delete backendEnv.SMTP_USER;
  delete backendEnv.REDIS_URL;
  backendEnv.ALLOW_IN_MEMORY_RATE_LIMIT = 'true';

  console.log('[e2e-setup] Applying migrations...');
  execSync('npx prisma migrate deploy', {
    cwd: BACKEND_ROOT,
    env: backendEnv,
    stdio: 'inherit',
  });

  console.log('[e2e-setup] Seeding E2E fixtures...');
  execSync('node scripts/seed-e2e.js', {
    cwd: BACKEND_ROOT,
    env: backendEnv,
    stdio: 'inherit',
  });

  console.log('[e2e-setup] Starting backend...');
  const backendProc = spawnProcess('node', ['src/server.js'], BACKEND_ROOT, backendEnv);

  const frontendEnv = {
    ...process.env,
    VITE_API_URL: `http://127.0.0.1:${backendPortStr}/v1/api`,
    VITE_BACKEND_URL: `http://127.0.0.1:${backendPortStr}`,
    VITE_SOCKET_URL: `http://127.0.0.1:${backendPortStr}`,
  };

  console.log('[e2e-setup] Starting Vite dev server...');
  const frontendProc = spawnProcess(
    'npm',
    ['run', 'dev', '--', '--port', frontendPortStr, '--strictPort', '--host', '127.0.0.1'],
    FRONTEND_ROOT,
    frontendEnv
  );

  await waitForUrl(`http://127.0.0.1:${backendPortStr}/api/health/live`);
  await waitForUrl(`${frontendUrl}/`);

  writeFileSync(
    STATE_FILE,
    JSON.stringify({
      skipped: false,
      backendPid: backendProc.pid,
      frontendPid: frontendProc.pid,
      backendPort: backendPortStr,
      frontendPort: frontendPortStr,
      ownsDocker,
      baseURL: frontendUrl,
      apiURL: `http://127.0.0.1:${backendPortStr}/v1/api`,
    })
  );

  process.env.E2E_BASE_URL = frontendUrl;
  process.env.E2E_API_URL = `http://127.0.0.1:${backendPortStr}/v1/api`;

  console.log('[e2e-setup] Ready:', frontendUrl);

  return (config) => {
    if (!config?.projects) return;
    for (const project of config.projects) {
      project.use = { ...(project.use ?? {}), baseURL: frontendUrl };
    }
  };
}
