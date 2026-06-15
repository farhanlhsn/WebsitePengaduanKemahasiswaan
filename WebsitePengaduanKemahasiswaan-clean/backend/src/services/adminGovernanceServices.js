const prisma = require('../utils/prisma');
const { ROLES } = require('../utils/rbac');
const { getLogger } = require('../utils/logger');
const log = getLogger('admin-governance:service');

/**
 * SUPERADMIN-only governance: managing admins, their categories, and the
 * assignment audit trail.
 *
 * Invariants enforced here:
 *   - At least one ACTIVE SUPERADMIN must always exist. Demoting / deleting
 *     the last one is rejected at service level so the system can never lock
 *     itself out of governance.
 *   - SUPERADMINs are not assignable to specific categories (their access is
 *     implicit and global). Granting them an explicit row would be redundant
 *     and confuse the access model.
 *   - Only ADMIN-tier users (ADMIN role) can be granted category access. We
 *     refuse to grant access to MAHASISWA users.
 */
class AdminGovernanceServices {
  /**
   * List all admin-tier users (ADMIN + SUPERADMIN), with the categories each
   * is assigned to. SUPERADMINs always show as having "all" categories.
   */
  async listAdmins() {
    const admins = await prisma.user.findMany({
      where: {
        role: { in: [ROLES.ADMIN, ROLES.SUPERADMIN] },
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isVerified: true,
        createdAt: true,
        categoryAssignments: {
          select: {
            id: true,
            categoryId: true,
            assignedAt: true,
            category: { select: { id: true, name: true, slug: true } },
            assignedBy: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: [{ role: 'asc' }, { name: 'asc' }],
    });
    return admins;
  }

  /**
   * Count of currently active SUPERADMINs. Used to guard against demoting /
   * deleting the last one.
   */
  async countActiveSuperAdmins() {
    return prisma.user.count({
      where: { role: ROLES.SUPERADMIN, deletedAt: null },
    });
  }

  /**
   * Promote an existing user to ADMIN. Use case: SUPERADMIN onboards a new
   * admin from the verified mahasiswa pool, or upgrades a previously demoted
   * admin. Refuses to touch SUPERADMINs (use changeRole for explicit transitions).
   */
  async promoteToAdmin(targetUserId, actorId) {
    return prisma.$transaction(async (tx) => {
      const target = await tx.user.findUnique({
        where: { id: targetUserId },
        select: { id: true, role: true, deletedAt: true },
      });
      if (!target || target.deletedAt) throw new Error('Target user not found');
      if (target.role === ROLES.SUPERADMIN) {
        throw new Error('Cannot change role of a SUPERADMIN through this endpoint');
      }
      if (target.role === ROLES.ADMIN) {
        // Idempotent — already an admin.
        return tx.user.findUnique({ where: { id: targetUserId } });
      }

      const updated = await tx.user.update({
        where: { id: targetUserId },
        data: {
          role: ROLES.ADMIN,
          isVerified: true,
          // Bump tokenVersion so any existing JWT for this user is invalidated
          // and the new role is picked up on next login.
          tokenVersion: { increment: 1 },
        },
        select: { id: true, name: true, email: true, role: true },
      });
      log.info('promoteToAdmin success', { targetUserId, actorId });
      return updated;
    });
  }

  /**
   * Demote an ADMIN back to MAHASISWA, removing all category assignments.
   * Refuses to demote SUPERADMINs (caller must use changeRole / demoteSuperAdmin).
   */
  async demoteAdmin(targetUserId, actorId) {
    return prisma.$transaction(async (tx) => {
      const target = await tx.user.findUnique({
        where: { id: targetUserId },
        select: { id: true, role: true, deletedAt: true },
      });
      if (!target || target.deletedAt) throw new Error('Target user not found');
      if (target.role === ROLES.SUPERADMIN) {
        throw new Error('Use demoteSuperAdmin to demote a SUPERADMIN');
      }
      if (target.role !== ROLES.ADMIN) {
        throw new Error('User is not an admin');
      }

      // Drop assignments first (cascades on FK, but explicit for audit clarity).
      await tx.adminCategoryAssignment.deleteMany({ where: { adminId: targetUserId } });

      const updated = await tx.user.update({
        where: { id: targetUserId },
        data: { role: ROLES.MAHASISWA, tokenVersion: { increment: 1 } },
        select: { id: true, name: true, email: true, role: true },
      });
      log.info('demoteAdmin success', { targetUserId, actorId });
      return updated;
    });
  }

  /**
   * Promote an ADMIN to SUPERADMIN.
   */
  async promoteToSuperAdmin(targetUserId, actorId) {
    return prisma.$transaction(async (tx) => {
      const target = await tx.user.findUnique({
        where: { id: targetUserId },
        select: { id: true, role: true, deletedAt: true },
      });
      if (!target || target.deletedAt) throw new Error('Target user not found');
      if (target.role === ROLES.SUPERADMIN) {
        return tx.user.findUnique({ where: { id: targetUserId } });
      }
      if (target.role !== ROLES.ADMIN) {
        throw new Error('Only existing ADMINs can be promoted to SUPERADMIN');
      }

      // SUPERADMIN access is implicit and global — drop their explicit
      // assignments to keep the table clean.
      await tx.adminCategoryAssignment.deleteMany({ where: { adminId: targetUserId } });

      const updated = await tx.user.update({
        where: { id: targetUserId },
        data: { role: ROLES.SUPERADMIN, tokenVersion: { increment: 1 } },
        select: { id: true, name: true, email: true, role: true },
      });
      log.info('promoteToSuperAdmin success', { targetUserId, actorId });
      return updated;
    });
  }

  /**
   * Demote a SUPERADMIN to ADMIN. Refuses if it would leave zero SUPERADMINs.
   */
  async demoteSuperAdmin(targetUserId, actorId) {
    return prisma.$transaction(async (tx) => {
      const target = await tx.user.findUnique({
        where: { id: targetUserId },
        select: { id: true, role: true, deletedAt: true },
      });
      if (!target || target.deletedAt) throw new Error('Target user not found');
      if (target.role !== ROLES.SUPERADMIN) {
        throw new Error('User is not a SUPERADMIN');
      }

      const remaining = await tx.user.count({
        where: { role: ROLES.SUPERADMIN, deletedAt: null, NOT: { id: targetUserId } },
      });
      if (remaining < 1) {
        throw new Error('Cannot demote the last SUPERADMIN. Promote another user first.');
      }

      const updated = await tx.user.update({
        where: { id: targetUserId },
        data: { role: ROLES.ADMIN, tokenVersion: { increment: 1 } },
        select: { id: true, name: true, email: true, role: true },
      });
      log.info('demoteSuperAdmin success', { targetUserId, actorId });
      return updated;
    });
  }

  /**
   * Grant an admin access to a category. Idempotent — granting twice is a no-op.
   */
  async grantCategory(adminId, categoryId, grantorId) {
    return prisma.$transaction(async (tx) => {
      const target = await tx.user.findUnique({
        where: { id: adminId },
        select: { id: true, role: true, deletedAt: true },
      });
      if (!target || target.deletedAt) throw new Error('Target admin not found');
      if (target.role === ROLES.MAHASISWA) {
        throw new Error('Cannot grant category access to a MAHASISWA — promote them first');
      }
      if (target.role === ROLES.SUPERADMIN) {
        throw new Error('SUPERADMIN already has access to all categories');
      }

      const category = await tx.category.findUnique({
        where: { id: categoryId },
        select: { id: true, deletedAt: true },
      });
      if (!category || category.deletedAt) throw new Error('Category not found');

      const assignment = await tx.adminCategoryAssignment.upsert({
        where: { adminId_categoryId: { adminId, categoryId } },
        update: {}, // Idempotent: keep existing row
        create: { adminId, categoryId, assignedById: grantorId },
        select: {
          id: true,
          adminId: true,
          categoryId: true,
          assignedAt: true,
          category: { select: { id: true, name: true, slug: true } },
        },
      });
      log.info('grantCategory success', { adminId, categoryId, grantorId });
      return assignment;
    });
  }

  /**
   * Revoke an admin's access to a category. Idempotent — revoking nothing is OK.
   */
  async revokeCategory(adminId, categoryId, actorId) {
    const existing = await prisma.adminCategoryAssignment.findUnique({
      where: { adminId_categoryId: { adminId, categoryId } },
    });
    if (!existing) {
      log.info('revokeCategory no-op (already revoked)', { adminId, categoryId });
      return { revoked: false };
    }
    await prisma.adminCategoryAssignment.delete({
      where: { adminId_categoryId: { adminId, categoryId } },
    });
    log.info('revokeCategory success', { adminId, categoryId, actorId });
    return { revoked: true };
  }

  /**
   * Get the set of categoryIds an admin can access. Returns null for
   * SUPERADMIN to denote "all categories" (caller treats null as no filter).
   *
   * Returns an empty array if an ADMIN has no assignments, which is the
   * correct default — they should see nothing until granted.
   */
  async getAccessibleCategoryIds(user) {
    if (!user) return [];
    if (user.role === ROLES.SUPERADMIN) return null; // sentinel for "all"
    if (user.role !== ROLES.ADMIN) return [];

    const rows = await prisma.adminCategoryAssignment.findMany({
      where: { adminId: user.userId },
      select: { categoryId: true },
    });
    return rows.map((r) => r.categoryId);
  }
}

module.exports = new AdminGovernanceServices();
