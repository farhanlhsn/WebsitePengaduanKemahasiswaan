const bcrypt = require('bcryptjs');
const prisma = require('../utils/prisma');
const userServices = require('../services/userServices');
const auditLogServices = require('../services/auditLogServices');
const emailService = require('../services/emailService');
const ResponseFormatter = require('../utils/responseFormatter');
const { isAllowedDomain } = require('../utils/emailValidator');
const { canAccessUser, canViewUser } = require('../utils/accessPolicy');
const {
  UserGovernanceError,
  assertCanManageUser,
  getTargetUserOrThrow,
  filterUsersForActor,
} = require('../utils/userGovernancePolicy');
const { getLogger } = require('../utils/logger');
const log = getLogger('user:controller');

function handleGovernanceError(res, error) {
  if (error instanceof UserGovernanceError) {
    return res.status(error.statusCode).json({
      ...ResponseFormatter.error(error.message, error.statusCode),
      code: error.code,
    });
  }
  return null;
}

exports.getAllUsers = async (req, res) => {
  try {
    const includeDeleted = req.query.includeDeleted === 'true' || req.query.includeDeleted === true;
    log.info('Get all users', { includeDeleted });
    let users = await userServices.getAllUsers(includeDeleted);
    users = filterUsersForActor(req.user, users);
    
    res.status(200).json(ResponseFormatter.success(users, 'Users retrieved successfully'));
  } catch (error) {
    log.error('getAllUsers error', { error: error.message });
    res.status(500).json(ResponseFormatter.error(`Failed to get users: ${error.message}`, 500));
  }
};

exports.getUserById = async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    log.info('Get user by id', { userId });
    const includeDeleted = req.query.includeDeleted === 'true' || req.query.includeDeleted === true;
    
    // Validate userId
    if (!userId || isNaN(userId)) {
      return res.status(400).json(ResponseFormatter.error('Invalid user ID provided', 400));
    }

    const user = await userServices.getUserById(userId, includeDeleted);

    // Security (audit C1/B5): batasi siapa yang boleh membaca profil user ini
    // agar userId tidak bisa dipakai deanonymisasi via direktori user.
    if (!canViewUser(req.user, user)) {
      return res.status(403).json(ResponseFormatter.error('Access denied', 403));
    }

    res.status(200).json(ResponseFormatter.success(user, 'User retrieved successfully'));
  } catch (error) {
    log.warn('getUserById error', { error: error.message });
    res.status(404).json(ResponseFormatter.error('User not found', 404));
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    log.info('Update profile', { userId });

    // Only allow updating allowed fields
    const { name, email, nim, currentPassword } = req.body;
    const updateData = {};
    if (name) updateData.name = name;
    if (nim) updateData.nim = nim;

    // Audit M7: perubahan email adalah operasi sensitif — wajib konfirmasi
    // password lama, domain kampus tetap divalidasi, dan semua sesi
    // diinvalidasi setelahnya.
    let emailChanged = false;
    if (email) {
      const current = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, password: true },
      });
      if (!current) {
        return res.status(404).json(ResponseFormatter.error('User not found', 404));
      }

      emailChanged = String(email).toLowerCase() !== String(current.email).toLowerCase();
      if (emailChanged) {
        if (!currentPassword) {
          return res.status(400).json(
            ResponseFormatter.error('Password saat ini wajib diisi untuk mengubah email', 400)
          );
        }
        const passwordOk = await bcrypt.compare(currentPassword, current.password);
        if (!passwordOk) {
          return res.status(400).json(
            ResponseFormatter.error('Password saat ini tidak sesuai', 400)
          );
        }
        if (!isAllowedDomain(email)) {
          return res.status(400).json(
            ResponseFormatter.error('Domain email tidak diizinkan', 400)
          );
        }
      }
      updateData.email = email;
    }

    if (!name && !nim && !email) {
      return res.status(400).json(ResponseFormatter.error('Tidak ada data yang diubah', 400));
    }

    const updatedUser = await userServices.updateUser(userId, updateData);

    // Invalidasi semua sesi setelah email berubah (increment tokenVersion +
    // hapus refresh token) — dilakukan terpisah karena guard service
    // memblokir mutasi tokenVersion lewat jalur update umum.
    if (emailChanged) {
      await prisma.user.update({
        where: { id: userId },
        data: { tokenVersion: { increment: 1 } },
      });
      await prisma.refreshToken.deleteMany({ where: { userId } });

      // Audit L2: perubahan email wajib tercatat.
      try {
        await auditLogServices.createAuditLog({
          entityType: 'USER',
          action: 'UPDATE',
          entityId: userId,
          actorId: userId,
          actorName: req.user.name,
          actorRole: req.user.role,
          ip: req.ip,
          userAgent: req.headers['user-agent'],
          metadata: { updatedFields: ['email'], note: 'email berubah, sesi diinvalidasi' },
        });
      } catch (auditError) {
        log.error('Failed to create audit log for email change', { error: auditError.message });
      }
    }

    // Remove password from response
    const { password, ...userWithoutPassword } = updatedUser;

    res.status(200).json(ResponseFormatter.success(
      { ...userWithoutPassword, ...(emailChanged ? { requireReLogin: true } : {}) },
      emailChanged ? 'Email berubah. Silakan login kembali.' : 'Profile updated successfully'
    ));
  } catch (error) {
    log.warn('updateProfile error', { error: error.message });
    res.status(400).json(ResponseFormatter.error('Profile update failed', 400));
  }
};

