const prisma = require('./prisma');
const { ROLES, isSuperAdmin, isAdmin } = require('./rbac');
const adminGovernanceServices = require('../services/adminGovernanceServices');

const ERROR_CODES = Object.freeze({
  TARGET_ROLE_FORBIDDEN: 'TARGET_ROLE_FORBIDDEN',
  LAST_SUPERADMIN: 'LAST_SUPERADMIN',
  SELF_DESTRUCTIVE_ACTION: 'SELF_DESTRUCTIVE_ACTION',
  SUPERADMIN_REQUIRED: 'SUPERADMIN_REQUIRED',
});

class UserGovernanceError extends Error {
  constructor(code, message, statusCode = 403) {
    super(message);
    this.name = 'UserGovernanceError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

function getActorId(user) {
  return user?.userId ?? user?.id ?? null;
}

function isAdminTierRole(role) {
  return role === ROLES.ADMIN || role === ROLES.SUPERADMIN;
}

function isMahasiswaRole(role) {
  return role === ROLES.MAHASISWA;
}

/**
 * Whether actor may perform user-management operations on target.
 * @param {'view'|'update'|'verify'|'reject'|'soft_delete'|'restore'|'permanent_delete'|'cleanup'|'export'} operation
 */
async function assertCanManageUser(actor, targetUser, operation = 'update') {
  const actorId = getActorId(actor);
  const targetId = targetUser?.id;

  if (!actor || !isAdmin(actor)) {
    throw new UserGovernanceError(
      ERROR_CODES.TARGET_ROLE_FORBIDDEN,
      'Admin privileges required',
      403
    );
  }

  const superadminOnlyOps = ['cleanup', 'export', 'permanent_delete'];
  if (superadminOnlyOps.includes(operation) && !isSuperAdmin(actor)) {
    throw new UserGovernanceError(
      ERROR_CODES.SUPERADMIN_REQUIRED,
      'This operation requires SUPERADMIN privileges',
      403
    );
  }

  if (targetId && actorId && Number(targetId) === Number(actorId)) {
    const destructiveOps = ['soft_delete', 'permanent_delete', 'reject'];
    if (destructiveOps.includes(operation)) {
      throw new UserGovernanceError(
        ERROR_CODES.SELF_DESTRUCTIVE_ACTION,
        'Cannot perform destructive actions on your own account',
        403
      );
    }
  }

  if (targetUser && isAdminTierRole(targetUser.role) && !isSuperAdmin(actor)) {
    throw new UserGovernanceError(
      ERROR_CODES.TARGET_ROLE_FORBIDDEN,
      'Regular admins cannot manage admin-tier accounts',
      403
    );
  }

  if (
    targetUser?.role === ROLES.SUPERADMIN &&
    ['soft_delete', 'permanent_delete'].includes(operation)
  ) {
    const count = await adminGovernanceServices.countActiveSuperAdmins();
    if (count <= 1) {
      throw new UserGovernanceError(
        ERROR_CODES.LAST_SUPERADMIN,
        'Cannot delete or demote the last active SUPERADMIN',
        403
      );
    }
  }

  if (!isSuperAdmin(actor) && targetUser && !isMahasiswaRole(targetUser.role)) {
    throw new UserGovernanceError(
      ERROR_CODES.TARGET_ROLE_FORBIDDEN,
      'Regular admins can only manage MAHASISWA accounts',
      403
    );
  }

  return true;
}

async function getTargetUserOrThrow(userId, includeDeleted = false) {
  const target = await prisma.user.findFirst({
    where: {
      id: parseInt(userId),
      ...(includeDeleted ? {} : { deletedAt: null }),
    },
    select: { id: true, role: true, deletedAt: true, name: true, email: true },
  });
  if (!target) {
    throw new UserGovernanceError('USER_NOT_FOUND', 'User not found', 404);
  }
  return target;
}

function filterUsersForActor(actor, users) {
  if (isSuperAdmin(actor)) return users;
  return users.filter((u) => isMahasiswaRole(u.role));
}

module.exports = {
  ERROR_CODES,
  UserGovernanceError,
  assertCanManageUser,
  getTargetUserOrThrow,
  filterUsersForActor,
  isAdminTierRole,
  isMahasiswaRole,
};
