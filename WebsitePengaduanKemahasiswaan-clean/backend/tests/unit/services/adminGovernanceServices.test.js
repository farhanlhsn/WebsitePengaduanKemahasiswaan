/**
 * Tests for adminGovernanceServices (BE-6).
 *
 * Focus on the policy invariants that matter most:
 *   - Last SUPERADMIN cannot be demoted (lockout prevention)
 *   - Cannot grant categories to MAHASISWA or to existing SUPERADMINs
 *   - Demoting an admin clears their assignments
 *   - Promoting an ADMIN to SUPERADMIN clears their explicit assignments
 *   - getAccessibleCategoryIds returns null sentinel for SUPERADMIN
 */

// Mock prisma client that supports both `.findMany/findUnique/...` directly AND
// `.$transaction(fn => fn(tx))`. Each test injects per-call resolutions.
// Variable name must start with `mock` so jest's hoist allows referencing it
// from the mock factory.
const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
  category: {
    findUnique: jest.fn(),
  },
  adminCategoryAssignment: {
    upsert: jest.fn(),
    deleteMany: jest.fn(),
    delete: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
  },
  $transaction: jest.fn(),
};

jest.mock('../../../src/utils/prisma', () => mockPrisma);

const svc = require('../../../src/services/adminGovernanceServices');

beforeEach(() => {
  jest.clearAllMocks();
  mockPrisma.$transaction.mockImplementation(async (fn) => fn(mockPrisma));
});

describe('promoteToAdmin', () => {
  test('promotes a MAHASISWA to ADMIN and bumps tokenVersion', async () => {
    mockPrisma.user.findUnique.mockResolvedValueOnce({
      id: 5, role: 'MAHASISWA', deletedAt: null,
    });
    mockPrisma.user.update.mockResolvedValueOnce({ id: 5, role: 'ADMIN', name: 'Andi', email: 'andi@x' });

    const result = await svc.promoteToAdmin(5, 1);
    expect(result.role).toBe('ADMIN');
    expect(mockPrisma.user.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        role: 'ADMIN',
        isVerified: true,
        tokenVersion: { increment: 1 },
      }),
    }));
  });

  test('refuses to touch a SUPERADMIN', async () => {
    mockPrisma.user.findUnique.mockResolvedValueOnce({
      id: 5, role: 'SUPERADMIN', deletedAt: null,
    });
    await expect(svc.promoteToAdmin(5, 1)).rejects.toThrow(/SUPERADMIN/);
    expect(mockPrisma.user.update).not.toHaveBeenCalled();
  });

  test('idempotent for already-ADMIN target', async () => {
    mockPrisma.user.findUnique
      .mockResolvedValueOnce({ id: 5, role: 'ADMIN', deletedAt: null }) // initial check
      .mockResolvedValueOnce({ id: 5, role: 'ADMIN', name: 'A', email: 'a@x' }); // return value
    const result = await svc.promoteToAdmin(5, 1);
    expect(mockPrisma.user.update).not.toHaveBeenCalled();
    expect(result.role).toBe('ADMIN');
  });
});

describe('demoteAdmin', () => {
  test('demotes ADMIN, clears assignments, bumps tokenVersion', async () => {
    mockPrisma.user.findUnique.mockResolvedValueOnce({
      id: 5, role: 'ADMIN', deletedAt: null,
    });
    mockPrisma.adminCategoryAssignment.deleteMany.mockResolvedValueOnce({ count: 3 });
    mockPrisma.user.update.mockResolvedValueOnce({ id: 5, role: 'MAHASISWA', name: 'A', email: 'a@x' });

    const result = await svc.demoteAdmin(5, 1);
    expect(mockPrisma.adminCategoryAssignment.deleteMany).toHaveBeenCalledWith({
      where: { adminId: 5 },
    });
    expect(result.role).toBe('MAHASISWA');
  });

  test('refuses to demote SUPERADMIN through this method', async () => {
    mockPrisma.user.findUnique.mockResolvedValueOnce({
      id: 5, role: 'SUPERADMIN', deletedAt: null,
    });
    await expect(svc.demoteAdmin(5, 1)).rejects.toThrow(/demoteSuperAdmin/);
  });

  test('refuses if user is not an admin', async () => {
    mockPrisma.user.findUnique.mockResolvedValueOnce({
      id: 5, role: 'MAHASISWA', deletedAt: null,
    });
    await expect(svc.demoteAdmin(5, 1)).rejects.toThrow(/not an admin/);
  });
});

describe('demoteSuperAdmin (lockout guard)', () => {
  test('refuses to demote the last SUPERADMIN', async () => {
    mockPrisma.user.findUnique.mockResolvedValueOnce({
      id: 1, role: 'SUPERADMIN', deletedAt: null,
    });
    mockPrisma.user.count.mockResolvedValueOnce(0); // no other superadmins remain
    await expect(svc.demoteSuperAdmin(1, 1)).rejects.toThrow(/last SUPERADMIN/);
    expect(mockPrisma.user.update).not.toHaveBeenCalled();
  });

  test('demotes when at least one other SUPERADMIN remains', async () => {
    mockPrisma.user.findUnique.mockResolvedValueOnce({
      id: 1, role: 'SUPERADMIN', deletedAt: null,
    });
    mockPrisma.user.count.mockResolvedValueOnce(2);
    mockPrisma.user.update.mockResolvedValueOnce({ id: 1, role: 'ADMIN', name: 'A', email: 'a@x' });
    const result = await svc.demoteSuperAdmin(1, 99);
    expect(result.role).toBe('ADMIN');
  });

  test('refuses if target is not a SUPERADMIN', async () => {
    mockPrisma.user.findUnique.mockResolvedValueOnce({
      id: 5, role: 'ADMIN', deletedAt: null,
    });
    await expect(svc.demoteSuperAdmin(5, 1)).rejects.toThrow(/not a SUPERADMIN/);
  });
});

