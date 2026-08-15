// Mock prisma before requiring the middleware
jest.mock('../../src/utils/prisma', () => ({
  user: { findUnique: jest.fn() }
}));

jest.mock('../../src/utils/logger', () => ({
  getLogger: () => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  })
}));

const prisma = require('../../src/utils/prisma');
const isVerifiedMiddleware = require('../../src/middlewares/isVerifiedMiddleware');

describe('isVerifiedMiddleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = { user: { userId: 1, role: 'MAHASISWA' }, originalUrl: '/test', method: 'POST' };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  it('should return 401 if no user in request', async () => {
    req.user = null;
    await isVerifiedMiddleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('should pass for ADMIN users without DB check', async () => {
    req.user.role = 'ADMIN';
    await isVerifiedMiddleware(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it('should pass for SUPERADMIN users without DB check', async () => {
    req.user.role = 'SUPERADMIN';
    await isVerifiedMiddleware(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it('should block unverified MAHASISWA', async () => {
    prisma.user.findUnique.mockResolvedValue({ isVerified: false });
    await isVerifiedMiddleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('should pass for verified MAHASISWA', async () => {
    prisma.user.findUnique.mockResolvedValue({ isVerified: true });
    await isVerifiedMiddleware(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('should return 401 if user not found in DB', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    await isVerifiedMiddleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });
});
