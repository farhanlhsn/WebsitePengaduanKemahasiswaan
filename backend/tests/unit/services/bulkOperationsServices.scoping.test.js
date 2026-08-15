/**
 * Tests for bulk-operations authorization & scoping (audit finding C3).
 *
 * - User ops memakai assertCanManageUser per-item (policy yang sama dengan
 *   endpoint tunggal): ADMIN hanya bisa kelola MAHASISWA, last-superadmin
 *   guard, self-destructive guard.
 * - Report ops di-scoped per kategori assignment.
 * - State machine diterapkan per item pada bulk update status.
 * - Kategori dengan laporan aktif tidak bisa di-bulk-delete.
 * - Batch > 100 ditolak.
 */

jest.mock('../../../src/utils/prisma', () => ({
  user: { findFirst: jest.fn(), findUnique: jest.fn(), updateMany: jest.fn() },
  report: { findMany: jest.fn(), updateMany: jest.fn(), groupBy: jest.fn() },
  category: { updateMany: jest.fn() },
}));
jest.mock('../../../src/services/adminGovernanceServices', () => ({
  getAccessibleCategoryIds: jest.fn(),
  countActiveSuperAdmins: jest.fn(),
}));
jest.mock('../../../src/utils/logger', () => ({
  getLogger: () => ({ info: jest.fn(), warn: jest.fn(), error: jest.fn() }),
}));

const prisma = require('../../../src/utils/prisma');
const adminGovernanceServices = require('../../../src/services/adminGovernanceServices');
const bulk = require('../../../src/services/bulkOperationsServices');

const ADMIN = { userId: 5, role: 'ADMIN', name: 'Admin' };
const SUPERADMIN = { userId: 1, role: 'SUPERADMIN', name: 'Super' };

beforeEach(() => {
  jest.clearAllMocks();
  prisma.user.updateMany.mockResolvedValue({ count: 1 });
  prisma.report.updateMany.mockResolvedValue({ count: 0 });
  prisma.category.updateMany.mockResolvedValue({ count: 0 });
  prisma.report.groupBy.mockResolvedValue([]);
});

describe('bulkUpdateReportStatus scoping', () => {
  const REPORTS = [
    { id: 1, categoryId: 10, status: 'PENDING' },
    { id: 2, categoryId: 20, status: 'PENDING' },
  ];

  test('ADMIN only processes reports in assigned categories', async () => {
    adminGovernanceServices.getAccessibleCategoryIds.mockResolvedValue([10]);
    prisma.report.findMany.mockResolvedValue(REPORTS);
    prisma.report.updateMany.mockResolvedValue({ count: 1 });

    const result = await bulk.bulkUpdateReportStatus([1, 2], 'IN_REVIEW', ADMIN);

    expect(prisma.report.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ id: { in: [1] } }) })
    );
    expect(result.updated).toBe(1);
    expect(result.skipped).toEqual([{ id: 2, reason: 'di luar kategori assignment' }]);
  });

  test('SUPERADMIN processes all reports', async () => {
    adminGovernanceServices.getAccessibleCategoryIds.mockResolvedValue(null);
    prisma.report.findMany.mockResolvedValue(REPORTS);
    prisma.report.updateMany.mockResolvedValue({ count: 2 });

    const result = await bulk.bulkUpdateReportStatus([1, 2], 'IN_REVIEW', SUPERADMIN);

    expect(result.updated).toBe(2);
    expect(result.skipped).toEqual([]);
  });

  test('state machine is enforced per item', async () => {
    adminGovernanceServices.getAccessibleCategoryIds.mockResolvedValue(null);
    prisma.report.findMany.mockResolvedValue([
      { id: 1, categoryId: 10, status: 'RESOLVED' },
      { id: 2, categoryId: 10, status: 'IN_PROGRESS' },
    ]);
    prisma.report.updateMany.mockResolvedValue({ count: 1 });

    const result = await bulk.bulkUpdateReportStatus(
      [1, 2], 'CANCELED', SUPERADMIN, 'dibatalkan pelapor'
    );

    expect(result.updated).toBe(1);
    expect(result.skipped[0].id).toBe(1);
    expect(result.skipped[0].reason).toMatch(/tidak valid/);
  });

  test('REJECTED without reason is rejected', async () => {
    await expect(
      bulk.bulkUpdateReportStatus([1], 'REJECTED', SUPERADMIN, null)
    ).rejects.toThrow(/Alasan wajib/);
    expect(prisma.report.updateMany).not.toHaveBeenCalled();
  });

  test('closedAt set for closing statuses', async () => {
    adminGovernanceServices.getAccessibleCategoryIds.mockResolvedValue(null);
    prisma.report.findMany.mockResolvedValue([{ id: 1, categoryId: 10, status: 'IN_PROGRESS' }]);
    prisma.report.updateMany.mockResolvedValue({ count: 1 });

    await bulk.bulkUpdateReportStatus([1], 'REJECTED', SUPERADMIN, 'tidak valid');

    const { data } = prisma.report.updateMany.mock.calls[0][0];
    expect(data.closedAt).toBeInstanceOf(Date);
  });
});