/**
 * GET /users/preferences/me — ambil preferensi pengguna (tema, bahasa,
 * notifikasi). Mengembalikan {} bila belum pernah disimpan.
 */
exports.getMyPreferences = async (req, res) => {
  try {
    const userId = req.user.userId;
    const preferences = await userServices.getPreferences(userId);
    res.status(200).json(ResponseFormatter.success(preferences || {}, 'Preferences retrieved'));
  } catch (error) {
    log.warn('getMyPreferences error', { error: error.message });
    res.status(500).json(ResponseFormatter.error('Failed to get preferences', 500));
  }
};

/**
 * PUT /users/preferences/me — simpan preferensi pengguna per akun (persisten,
 * bukan hanya localStorage). Body: objek JSON bebas (theme, language,
 * notifications, dst.).
 */
exports.updateMyPreferences = async (req, res) => {
  try {
    const userId = req.user.userId;
    const preferences = req.body && typeof req.body === 'object' && !Array.isArray(req.body)
      ? req.body
      : null;
    if (!preferences) {
      return res.status(400).json(ResponseFormatter.error('Body harus berupa objek preferensi', 400));
    }
    const saved = await userServices.updatePreferences(userId, preferences);
    res.status(200).json(ResponseFormatter.success(saved, 'Preferences saved'));
  } catch (error) {
    log.warn('updateMyPreferences error', { error: error.message });
    res.status(400).json(ResponseFormatter.error('Failed to save preferences', 400));
  }
};

