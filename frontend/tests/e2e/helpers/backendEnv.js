/**
 * Environment for the backend process started by the E2E global setup.
 */
export function buildBackendEnv(baseEnv, { databaseUrl, backendPort, frontendUrl }) {
  const env = {
    ...baseEnv,
    DATABASE_URL: databaseUrl,
    JWT_SECRET: baseEnv.JWT_SECRET || 'e2e_jwt_secret_'.padEnd(64, 'x'),
    JWT_REFRESH_SECRET: baseEnv.JWT_REFRESH_SECRET || 'e2e_refresh_secret_'.padEnd(64, 'x'),
    NODE_ENV: 'test',
    E2E_BOOTSTRAP: 'true',
    PORT: backendPort,
    FRONTEND_URL: frontendUrl,
    // Kosongkan, jangan dihapus: Prisma Client memuat backend/.env saat
    // diimpor dan mengisi variabel yang tidak ada, sehingga SMTP asli dari
    // .env developer akan dipakai dan E2E mengirim email sungguhan.
    SMTP_HOST: '',
    SMTP_USER: '',
    SMTP_PASS: '',
    REDIS_URL: '',
    ALLOW_IN_MEMORY_RATE_LIMIT: 'true',
  };
  return env;
}
