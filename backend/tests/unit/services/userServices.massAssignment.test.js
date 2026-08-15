/**
 * Service-level mass-assignment guard (audit finding C2).
 * Even if a controller passes unfiltered input, sensitive fields must be
 * dropped before reaching Prisma.
 */

jest.mock('../../../src/utils/prisma', () => ({
  user: {
    update: jest.fn(),
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

const prisma = require('../../../src/utils/prisma');
const SoftDeleteHelper = require('../../../src/utils/softDelete');
const userServices = require('../../../src/services/userServices');

describe('userServices.updateUser sensitive-field guard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    SoftDeleteHelper.findUnique.mockResolvedValue({
      id: 42,
      name: 'Mahasiswa',
      email: 'mhs@mahasiswa.ac.id',
      role: 'MAHASISWA',
      isVerified: true,
      deletedAt: null,
    });
    prisma.user.update.mockImplementation(async ({ data }) => ({ id: 42, ...data }));
  });

  test('strips role/password/isVerified/tokenVersion before Prisma update', async () => {
    await userServices.updateUser(42, {
      name: 'Nama Baru',
      role: 'SUPERADMIN',
      password: '$2a$10$attacker-hash',
      isVerified: true,
      tokenVersion: 999,
      deletedAt: null,
      ktmPath: '/uploads/ktm/x.jpg',
    });

    expect(prisma.user.update).toHaveBeenCalledTimes(1);
    const { data } = prisma.user.update.mock.calls[0][0];
    expect(data.name).toBe('Nama Baru');
    expect(data.role).toBeUndefined();
    expect(data.password).toBeUndefined();
    expect(data.isVerified).toBeUndefined();
    expect(data.tokenVersion).toBeUndefined();
    expect(data.ktmPath).toBeUndefined();
    expect(data.updatedAt).toBeInstanceOf(Date);
  });

  test('rejects when nothing remains after filtering', async () => {
    await expect(
      userServices.updateUser(42, { role: 'SUPERADMIN', password: 'x' })
    ).rejects.toThrow('Error updating user');
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  test('allows legitimate profile fields', async () => {
    await userServices.updateUser(42, { name: 'A', email: 'a@b.ac.id', nim: '12345678' });
    const { data } = prisma.user.update.mock.calls[0][0];
    expect(data).toEqual(
      expect.objectContaining({ name: 'A', email: 'a@b.ac.id', nim: '12345678' })
    );
  });
});
