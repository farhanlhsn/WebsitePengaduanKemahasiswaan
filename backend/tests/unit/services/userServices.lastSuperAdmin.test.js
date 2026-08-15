/**
 * Tests for the last-superadmin guard on delete (audit finding B2).
 *
 * When the target is a SUPERADMIN, deleteUser must re-check the
 * remaining-superadmin count INSIDE a transaction holding the advisory lock,
 * so concurrent demote/delete cannot drive the count to zero.
 */

const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  $transaction: jest.fn(),
};

jest.mock('../../../src/utils/prisma', () => mockPrisma);
jest.mock('../../../src/utils/softDelete', () => ({
  findUnique: jest.fn(),
  findMany: jest.fn(),
  softDelete: jest.fn().mockResolvedValue({ id: 99, deletedAt: new Date() }),
  restore: jest.fn(),
}));
jest.mock('../../../src/utils/logger', () => ({
  getLogger: () => ({ info: jest.fn(), warn: jest.fn(), error: jest.fn() }),
}));

const userServices = require('../../../src/services/userServices');
const SoftDeleteHelper = require('../../../src/utils/softDelete');

function makeTx({ remaining }) {
  return {
    $queryRaw: jest.fn().mockResolvedValue([]),
    user: {
      count: jest.fn().mockResolvedValue(remaining),
      update: jest.fn().mockResolvedValue({ id: 1, deletedAt: new Date() }),
    },
  };
}

describe('deleteUser last-superadmin guard (audit B2)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma.$transaction.mockImplementation(async (fn) => fn(currentTx));
  });

  let currentTx;

  test('deleting a SUPERADMIN acquires advisory lock inside transaction', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ id: 1, role: 'SUPERADMIN' });
    currentTx = makeTx({ remaining: 2 });

    await userServices.deleteUser(1);

    expect(mockPrisma.$transaction).toHaveBeenCalled();
    expect(currentTx.$queryRaw).toHaveBeenCalled();
    expect(currentTx.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 1 } })
    );
  });

  test('deleting the last SUPERADMIN is rejected', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ id: 1, role: 'SUPERADMIN' });
    currentTx = makeTx({ remaining: 0 });

    await expect(userServices.deleteUser(1)).rejects.toMatchObject({
      code: 'LAST_SUPERADMIN',
    });
    expect(currentTx.user.update).not.toHaveBeenCalled();
  });

  test('deleting a MAHASISWA uses the normal soft-delete path', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ id: 99, role: 'MAHASISWA' });

    await userServices.deleteUser(99);

    expect(mockPrisma.$transaction).not.toHaveBeenCalled();
    expect(SoftDeleteHelper.softDelete).toHaveBeenCalled();
  });
});
