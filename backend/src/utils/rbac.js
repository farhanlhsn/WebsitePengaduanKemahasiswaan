/**
 * Role-based access control helpers for the SuperAdmin / Admin / Mahasiswa
 * three-tier model.
 *
 * Policy:
 *   - SUPERADMIN: full access. Manages categories, admin↔category assignments,
 *     audit logs, and can do anything an ADMIN can. SUPERADMIN itself never
 *     appears in admin_category_assignments because access is implicit.
 *   - ADMIN: scoped to categories that have been granted via
 *     admin_category_assignments. Cannot manage other admins, categories, or
 *     audit logs. Reports and chat are filtered server-side by their
 *     assignment list — an admin without any assignment sees nothing.
 *   - MAHASISWA: only manages their own reports.
 *
 * Anonymity policy is independent of role: SUPERADMIN does NOT bypass
 * anonymizer.js — anonymous reporter identity remains masked even from the
 * top tier. See utils/anonymizer.js for rationale.
 */

const ROLES = Object.freeze({
  MAHASISWA: 'MAHASISWA',
  ADMIN: 'ADMIN',
  SUPERADMIN: 'SUPERADMIN',
});

/**
 * Returns true if `user` has any of the listed roles.
 * @param {{ role?: string } | null | undefined} user
 * @param {...string} allowedRoles
 */
function hasRole(user, ...allowedRoles) {
  if (!user || !user.role) return false;
  return allowedRoles.includes(user.role);
}

function isSuperAdmin(user) {
  return hasRole(user, ROLES.SUPERADMIN);
}

function isAdmin(user) {
  // "ADMIN tier" — both regular admin and superadmin have admin-level access
  // to report/chat workflows. SUPERADMIN superset of ADMIN.
  return hasRole(user, ROLES.ADMIN, ROLES.SUPERADMIN);
}

function isStudent(user) {
  return hasRole(user, ROLES.MAHASISWA);
}

module.exports = {
  ROLES,
  hasRole,
  isSuperAdmin,
  isAdmin,
  isStudent,
};
