/**
 * Unit tests for user governance policy error codes.
 */

const {
  UserGovernanceError,
  assertCanManageUser,
  ERROR_CODES,
} = require('../../../src/utils/userGovernancePolicy');

jest.mock('../../../src/services/adminGovernanceServices', () => ({
  countActiveSuperAdmins: jest.fn().mockResolvedValue(1),
}));

describe('userGovernancePolicy', () => {
  const superadmin = { userId: 1, role: 'SUPERADMIN' };
  const admin = { userId: 2, role: 'ADMIN' };
  const student = { id: 10, role: 'MAHASISWA' };
  const otherAdmin = { id: 20, role: 'ADMIN' };

  it('allows SUPERADMIN to manage admin-tier users', async () => {
    await expect(assertCanManageUser(superadmin, otherAdmin, 'soft_delete')).resolves.toBe(true);
  });

  it('blocks regular ADMIN from managing admin-tier users', async () => {
    await expect(assertCanManageUser(admin, otherAdmin, 'update')).rejects.toMatchObject({
      code: ERROR_CODES.TARGET_ROLE_FORBIDDEN,
    });
  });

  it('blocks self-destructive delete', async () => {
    await expect(
      assertCanManageUser(admin, { id: admin.userId, role: 'MAHASISWA' }, 'soft_delete')
    ).rejects.toMatchObject({
      code: ERROR_CODES.SELF_DESTRUCTIVE_ACTION,
    });
  });

  it('requires SUPERADMIN for cleanup', async () => {
    await expect(assertCanManageUser(admin, null, 'cleanup')).rejects.toMatchObject({
      code: ERROR_CODES.SUPERADMIN_REQUIRED,
    });
  });

  it('allows ADMIN to verify MAHASISWA', async () => {
    await expect(assertCanManageUser(admin, student, 'verify')).resolves.toBe(true);
  });
});