exports.updateUser = async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    log.info('Update user', { userId });
    const target = await getTargetUserOrThrow(userId, true);
    await assertCanManageUser(req.user, target, 'update');

    // Security (mass-assignment): hanya field profil yang boleh diubah lewat
    // endpoint ini. Perubahan role/password/verifikasi/tokenVersion harus
    // melalui endpoint khususnya masing-masing — jangan spread req.body ke Prisma.
    const updateData = {};
    if (req.body.name !== undefined) updateData.name = req.body.name;
    if (req.body.email !== undefined) updateData.email = req.body.email;
    if (req.body.nim !== undefined) updateData.nim = req.body.nim;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json(
        ResponseFormatter.error('Tidak ada field yang dapat diperbarui (hanya name, email, nim)', 400)
      );
    }

    const updatedUser = await userServices.updateUser(userId, updateData);

    // Create audit log
    try {
      await auditLogServices.createAuditLog({
        entityType: 'USER',
        action: 'UPDATE',
        entityId: userId,
        actorId: req.user.userId,
        actorName: req.user.name,
        actorRole: req.user.role,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        metadata: {
          userName: updatedUser.name,
          userEmail: updatedUser.email,
          userRole: updatedUser.role,
          updatedFields: Object.keys(updateData)
        }
      });
    } catch (auditError) {
      log.error('Failed to create audit log for update user', { error: auditError.message });
    }

    // Remove password from response
    const { password, ...userWithoutPassword } = updatedUser;
    
    res.status(200).json(ResponseFormatter.success(userWithoutPassword, 'User updated successfully'));
  } catch (error) {
    if (handleGovernanceError(res, error)) return;
    log.warn('updateUser error', { error: error.message });
    res.status(400).json(ResponseFormatter.error('Update failed', 400));
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    log.info('Delete user', { userId });
    
    if (!userId || isNaN(userId)) {
      return res.status(400).json(ResponseFormatter.error('Invalid user ID provided', 400));
    }

    const user = await getTargetUserOrThrow(userId, true);
    await assertCanManageUser(req.user, user, 'soft_delete');
    
    // Get user details before deletion for audit log
    // Include deleted users to allow soft-deleting an already deleted user (idempotent) or just to verify existence
    const userDetails = await userServices.getUserById(userId, true);
    
    await userServices.deleteUser(userId);
    
    // Create audit log
    try {
      await auditLogServices.createAuditLog({
        entityType: 'USER',
        action: 'SOFT_DELETE',
        entityId: userId,
        actorId: req.user.userId,
        actorName: req.user.name,
        actorRole: req.user.role,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        metadata: {
          userName: userDetails.name,
          userEmail: userDetails.email,
          userRole: userDetails.role
        }
      });
    } catch (auditError) {
      log.error('Failed to create audit log for delete user', { error: auditError.message });
    }
    
    res.status(200).json(ResponseFormatter.success(null, 'User deleted successfully (soft delete)'));
  } catch (error) {
    if (handleGovernanceError(res, error)) return;
    log.warn('deleteUser error', { error: error.message });
    res.status(400).json(ResponseFormatter.error('Failed to delete user', 400));
  }
};

exports.restoreUser = async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    log.info('Restore user', { userId });
    
    if (!userId || isNaN(userId)) {
      return res.status(400).json(ResponseFormatter.error('Invalid user ID provided', 400));
    }

    const target = await getTargetUserOrThrow(userId, true);
    await assertCanManageUser(req.user, target, 'restore');
    
    const restoredUser = await userServices.restoreUser(userId);
    
    // Create audit log
    try {
      await auditLogServices.createAuditLog({
        entityType: 'USER',
        action: 'RESTORE',
        entityId: userId,
        actorId: req.user.userId,
        actorName: req.user.name,
        actorRole: req.user.role,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        metadata: {
          userName: restoredUser.name,
          userEmail: restoredUser.email,
          userRole: restoredUser.role
        }
      });
    } catch (auditError) {
      log.error('Failed to create audit log for restore user', { error: auditError.message });
    }
    
    const { password, ...userWithoutPassword } = restoredUser;
    
    res.status(200).json(ResponseFormatter.success(userWithoutPassword, 'User restored successfully'));
  } catch (error) {
    if (handleGovernanceError(res, error)) return;
    log.warn('restoreUser error', { error: error.message });
    res.status(400).json(ResponseFormatter.error('Failed to restore user', 400));
  }
};

