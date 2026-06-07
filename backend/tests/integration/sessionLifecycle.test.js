/**
 * Session lifecycle integration tests (P2, P3, P1 upload auth).
 */

const jwt = require('jsonwebtoken');
const request = require('supertest');
const cookieParser = require('cookie-parser');
const express = require('express');
const {
  prisma,
  buildApp,
  createUser,
  issueToken,
  authHeader,
} = require('./helpers');
const { hashToken } = require('../../src/utils/tokenHash');
const uploadAuthMiddleware = require('../../src/middlewares/uploadAuthMiddleware');

const DEVICE_ID = 'lifecycle-test-device';

async function storeRefreshToken(user, token) {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await prisma.refreshToken.create({
    data: {
      tokenHash: hashToken(token),
      userId: user.id,
      deviceId: DEVICE_ID,
      deviceName: 'Test Browser',
      expiresAt,
      userAgent: 'integration-test',
    },
  });
}

function issueRefreshToken(user) {
  return jwt.sign(
    { userId: user.id, deviceId: DEVICE_ID },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );
}

function buildUploadTestApp() {
  const app = express();
  app.use(cookieParser());
  app.get('/test-upload', uploadAuthMiddleware, (req, res) => {
    res.json({ ok: true, authSource: req.user.authSource });
  });
  return app;
}

describe('session lifecycle integration', () => {
  let app;
  let uploadApp;

  beforeAll(() => {
    app = buildApp();
    uploadApp = buildUploadTestApp();
  });

  test('changePassword invalidates refresh tokens and requires re-login', async () => {
    const password = 'Password123!';
    const user = await createUser({ password });

    const refreshToken = issueRefreshToken(user);
    await storeRefreshToken(user, refreshToken);

    const res = await request(app)
      .post('/v1/api/auth/change-password')
      .set(authHeader(user))
      .send({ currentPassword: password, newPassword: 'NewPassword456!' })
      .expect(200);

    expect(res.body.data.requireReLogin).toBe(true);
    expect(res.body.data.code).toBe('SESSION_INVALIDATED');

    const remaining = await prisma.refreshToken.count({ where: { userId: user.id } });
    expect(remaining).toBe(0);

    const updated = await prisma.user.findUnique({ where: { id: user.id } });
    expect(updated.tokenVersion).toBe(1);

    await request(app)
      .post('/v1/api/auth/refresh-token')
      .set('Cookie', [`refreshToken=${refreshToken}`])
      .expect(403);
  });

  test('refresh rejects soft-deleted user and revokes tokens', async () => {
    const user = await createUser();
    const refreshToken = issueRefreshToken(user);
    await storeRefreshToken(user, refreshToken);

    await prisma.user.update({
      where: { id: user.id },
      data: { deletedAt: new Date() },
    });

    await request(app)
      .post('/v1/api/auth/refresh-token')
      .set('Cookie', [`refreshToken=${refreshToken}`])
      .expect(403);

    const remaining = await prisma.refreshToken.count({ where: { userId: user.id } });
    expect(remaining).toBe(0);
  });

  test('uploadAuth rejects refresh cookie after token revoked from DB', async () => {
    const user = await createUser();
    const refreshToken = issueRefreshToken(user);
    await storeRefreshToken(user, refreshToken);

    await prisma.refreshToken.deleteMany({ where: { userId: user.id } });

    await request(uploadApp)
      .get('/test-upload')
      .set('Cookie', [`refreshToken=${refreshToken}`])
      .expect(401);
  });

  test('uploadAuth accepts refresh cookie with valid DB record', async () => {
    const user = await createUser();
    const refreshToken = issueRefreshToken(user);
    await storeRefreshToken(user, refreshToken);

    const res = await request(uploadApp)
      .get('/test-upload')
      .set('Cookie', [`refreshToken=${refreshToken}`])
      .expect(200);

    expect(res.body.authSource).toBe('refresh');
  });
});