describe('bulk report delete/restore scoping', () => {
  test('bulkDeleteReports skips out-of-scope reports', async () => {
    adminGovernanceServices.getAccessibleCategoryIds.mockResolvedValue([10]);
    prisma.report.findMany.mockResolvedValue([
      { id: 1, categoryId: 10 },
      { id: 2, categoryId: 99 },
    ]);
    prisma.report.updateMany.mockResolvedValue({ count: 1 });

    const result = await bulk.bulkDeleteReports([1, 2], ADMIN);

    expect(result.deleted).toBe(1);
    expect(result.skipped).toEqual([{ id: 2, reason: 'di luar kategori assignment' }]);
  });

  test('bulkRestoreReports skips out-of-scope reports', async () => {
    adminGovernanceServices.getAccessibleCategoryIds.mockResolvedValue([10]);
    prisma.report.findMany.mockResolvedValue([{ id: 3, categoryId: 77 }]);

    const result = await bulk.bulkRestoreReports([3], ADMIN);

    expect(result.restored).toBe(0);
    expect(result.skipped[0].reason).toMatch(/kategori assignment/);
  });
});

describe('bulk user operations — governance policy per item', () => {
  function userRow(overrides) {
    return { id: 9, role: 'MAHASISWA', deletedAt: null, name: 'M', email: 'm@x.ac.id', ...overrides };
  }

  test('ADMIN cannot bulk-delete admin-tier targets, can delete MAHASISWA', async () => {
    prisma.user.findFirst
      .mockResolvedValueOnce(userRow({ id: 9 }))
      .mockResolvedValueOnce(userRow({ id: 2, role: 'ADMIN' }));
    prisma.user.updateMany.mockResolvedValue({ count: 1 });

    const result = await bulk.bulkDeleteUsers([9, 2], ADMIN);

    expect(result.deleted).toBe(1);
    expect(result.userIds).toEqual([9]);
    expect(result.skipped[0].id).toBe(2);
    expect(result.skipped[0].reason).toMatch(/admin-tier|SUPERADMIN/i);
  });

  test('self-delete is blocked', async () => {
    prisma.user.findFirst.mockResolvedValue(userRow({ id: 5, role: 'MAHASISWA' }));

    const result = await bulk.bulkDeleteUsers([5], ADMIN);

    expect(result.deleted).toBe(0);
    expect(result.skipped[0].reason).toMatch(/own account|sendiri/i);
  });

  test('SUPERADMIN bulk delete honors last-superadmin guard sequentially', async () => {
    // 2 superadmin aktif: delete pertama lolos, re-count kedua tinggal 1 → ditolak.
    prisma.user.findFirst
      .mockResolvedValueOnce(userRow({ id: 2, role: 'SUPERADMIN' }))
      .mockResolvedValueOnce(userRow({ id: 3, role: 'SUPERADMIN' }));
    adminGovernanceServices.countActiveSuperAdmins
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(1);
    prisma.user.updateMany.mockResolvedValue({ count: 1 });

    const result = await bulk.bulkDeleteUsers([2, 3], SUPERADMIN);

    expect(result.deleted).toBe(1);
    expect(result.userIds).toEqual([2]);
    expect(result.skipped[0].id).toBe(3);
    expect(result.skipped[0].reason).toMatch(/last|SUPERADMIN/i);
  });

  test('bulkVerifyUsers: policy + KTM + already-verified checks', async () => {
    prisma.user.findFirst
      .mockResolvedValueOnce(userRow({ id: 1 }))
      .mockResolvedValueOnce(userRow({ id: 2 }))
      .mockResolvedValueOnce(userRow({ id: 3, role: 'ADMIN' }));
    prisma.user.findUnique
      .mockResolvedValueOnce({ ktmPath: '/uploads/ktm/a.jpg', isVerified: false })
      .mockResolvedValueOnce({ ktmPath: null, isVerified: false });

    const result = await bulk.bulkVerifyUsers([1, 2, 3], ADMIN);

    expect(result.verified).toBe(1);
    expect(prisma.user.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ id: { in: [1] } }) })
    );
    expect(result.skipped).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 2, reason: 'tidak memiliki KTM' }),
        expect.objectContaining({ id: 3 }),
      ])
    );
  });

  test('bulkRestoreUsers restores only deleted targets allowed by policy', async () => {
    prisma.user.findFirst
      .mockResolvedValueOnce(userRow({ id: 9, deletedAt: new Date() }))
      .mockResolvedValueOnce(userRow({ id: 10, deletedAt: null }));
    prisma.user.updateMany.mockResolvedValue({ count: 1 });

    const result = await bulk.bulkRestoreUsers([9, 10], ADMIN);

    expect(result.restored).toBe(1);
    expect(result.userIds).toEqual([9]);
    expect(result.skipped[0]).toEqual({ id: 10, reason: 'tidak sedang terhapus' });
  });
});

describe('bulk category operations guards', () => {
  test('bulkDeleteCategories skips categories with active reports', async () => {
    prisma.report.groupBy.mockResolvedValue([{ categoryId: 10, _count: { _all: 5 } }]);
    prisma.category.updateMany.mockResolvedValue({ count: 1 });

    const result = await bulk.bulkDeleteCategories([10, 11]);

    expect(prisma.category.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ id: { in: [11] } }) })
    );
    expect(result.deleted).toBe(1);
    expect(result.skipped).toEqual([{ id: 10, reason: 'memiliki laporan aktif' }]);
  });
});

describe('batch size limit', () => {
  test('more than 100 ids is rejected', async () => {
    const ids = Array.from({ length: 101 }, (_, i) => i + 1);
    await expect(bulk.bulkDeleteReports(ids, SUPERADMIN)).rejects.toThrow(/Maksimal 100/);
  });
});
