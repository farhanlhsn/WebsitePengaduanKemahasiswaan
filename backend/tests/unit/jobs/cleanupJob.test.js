jest.mock('../../../src/utils/prisma', () => ({
  refreshToken: { deleteMany: jest.fn() },
  passwordResetToken: { deleteMany: jest.fn() },
  // Audit L1: runCleanup memakai advisory lock via $queryRaw.
  $queryRaw: jest.fn().mockResolvedValue([{ ok: true }]),
}));
jest.mock('../../../src/utils/logger', () => ({
  getLogger: () => ({ info: jest.fn(), warn: jest.fn(), error: jest.fn() }),
}));

const prisma = require('../../../src/utils/prisma');
const {
  cleanupExpiredRefreshTokens,
  cleanupOldPasswordResetTokens,
  runCleanup,
} = require('../../../src/jobs/cleanupJob');

describe('cleanupJob', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('cleanupExpiredRefreshTokens deletes tokens past expiry', async () => {
    prisma.refreshToken.deleteMany.mockResolvedValue({ count: 5 });
    const count = await cleanupExpiredRefreshTokens();

    expect(count).toBe(5);
    expect(prisma.refreshToken.deleteMany).toHaveBeenCalledWith({
      where: { expiresAt: { lt: expect.any(Date) } },
    });
  });

  test('cleanupOldPasswordResetTokens deletes expired or used-old tokens', async () => {
    prisma.passwordResetToken.deleteMany.mockResolvedValue({ count: 3 });
    const count = await cleanupOldPasswordResetTokens();

    expect(count).toBe(3);
    const arg = prisma.passwordResetToken.deleteMany.mock.calls[0][0];
    expect(arg.where.OR).toHaveLength(2);
    expect(arg.where.OR[0]).toHaveProperty('expiresAt.lt');
    expect(arg.where.OR[1]).toHaveProperty('usedAt.lt');
  });

  test('runCleanup swallows errors and logs them', async () => {
    prisma.refreshToken.deleteMany.mockRejectedValue(new Error('db down'));
    await expect(runCleanup()).resolves.toBeUndefined();
  });
});
