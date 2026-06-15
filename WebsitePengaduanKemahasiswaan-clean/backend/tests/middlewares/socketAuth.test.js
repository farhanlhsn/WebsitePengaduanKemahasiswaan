const jwt = require('jsonwebtoken');

process.env.JWT_SECRET = 'test-secret-for-unit-tests-32chars';

jest.mock('../../src/utils/prisma', () => ({
  user: { findUnique: jest.fn() },
}));

const prisma = require('../../src/utils/prisma');
const { authenticateSocket, revalidateSocketUser } = require('../../src/sockets/socketAuth');

describe('socketAuth tokenVersion enforcement', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rejects access token without tokenVersion claim', async () => {
    const token = jwt.sign({ userId: 1 }, process.env.JWT_SECRET, { expiresIn: '15m' });
    prisma.user.findUnique.mockResolvedValue({
      id: 1, role: 'MAHASISWA', name: 'Test', tokenVersion: 0, deletedAt: null,
    });

    const result = await authenticateSocket(token);

    expect(result.valid).toBe(false);
    expect(result.code).toBe('AUTH_REVOKED');
  });

  it('rejects access token with stale tokenVersion', async () => {
    const token = jwt.sign(
      { userId: 1, tokenVersion: 0 },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );
    prisma.user.findUnique.mockResolvedValue({
      id: 1, role: 'MAHASISWA', name: 'Test', tokenVersion: 2, deletedAt: null,
    });

    const result = await authenticateSocket(token);

    expect(result.valid).toBe(false);
    expect(result.code).toBe('AUTH_REVOKED');
  });

  it('accepts access token with matching tokenVersion', async () => {
    const token = jwt.sign(
      { userId: 1, tokenVersion: 1 },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );
    prisma.user.findUnique.mockResolvedValue({
      id: 1, role: 'MAHASISWA', name: 'Test', tokenVersion: 1, deletedAt: null,
    });

    const result = await authenticateSocket(token);

    expect(result.valid).toBe(true);
    expect(result.user.tokenVersion).toBe(1);
  });

  it('revalidates socket user when tokenVersion is missing on socket snapshot', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 1, role: 'MAHASISWA', name: 'Test', tokenVersion: 0, deletedAt: null,
    });

    const result = await revalidateSocketUser({ userId: 1 });

    expect(result.valid).toBe(false);
    expect(result.code).toBe('AUTH_REVOKED');
    expect(result.disconnect).toBe(true);
  });
});
