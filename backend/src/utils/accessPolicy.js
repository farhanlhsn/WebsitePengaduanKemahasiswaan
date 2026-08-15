const prisma = require('./prisma');
const { isAdmin, isSuperAdmin, isStudent } = require('./rbac');
const adminGovernanceServices = require('../services/adminGovernanceServices');

function getActorId(user) {
  return user?.userId ?? user?.id ?? null;
}

function isReportOwner(user, report) {
  const actorId = getActorId(user);
  return !!actorId && !!report?.userId && Number(report.userId) === Number(actorId);
}

async function getReportForAccess(reportOrId, includeDeleted = false) {
  if (reportOrId && typeof reportOrId === 'object') return reportOrId;

  const id = Number(reportOrId);
  if (!Number.isInteger(id)) return null;

  return prisma.report.findFirst({
    where: {
      id,
      ...(includeDeleted ? {} : { deletedAt: null }),
    },
    select: {
      id: true,
      userId: true,
      categoryId: true,
      status: true,
      deletedAt: true,
      isAnonymous: true,
    },
  });
}

async function canAccessReport(user, reportOrId, options = {}) {
  const report = await getReportForAccess(reportOrId, options.includeDeleted);
  if (!report) {
    return { allowed: false, statusCode: 404, reason: 'Report not found', report: null };
  }

  // Audit M14: laporan soft-deleted tidak boleh bisa diakses (termasuk
  // lampirannya) kecuali caller eksplisit meminta includeDeleted — berlaku
  // juga ketika objek report diserahkan langsung oleh middleware file.
  if (!options.includeDeleted && report.deletedAt) {
    return { allowed: false, statusCode: 404, reason: 'Report not found', report: null };
  }

  if (isReportOwner(user, report)) {
    return { allowed: true, report };
  }

  if (!isAdmin(user)) {
    return { allowed: false, statusCode: 403, reason: 'You can only access your own reports', report };
  }

  if (isSuperAdmin(user)) {
    return { allowed: true, report };
  }

  const accessibleCategoryIds = await adminGovernanceServices.getAccessibleCategoryIds(user);
  const allowed =
    Array.isArray(accessibleCategoryIds) &&
    report.categoryId &&
    accessibleCategoryIds.includes(report.categoryId);

  return allowed
    ? { allowed: true, report }
    : {
        allowed: false,
        statusCode: 403,
        reason: 'You are not assigned to this report\'s category',
        report,
      };
}

async function canAdminManageReport(user, reportOrId, options = {}) {
  if (!isAdmin(user)) {
    return { allowed: false, statusCode: 403, reason: 'Admin privileges required', report: null };
  }

  const access = await canAccessReport(user, reportOrId, options);
  if (!access.allowed) return access;
  return { allowed: true, report: access.report };
}

function canAccessUser(user, targetUserId) {
  const actorId = getActorId(user);
  if (!actorId) return false;
  return isAdmin(user) || Number(actorId) === Number(targetUserId);
}

/**
 * Kebijakan direktori user (audit C1/B5): membatasi siapa bisa membaca
 * profil user lain, agar userId yang bocor tidak bisa dipakai
 * deanonymisasi via GET /users/:id.
 *
 * - SUPERADMIN: bisa melihat semua user.
 * - ADMIN biasa: hanya boleh melihat user MAHASISWA (target admin-tier
 *   adalah domain SUPERADMIN).
 * - Semua role: boleh melihat profil sendiri.
 *
 * @param {{userId:number, role:string}} actor
 * @param {{id:number, role:string}} target user yang sudah di-fetch
 */
function canViewUser(actor, target) {
  if (!actor || !target) return false;
  const actorId = getActorId(actor);
  if (Number(actorId) === Number(target.id)) return true;
  if (isSuperAdmin(actor)) return true;
  if (isAdmin(actor)) return isStudent(target);
  return false;
}

module.exports = {
  getActorId,
  isReportOwner,
  getReportForAccess,
  canAccessReport,
  canAdminManageReport,
  canAccessUser,
  canViewUser,
};
