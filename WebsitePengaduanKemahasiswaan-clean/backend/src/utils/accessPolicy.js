const prisma = require('./prisma');
const { isAdmin, isSuperAdmin } = require('./rbac');
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
    },
  });
}

async function canAccessReport(user, reportOrId, options = {}) {
  const report = await getReportForAccess(reportOrId, options.includeDeleted);
  if (!report) {
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

module.exports = {
  getActorId,
  isReportOwner,
  getReportForAccess,
  canAccessReport,
  canAdminManageReport,
  canAccessUser,
};