describe('promoteToSuperAdmin', () => {
  test('promotes ADMIN to SUPERADMIN and clears their assignments', async () => {
    mockPrisma.user.findUnique.mockResolvedValueOnce({
      id: 5, role: 'ADMIN', deletedAt: null,
    });
    mockPrisma.adminCategoryAssignment.deleteMany.mockResolvedValueOnce({ count: 2 });
    mockPrisma.user.update.mockResolvedValueOnce({ id: 5, role: 'SUPERADMIN', name: 'A', email: 'a@x' });

    const result = await svc.promoteToSuperAdmin(5, 1);
    expect(mockPrisma.adminCategoryAssignment.deleteMany).toHaveBeenCalled();
    expect(result.role).toBe('SUPERADMIN');
  });

  test('refuses to promote a MAHASISWA directly', async () => {
    mockPrisma.user.findUnique.mockResolvedValueOnce({
      id: 5, role: 'MAHASISWA', deletedAt: null,
    });
    await expect(svc.promoteToSuperAdmin(5, 1)).rejects.toThrow(/existing ADMIN/);
  });
});

describe('grantCategory', () => {
  test('grants ADMIN access to a category (idempotent upsert)', async () => {
    mockPrisma.user.findUnique.mockResolvedValueOnce({
      id: 5, role: 'ADMIN', deletedAt: null,
    });
    mockPrisma.category.findUnique.mockResolvedValueOnce({ id: 10, deletedAt: null });
    mockPrisma.adminCategoryAssignment.upsert.mockResolvedValueOnce({
      id: 1, adminId: 5, categoryId: 10, assignedAt: new Date(),
      category: { id: 10, name: 'Akademik', slug: 'akademik' },
    });

    const result = await svc.grantCategory(5, 10, 1);
    expect(result.adminId).toBe(5);
    expect(mockPrisma.adminCategoryAssignment.upsert).toHaveBeenCalledWith(expect.objectContaining({
      where: { adminId_categoryId: { adminId: 5, categoryId: 10 } },
      update: {},
      create: { adminId: 5, categoryId: 10, assignedById: 1 },
    }));
  });

  test('refuses to grant to MAHASISWA', async () => {
    mockPrisma.user.findUnique.mockResolvedValueOnce({
      id: 5, role: 'MAHASISWA', deletedAt: null,
    });
    await expect(svc.grantCategory(5, 10, 1)).rejects.toThrow(/MAHASISWA/);
  });

  test('refuses to grant to SUPERADMIN (already has all)', async () => {
    mockPrisma.user.findUnique.mockResolvedValueOnce({
      id: 5, role: 'SUPERADMIN', deletedAt: null,
    });
    await expect(svc.grantCategory(5, 10, 1)).rejects.toThrow(/all categories/);
  });

  test('refuses if category does not exist or is deleted', async () => {
    mockPrisma.user.findUnique.mockResolvedValueOnce({
      id: 5, role: 'ADMIN', deletedAt: null,
    });
    mockPrisma.category.findUnique.mockResolvedValueOnce(null);
    await expect(svc.grantCategory(5, 999, 1)).rejects.toThrow(/Category not found/);
  });
});

describe('revokeCategory', () => {
  test('returns revoked:true and deletes the row when assignment exists', async () => {
    mockPrisma.adminCategoryAssignment.findUnique.mockResolvedValueOnce({
      adminId: 5, categoryId: 10,
    });
    mockPrisma.adminCategoryAssignment.delete.mockResolvedValueOnce({});
    const result = await svc.revokeCategory(5, 10, 1);
    expect(result.revoked).toBe(true);
  });

  test('returns revoked:false when no assignment exists (idempotent)', async () => {
    mockPrisma.adminCategoryAssignment.findUnique.mockResolvedValueOnce(null);
    const result = await svc.revokeCategory(5, 10, 1);
    expect(result.revoked).toBe(false);
    expect(mockPrisma.adminCategoryAssignment.delete).not.toHaveBeenCalled();
  });
});

describe('getAccessibleCategoryIds', () => {
  test('returns null sentinel for SUPERADMIN (means: all)', async () => {
    const result = await svc.getAccessibleCategoryIds({ userId: 1, role: 'SUPERADMIN' });
    expect(result).toBeNull();
    expect(mockPrisma.adminCategoryAssignment.findMany).not.toHaveBeenCalled();
  });

  test('returns empty list for non-admin', async () => {
    expect(await svc.getAccessibleCategoryIds({ userId: 1, role: 'MAHASISWA' })).toEqual([]);
    expect(await svc.getAccessibleCategoryIds(null)).toEqual([]);
  });

  test('returns assigned category ids for ADMIN', async () => {
    mockPrisma.adminCategoryAssignment.findMany.mockResolvedValueOnce([
      { categoryId: 10 }, { categoryId: 11 },
    ]);
    const result = await svc.getAccessibleCategoryIds({ userId: 5, role: 'ADMIN' });
    expect(result).toEqual([10, 11]);
  });

  test('returns empty list for ADMIN with no assignments', async () => {
    mockPrisma.adminCategoryAssignment.findMany.mockResolvedValueOnce([]);
    const result = await svc.getAccessibleCategoryIds({ userId: 5, role: 'ADMIN' });
    expect(result).toEqual([]);
  });
});