exports.permanentDeleteUser = async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    log.info('Permanent delete user', { userId, role: req.user?.role });
    
    if (!userId || isNaN(userId)) {
      return res.status(400).json(ResponseFormatter.error('Invalid user ID provided', 400));
    }

    const target = await getTargetUserOrThrow(userId, true);
    await assertCanManageUser(req.user, target, 'permanent_delete');
    
    const user = await userServices.getUserById(userId, true);
    
    await userServices.permanentDeleteUser(userId);
    
    // Create audit log
    try {
      await auditLogServices.createAuditLog({
        entityType: 'USER',
        action: 'HARD_DELETE',
        entityId: userId,
        actorId: req.user.userId,
        actorName: req.user.name,
        actorRole: req.user.role,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        metadata: {
          userName: user.name,
          userEmail: user.email,
          userRole: user.role
        }
      });
    } catch (auditError) {
      log.error('Failed to create audit log for permanent delete user', { error: auditError.message });
    }
    
    res.status(200).json(ResponseFormatter.success(null, 'User permanently deleted'));
  } catch (error) {
    if (handleGovernanceError(res, error)) return;
    log.warn('permanentDeleteUser error', { error: error.message });
    res.status(400).json(ResponseFormatter.error('Failed to permanently delete user', 400));
  }
};

exports.getUserByEmail = async (req, res) => {
  try {
    const email = req.params.email;
    log.info('Get user by email', { email });
    const includeDeleted = req.query.includeDeleted === 'true';
    
    if (!email) {
      return res.status(400).json(ResponseFormatter.error('Email parameter is required', 400));
    }

    const user = await userServices.findUserByEmail(email, includeDeleted);
    if (!user) {
      return res.status(404).json(ResponseFormatter.error('User not found', 404));
    }

    // Kebijakan direktori yang sama dengan GET /users/:id.
    if (!canViewUser(req.user, user)) {
      return res.status(403).json(ResponseFormatter.error('Access denied', 403));
    }

    // Don't return password
    const { password, ...userWithoutPassword } = user;
    
    res.status(200).json(ResponseFormatter.success(userWithoutPassword, 'User found'));
  } catch (error) {
    log.error('getUserByEmail error', { error: error.message });
    res.status(500).json(ResponseFormatter.error('Internal server error', 500));
  }
};

exports.rejectStudent = async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { reason } = req.body;
    log.info('Reject student', { userId, reason });

    const target = await getTargetUserOrThrow(userId);
    await assertCanManageUser(req.user, target, 'reject');

    const user = await userServices.getUserById(userId);

    if (!user) {
      return res.status(404).json(ResponseFormatter.error('User not found', 404));
    }

    if (user.isVerified) {
      return res.status(400).json(ResponseFormatter.error('User is already verified', 400));
    }

    // Soft delete the user (rejected)
    await userServices.deleteUser(userId);

    // Create audit log
    try {
      await auditLogServices.createAuditLog({
        entityType: 'USER',
        action: 'SOFT_DELETE',
        entityId: userId,
        actorId: req.user.userId,
        actorName: req.user.name,
        actorRole: req.user.role,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        metadata: {
          userName: user.name,
          userEmail: user.email,
          nim: user.nim,
          action: 'REJECT_REGISTRATION',
          reason
        }
      });
    } catch (auditError) {
      log.error('Failed to create audit log for reject student', { error: auditError.message });
    }

    // Send rejection email
    emailService.sendRejectionEmail(user.email, user.name, reason)
      .catch(err => log.error('Rejection email failed', { error: err.message }));

    res.status(200).json(ResponseFormatter.success(null, 'Registrasi ditolak'));
  } catch (error) {
    if (handleGovernanceError(res, error)) return;
    log.warn('rejectStudent error', { error: error.message });
    res.status(400).json(ResponseFormatter.error('Failed to reject student', 400));
  }
};

