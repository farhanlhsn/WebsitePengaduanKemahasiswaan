jest.mock('../../../src/utils/prisma', () => ({
  report: {
    findFirst: jest.fn(),
  },
}));

jest.mock('../../../src/services/adminGovernanceServices', () => ({
  getAccessibleCategoryIds: jest.fn(),
}));

const prisma = require('../../../src/utils/prisma');
const adminGovernanceServices = require('../../../src/services/adminGovernanceServices');
const {
  canAccessReport,
  canAdminManageReport,
  canAccessUser,
} = require('../../../src/utils/accessPolicy');

describe('accessPolicy', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('student can access own report', async () => {
    const report = { id: 10, userId: 1, categoryId: 2, status: 'PENDING' };
    const result = await canAccessReport({ userId: 1, role: 'MAHASISWA' }, report);
    expect(result.allowed).toBe(true);
  });

  test('student cannot access another user report', async () => {
    const report = { id: 10, userId: 2, categoryId: 2, status: 'PENDING' };
    const result = await canAccessReport({ userId: 1, role: 'MAHASISWA' }, report);
    expect(result.allowed).toBe(false);
    expect(result.statusCode).toBe(403);
  });

  test('admin can access only assigned category', async () => {
    adminGovernanceServices.getAccessibleCategoryIds.mockResolvedValue([7]);
    const allowed = await canAccessReport(
      { userId: 3, role: 'ADMIN' },
      { id: 10, userId: 2, categoryId: 7, status: 'PENDING' }
    );
    const denied = await canAccessReport(
      { userId: 3, role: 'ADMIN' },
      { id: 11, userId: 2, categoryId: 8, status: 'PENDING' }
    );

    expect(allowed.allowed).toBe(true);
    expect(denied.allowed).toBe(false);
  });

  test('superadmin can access any category', async () => {
    const result = await canAccessReport(
      { userId: 3, role: 'SUPERADMIN' },
      { id: 10, userId: 2, categoryId: 99, status: 'PENDING' }
    );
    expect(result.allowed).toBe(true);
    expect(adminGovernanceServices.getAccessibleCategoryIds).not.toHaveBeenCalled();
  });

  test('loads report by id when needed', async () => {
    prisma.report.findFirst.mockResolvedValue({ id: 10, userId: 1, categoryId: 2, status: 'PENDING' });
    const result = await canAccessReport({ userId: 1, role: 'MAHASISWA' }, 10);
    expect(prisma.report.findFirst).toHaveBeenCalledWith({
      where: { id: 10, deletedAt: null },
      select: expect.any(Object),
    });
    expect(result.allowed).toBe(true);
  });

  test('admin manage requires admin-tier role', async () => {
    const result = await canAdminManageReport(
      { userId: 1, role: 'MAHASISWA' },
      { id: 10, userId: 1, categoryId: 2, status: 'PENDING' }
    );
    expect(result.allowed).toBe(false);
    expect(result.statusCode).toBe(403);
  });

  test('user access is self or admin-tier only', () => {
    expect(canAccessUser({ userId: 1, role: 'MAHASISWA' }, 1)).toBe(true);
    expect(canAccessUser({ userId: 1, role: 'MAHASISWA' }, 2)).toBe(false);
    expect(canAccessUser({ userId: 3, role: 'ADMIN' }, 2)).toBe(true);
    expect(canAccessUser({ userId: 3, role: 'SUPERADMIN' }, 2)).toBe(true);
  });
});
