import { describe, expect, it } from 'vitest';
import { buildBackendEnv } from '../e2e/helpers/backendEnv.js';

// Prisma Client (dan dotenv) memuat backend/.env saat diimpor, tetapi hanya
// mengisi variabel yang BELUM ADA di process.env. Variabel yang dihapus akan
// terisi lagi dari .env; variabel yang ada walau kosong dibiarkan.
function loadDotenvLike(env, fileValues) {
  const result = { ...env };
  for (const [key, value] of Object.entries(fileValues)) {
    if (!Object.prototype.hasOwnProperty.call(result, key)) result[key] = value;
  }
  return result;
}

const REAL_DOTENV = {
  SMTP_HOST: 'mail.example.ac.id',
  SMTP_USER: 'noreply@example.ac.id',
  SMTP_PASS: 'secret',
  REDIS_URL: 'redis://prod-redis:6379',
};

const options = {
  databaseUrl: 'postgresql://test:test@localhost:55432/pengaduan_test',
  backendPort: '6061',
  frontendUrl: 'http://127.0.0.1:5199',
};

describe('buildBackendEnv', () => {
  it('keeps SMTP and Redis disabled even after backend/.env is loaded', () => {
    const env = buildBackendEnv({ ...REAL_DOTENV, PATH: '/usr/bin' }, options);
    const afterDotenv = loadDotenvLike(env, REAL_DOTENV);

    expect(afterDotenv.SMTP_HOST).toBe('');
    expect(afterDotenv.SMTP_USER).toBe('');
    expect(afterDotenv.SMTP_PASS).toBe('');
    expect(afterDotenv.REDIS_URL).toBe('');
  });

  it('sets the E2E database, port, and in-memory rate limiting', () => {
    const env = buildBackendEnv({ PATH: '/usr/bin' }, options);

    expect(env).toMatchObject({
      PATH: '/usr/bin',
      DATABASE_URL: options.databaseUrl,
      PORT: '6061',
      FRONTEND_URL: options.frontendUrl,
      NODE_ENV: 'test',
      E2E_BOOTSTRAP: 'true',
      ALLOW_IN_MEMORY_RATE_LIMIT: 'true',
    });
    expect(env.JWT_SECRET.length).toBeGreaterThanOrEqual(32);
    expect(env.JWT_REFRESH_SECRET.length).toBeGreaterThanOrEqual(32);
  });
});
