const jwt = require('jsonwebtoken');

process.env.JWT_SECRET = 'test-secret-for-unit-tests-32chars';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-32chars-min';

jest.mock('../../src/utils/prisma', () => ({
  refreshToken: { findFirst: jest.fn() },
  user: { findUnique: jest.fn() },
}));

const prisma = require('../../src/utils/prisma');
const { hashToken } = require('../../src/utils/tokenHash');
const uploadAuthMiddleware = require('../../src/middlewares/uploadAuthMiddleware');

describe('uploadAuthMiddleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = { headers: {}, cookies: {}, ip: '127.0.0.1', originalUrl: '/uploads/test.jpg' };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  it('returns 401 when no credentials provided', async () => {
    await uploadAuthMiddleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('accepts valid Bearer access token with matching tokenVersion', async () => {
    const token = jwt.sign(
      { userId: 1, role: 'MAHASISWA', name: 'Test', tokenVersion: 2 },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );
    req.headers.authorization = `Bearer ${token}`;
    prisma.user.findUnique.mockResolvedValue({
      id: 1, role: 'MAHASISWA', name: 'Test', tokenVersion: 2, deletedAt: null,
    });

    await uploadAuthMiddleware(req, res, next);

    expect(prisma.refreshToken.findFirst).not.toHaveBeenCalled();
    expect(req.user).toEqual(expect.objectContaining({ userId: 1, authSource: 'access' }));
    expect(next).toHaveBeenCalled();
  });

  it('rejects Bearer access token with stale tokenVersion', async () => {
    const token = jwt.sign(
      { userId: 1, role: 'MAHASISWA', name: 'Test', tokenVersion: 0 },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );
    req.headers.authorization = `Bearer ${token}`;
    prisma.user.findUnique.mockResolvedValue({
      id: 1, role: 'MAHASISWA', name: 'Test', tokenVersion: 1, deletedAt: null,
    });

    await uploadAuthMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects Bearer access token without tokenVersion claim', async () => {
    const token = jwt.sign(
      { userId: 1, role: 'MAHASISWA', name: 'Test' },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );
    req.headers.authorization = `Bearer ${token}`;
    prisma.user.findUnique.mockResolvedValue({
      id: 1, role: 'MAHASISWA', name: 'Test', tokenVersion: 5, deletedAt: null,
    });

    await uploadAuthMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects refresh cookie not found in database', async () => {
    const refreshToken = jwt.sign(
      { userId: 1, deviceId: 'dev-1' },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );
    req.cookies.refreshToken = refreshToken;
    prisma.refreshToken.findFirst.mockResolvedValue(null);

    await uploadAuthMiddleware(req, res, next);

    expect(prisma.refreshToken.findFirst).toHaveBeenCalledWith({
      where: {
        tokenHash: hashToken(refreshToken),
        userId: 1,
        deviceId: 'dev-1',
        expiresAt: { gt: expect.any(Date) },
      },
    });
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('accepts refresh cookie with valid database record', async () => {
    const refreshToken = jwt.sign(
      { userId: 2, deviceId: 'dev-2' },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );
    req.cookies.refreshToken = refreshToken;
    prisma.refreshToken.findFirst.mockResolvedValue({ id: 10, tokenHash: hashToken(refreshToken) });
    prisma.user.findUnique.mockResolvedValue({
      id: 2, role: 'ADMIN', name: 'Admin', tokenVersion: 0, deletedAt: null,
    });

    await uploadAuthMiddleware(req, res, next);

    expect(req.user).toEqual(expect.objectContaining({ userId: 2, authSource: 'refresh' }));
    expect(next).toHaveBeenCalled();
  });
});
