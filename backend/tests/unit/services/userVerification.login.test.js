/**
 * Tests for KTM-gated verification (audit finding B3) and
 * soft-deleted login rejection (audit finding B4).
 */

jest.mock('../../../src/utils/prisma', () => ({
  user: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  refreshToken: {
    findMany: jest.fn().mockResolvedValue([]),
    upsert: jest.fn().mockResolvedValue({}),
    delete: jest.fn().mockResolvedValue({}),
  },
}));
jest.mock('../../../src/utils/softDelete', () => ({
  findUnique: jest.fn(),
  findMany: jest.fn(),
  softDelete: jest.fn(),
  restore: jest.fn(),
}));
jest.mock('../../../src/utils/logger', () => ({
  getLogger: () => ({ info: jest.fn(), warn: jest.fn(), error: jest.fn() }),
}));
jest.mock('axios');

const prisma = require('../../../src/utils/prisma');
const userServices = require('../../../src/services/userServices');
const authServices = require('../../../src/services/authServices');

describe('verifyUser KTM gate (audit B3)', () => {
  beforeEach(() => jest.clearAllMocks());

  test('rejects verification when user has no KTM', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 1, ktmPath: null, deletedAt: null });

    await expect(userServices.verifyUser(1)).rejects.toThrow(/KTM/);
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  test('rejects verification for deleted user', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 1,
      ktmPath: '/uploads/ktm/x.jpg',
      deletedAt: new Date(),
    });

    await expect(userServices.verifyUser(1)).rejects.toThrow();
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  test('verifies user that has KTM', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 1,
      ktmPath: '/uploads/ktm/x.jpg',
      deletedAt: null,
    });
    prisma.user.update.mockResolvedValue({ id: 1, isVerified: true });

    const result = await userServices.verifyUser(1);
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 1 } })
    );
    expect(result.isVerified).toBe(true);
  });
});

describe('login rejects soft-deleted users (audit B4)', () => {
  beforeEach(() => jest.clearAllMocks());

  test('deleted user gets generic wrong-credential error', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 1,
      email: 'del@kampus.ac.id',
      password: '$2a$10$irrelevant',
      role: 'MAHASISWA',
      isVerified: true,
      deletedAt: new Date(),
      tokenVersion: 0,
    });

    await expect(
      authServices.login({ email: 'del@kampus.ac.id', password: 'anything' }, {})
    ).rejects.toThrow('email/password salah');
  });

  test('unknown user gets the same generic error (no enumeration)', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(
      authServices.login({ email: 'ghost@kampus.ac.id', password: 'x' }, {})
    ).rejects.toThrow('email/password salah');
  });
});
