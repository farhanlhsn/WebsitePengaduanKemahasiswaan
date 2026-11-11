/**
 * Registrasi ulang dengan email/NIM akun yang sudah dihapus (soft delete).
 *
 * Akun lama yang punya laporan/pesan tidak boleh diaktifkan ulang untuk
 * pendaftar baru: siapa pun bisa mendaftar dengan email orang lain dan
 * mewarisi laporan lamanya, termasuk laporan anonim.
 */

const mockTx = {
  user: { update: jest.fn(), create: jest.fn() },
  refreshToken: { deleteMany: jest.fn() },
  passwordResetToken: { deleteMany: jest.fn() },
};

jest.mock('../../../src/utils/prisma', () => ({
  user: { findFirst: jest.fn(), findUnique: jest.fn(), delete: jest.fn(), update: jest.fn(), create: jest.fn() },
  report: { count: jest.fn() },
  message: { count: jest.fn() },
  $transaction: jest.fn((fn) => fn(mockTx)),
}));
jest.mock('../../../src/utils/logger', () => ({
  getLogger: () => ({ info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() }),
}));
jest.mock('axios');

const prisma = require('../../../src/utils/prisma');
const authServices = require('../../../src/services/authServices');

const INPUT = { name: 'Pendaftar Baru', email: 'Korban@Mahasiswa.ac.id', password: 'Rahasia123!', nim: '20219999' };
const DELETED = { id: 7, role: 'MAHASISWA', deletedAt: new Date(), email: 'korban@mahasiswa.ac.id', nim: '20219999' };

describe('registerStudent with a soft-deleted account', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    prisma.user.findFirst.mockResolvedValue(DELETED);
    prisma.user.findUnique.mockResolvedValue(DELETED);
    mockTx.user.create.mockResolvedValue({ id: 99, email: 'korban@mahasiswa.ac.id' });
    mockTx.user.update.mockResolvedValue({ id: 7 });
  });

  test('old account with reports is detached; a new account is created', async () => {
    prisma.report.count.mockResolvedValue(3);
    prisma.message.count.mockResolvedValue(0);

    const user = await authServices.registerStudent(INPUT, '/uploads/ktm/x.png');

    expect(user.id).toBe(99);
    expect(mockTx.user.update).toHaveBeenCalledWith({
      where: { id: 7 },
      data: { email: expect.stringMatching(/@akun-terhapus\.invalid$/), nim: null },
    });
    expect(mockTx.user.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ email: 'korban@mahasiswa.ac.id', isVerified: false, role: 'MAHASISWA' }),
    });
    expect(mockTx.refreshToken.deleteMany).toHaveBeenCalledWith({ where: { userId: 7 } });
    expect(prisma.user.delete).not.toHaveBeenCalled();
  });

  test('old account without any data is reactivated and its sessions dropped', async () => {
    prisma.report.count.mockResolvedValue(0);
    prisma.message.count.mockResolvedValue(0);

    await authServices.registerStudent(INPUT, '/uploads/ktm/x.png');

    expect(mockTx.user.create).not.toHaveBeenCalled();
    expect(mockTx.refreshToken.deleteMany).toHaveBeenCalledWith({ where: { userId: 7 } });
    expect(mockTx.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 7 },
        data: expect.objectContaining({ deletedAt: null, isVerified: false, email: 'korban@mahasiswa.ac.id' }),
      })
    );
  });

  test('never hard-deletes another account when email and NIM belong to different deleted rows', async () => {
    prisma.user.findUnique.mockResolvedValue({ ...DELETED, id: 8, email: 'lain@mahasiswa.ac.id' });
    prisma.report.count.mockResolvedValue(0);
    prisma.message.count.mockResolvedValue(1);

    await authServices.registerStudent(INPUT, '/uploads/ktm/x.png');

    expect(prisma.user.delete).not.toHaveBeenCalled();
    expect(mockTx.user.update).toHaveBeenCalledTimes(2);
    expect(mockTx.user.create).toHaveBeenCalled();
  });

  test('active account with the same email (any letter case) is rejected', async () => {
    prisma.user.findFirst.mockResolvedValue({ ...DELETED, deletedAt: null });
    await expect(authServices.registerStudent(INPUT, '/uploads/ktm/x.png')).rejects.toThrow('Email already exists');
  });
});