exports.verifyStudent = async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    log.info('Verify student', { userId });
    const target = await getTargetUserOrThrow(userId);
    await assertCanManageUser(req.user, target, 'verify');
    const user = await userServices.verifyUser(userId);
    
    // Create audit log
    try {
      await auditLogServices.createAuditLog({
        entityType: 'USER',
        action: 'VERIFY_MAHASISWA',
        entityId: userId,
        actorId: req.user.userId,
        actorName: req.user.name,
        actorRole: req.user.role,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        metadata: {
          userName: user.name,
          userEmail: user.email,
          nim: user.nim
        }
      });
    } catch (auditError) {
      log.error('Failed to create audit log for verify student', { error: auditError.message });
      // Don't fail the operation if audit logging fails
    }
    
    // Send verification email notification (fire-and-forget)
    emailService.notifyAccountVerified(user.email, user.name)
      .catch(err => log.error('Verification email failed', { error: err.message }));
    
    const { password, ...userWithoutPassword } = user;
    
    res.status(200).json(ResponseFormatter.success(userWithoutPassword, 'User verified successfully'));
  } catch (error) {
    if (handleGovernanceError(res, error)) return;
    if (error.message && error.message.includes('KTM')) {
      return res.status(400).json(ResponseFormatter.error(error.message, 400));
    }
    log.warn('verifyStudent error', { error: error.message });
    return res.status(404).json(ResponseFormatter.error('User not found', 404));
  }
};

exports.getUserVerificationStats = async (req, res) => {
  try {
    log.info('getUserVerificationStats controller called');
    const stats = await userServices.getUserVerificationStats();
    log.info('User verification stats computed');
    res.status(200).json(ResponseFormatter.success(stats, 'User statistics retrieved successfully'));
  } catch (error) {
    log.error('getUserVerificationStats error', { error: error.message });
    res.status(500).json(ResponseFormatter.error('Failed to get user statistics', 500));
  }
};

exports.cleanupOldDeletedUsers = async (req, res) => {
  try {
    await assertCanManageUser(req.user, null, 'cleanup');
    const daysOld = parseInt(req.query.daysOld) || 90;
    log.info('Cleanup old deleted users', { daysOld });
    const result = await userServices.cleanupOldDeletedUsers(daysOld);
    
    res.status(200).json(ResponseFormatter.success(result, `Cleaned up users deleted more than ${daysOld} days ago`));
  } catch (error) {
    if (handleGovernanceError(res, error)) return;
    log.error('cleanupOldDeletedUsers error', { error: error.message });
    res.status(500).json(ResponseFormatter.error('Failed to cleanup old deleted users', 500));
  }
};

exports.getUserStatsById = async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    log.info('Get user stats by id', { userId });

    // Fetch dulu untuk tahu role target, lalu cek kebijakan view.
    const target = await userServices.getUserById(userId, true);
    if (!canViewUser(req.user, target)) {
      return res.status(403).json(ResponseFormatter.error('Access denied', 403));
    }

    const stats = await userServices.getUserStatsById(userId);
    res.status(200).json(ResponseFormatter.success(stats, 'User statistics retrieved successfully'));
  } catch (error) {
    log.error('getUserStatsById error', { error: error.message });
    res.status(500).json(ResponseFormatter.error('Failed to get user statistics', 500));
  }
};

exports.getUserStats = async (req, res) => {
  try {
    const stats = await userServices.getUserVerificationStats();
    log.info('Get user stats');
    res.status(200).json(ResponseFormatter.success(stats, 'User statistics retrieved successfully'));
  } catch (error) {
    log.error('getUserStats error', { error: error.message });
    res.status(500).json(ResponseFormatter.error('Failed to get user statistics', 500));
  }
};

exports.getUnverifiedStudents = async (req, res) => {
  try {
    log.info('Get unverified students');
    const result = await userServices.getUnverifiedStudent();
    res.status(200).json(ResponseFormatter.success(result, 'Unverified students retrieved successfully'));
  } catch (error) {
    log.error('getUnverifiedStudents error', { error: error.message });
    res.status(500).json(ResponseFormatter.error('Failed to get unverified students', 500));
  }
};

exports.getUnverifiedAdmins = async (req, res) => {
  try {
    log.info('Get unverified admins');
    const result = await userServices.getUnverifiedAdmin();
    res.status(200).json(ResponseFormatter.success(result, 'Unverified admins retrieved successfully'));
  } catch (error) {
    log.error('getUnverifiedAdmins error', { error: error.message });
    res.status(500).json(ResponseFormatter.error('Failed to get unverified admins', 500));
  }
};
