const { ROLES, hasRole, isSuperAdmin, isAdmin, isStudent } = require('../../../src/utils/rbac');

describe('rbac.hasRole', () => {
  test('returns false for null/undefined user', () => {
    expect(hasRole(null, ROLES.ADMIN)).toBe(false);
    expect(hasRole(undefined, ROLES.ADMIN)).toBe(false);
    expect(hasRole({}, ROLES.ADMIN)).toBe(false);
  });

  test('returns true when user role matches one of allowed roles', () => {
    expect(hasRole({ role: ROLES.ADMIN }, ROLES.ADMIN)).toBe(true);
    expect(hasRole({ role: ROLES.SUPERADMIN }, ROLES.ADMIN, ROLES.SUPERADMIN)).toBe(true);
  });

  test('returns false when user role is outside allowed roles', () => {
    expect(hasRole({ role: ROLES.MAHASISWA }, ROLES.ADMIN)).toBe(false);
  });
});

describe('rbac.isSuperAdmin', () => {
  test('only SUPERADMIN passes', () => {
    expect(isSuperAdmin({ role: ROLES.SUPERADMIN })).toBe(true);
    expect(isSuperAdmin({ role: ROLES.ADMIN })).toBe(false);
    expect(isSuperAdmin({ role: ROLES.MAHASISWA })).toBe(false);
    expect(isSuperAdmin(null)).toBe(false);
  });
});

describe('rbac.isAdmin (admin tier)', () => {
  test('SUPERADMIN counts as admin tier', () => {
    expect(isAdmin({ role: ROLES.SUPERADMIN })).toBe(true);
  });

  test('ADMIN counts as admin tier', () => {
    expect(isAdmin({ role: ROLES.ADMIN })).toBe(true);
  });

  test('MAHASISWA does NOT count as admin tier', () => {
    expect(isAdmin({ role: ROLES.MAHASISWA })).toBe(false);
  });

  test('null user is not admin', () => {
    expect(isAdmin(null)).toBe(false);
    expect(isAdmin(undefined)).toBe(false);
  });
});

describe('rbac.isStudent', () => {
  test('only MAHASISWA passes', () => {
    expect(isStudent({ role: ROLES.MAHASISWA })).toBe(true);
    expect(isStudent({ role: ROLES.ADMIN })).toBe(false);
    expect(isStudent({ role: ROLES.SUPERADMIN })).toBe(false);
  });
});

describe('rbac.ROLES enum', () => {
  test('contains exactly the three documented roles', () => {
    expect(Object.values(ROLES).sort()).toEqual(['ADMIN', 'MAHASISWA', 'SUPERADMIN']);
    expect(Object.isFrozen(ROLES)).toBe(true);
  });
});
