const jwt = require('jsonwebtoken');

// Mock environment
process.env.JWT_SECRET = 'test-secret-for-unit-tests-32chars';

// Mock prisma
jest.mock('../../src/utils/prisma', () => ({
  user: { findUnique: jest.fn() }
}));

const prisma = require('../../src/utils/prisma');
const authMiddleware = require('../../src/middlewares/authMiddleware');

describe('authMiddleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = { headers: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  it('should return 401 if no Authorization header', async () => {
    await authMiddleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Access token required' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 if Authorization header does not start with Bearer', async () => {
    req.headers.authorization = 'Basic sometoken';
    await authMiddleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 if token is expired', async () => {
    const token = jwt.sign(
      { userId: 1, role: 'MAHASISWA', name: 'Test', tokenVersion: 0 },
      process.env.JWT_SECRET,
      { expiresIn: '-1s' }
    );
    req.headers.authorization = `Bearer ${token}`;
    await authMiddleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'Token expired', code: 'TOKEN_EXPIRED' })
    );
  });

  it('should return 401 if token is invalid', async () => {
    req.headers.authorization = 'Bearer invalid.token.here';
    await authMiddleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'Invalid token', code: 'INVALID_TOKEN' })
    );
  });

  it('should return 401 if user not found in DB', async () => {
    const token = jwt.sign(
      { userId: 999, role: 'MAHASISWA', name: 'Ghost', tokenVersion: 0 },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );
    req.headers.authorization = `Bearer ${token}`;
    prisma.user.findUnique.mockResolvedValue(null);
    await authMiddleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 if tokenVersion mismatch', async () => {
    const token = jwt.sign(
      { userId: 1, role: 'MAHASISWA', name: 'Test', tokenVersion: 0 },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );
    req.headers.authorization = `Bearer ${token}`;
    prisma.user.findUnique.mockResolvedValue({
      id: 1, tokenVersion: 1, role: 'MAHASISWA', name: 'Test', deletedAt: null
    });
    await authMiddleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'TOKEN_REVOKED' })
    );
  });

  it('should return 401 if tokenVersion claim is missing', async () => {
    const token = jwt.sign(
      { userId: 1, role: 'MAHASISWA', name: 'Test' },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );
    req.headers.authorization = `Bearer ${token}`;
    prisma.user.findUnique.mockResolvedValue({
      id: 1, tokenVersion: 0, role: 'MAHASISWA', name: 'Test', deletedAt: null
    });
    await authMiddleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'TOKEN_REVOKED' })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('should call next and set req.user for valid token with matching tokenVersion', async () => {
    const token = jwt.sign(
      { userId: 1, role: 'MAHASISWA', name: 'Test User', tokenVersion: 0 },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );
    req.headers.authorization = `Bearer ${token}`;
    prisma.user.findUnique.mockResolvedValue({
      id: 1, tokenVersion: 0, role: 'MAHASISWA', name: 'Test User', deletedAt: null
    });
    await authMiddleware(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req.user).toEqual({
      userId: 1,
      role: 'MAHASISWA',
      name: 'Test User'
    });
  });
});
