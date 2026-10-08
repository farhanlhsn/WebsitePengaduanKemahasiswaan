/**
 * Regression: semua limiter berbasis IP dulu memakai key Redis yang sama
 * (`rl:<ip>`, prefix bawaan rate-limit-redis), sehingga hit di satu limiter
 * ikut menghabiskan kuota limiter lain. Store palsu di bawah meniru satu
 * server Redis bersama dengan prefix bawaan `rl:` seperti library aslinya.
 */
const express = require('express');
const request = require('supertest');

const mockServer = new Map();

jest.mock('../../../src/utils/redis', () => ({ call: jest.fn() }));

jest.mock('rate-limit-redis', () => {
  class FakeRedisStore {
    constructor(options = {}) {
      this.prefix = options.prefix ?? 'rl:';
    }

    init(options) {
      this.windowMs = options.windowMs;
    }

    async increment(key) {
      const fullKey = `${this.prefix}${key}`;
      const totalHits = (mockServer.get(fullKey) || 0) + 1;
      mockServer.set(fullKey, totalHits);
      return { totalHits, resetTime: new Date(Date.now() + this.windowMs) };
    }

    async decrement(key) {
      const fullKey = `${this.prefix}${key}`;
      mockServer.set(fullKey, Math.max(0, (mockServer.get(fullKey) || 0) - 1));
    }

    async resetKey(key) {
      mockServer.delete(`${this.prefix}${key}`);
    }
  }
  return { __esModule: true, default: FakeRedisStore };
});

const {
  globalLimiter,
  loginLimiter,
  refreshTokenLimiter,
  forgotPasswordLimiter,
} = require('../../../src/middlewares/rateLimiters');

const ok = (_req, res) => res.status(200).json({ ok: true });

describe('rate limiter key isolation', () => {
  beforeEach(() => mockServer.clear());

  it('refresh-token requests do not consume the forgot-password quota', async () => {
    const app = express();
    app.post('/refresh', refreshTokenLimiter, ok);
    app.post('/forgot', forgotPasswordLimiter, ok);

    for (let i = 0; i < 5; i += 1) {
      await request(app).post('/refresh').expect(200);
    }

    await request(app).post('/forgot').expect(200);
  });

  it('ordinary traffic counted by the global limiter does not block login', async () => {
    const app = express();
    app.use(globalLimiter);
    app.get('/ping', ok);
    app.post('/login', loginLimiter, (_req, res) => res.status(401).json({ ok: false }));

    for (let i = 0; i < 25; i += 1) {
      await request(app).get('/ping').expect(200);
    }

    await request(app).post('/login').expect(401);
  });
});
