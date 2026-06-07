const prisma = require('../utils/prisma');
const SoftDeleteHelper = require('../utils/softDelete');
const { getLogger } = require('../utils/logger');
const log = getLogger('user:service');

class UserServices {
  async getUserById(userId, includeDeleted = false) {
    try {
      const user = await SoftDeleteHelper.findUnique(
        prisma.user,
        {
          where: { id: userId },
          select: {
            id: true,
            name: true,
            email: true,
            nim: true,
            role: true,
            isVerified: true,
            createdAt: true,
            updatedAt: true,
            deletedAt: true
          }
        },
        includeDeleted
      );

      if (!user) {
        throw new Error('User not found');
      }
      log.info('getUserById success', { userId });
      return user;
    } catch (error) {
      log.warn('getUserById failed', { userId, error: error.message });
      throw new Error('Error getting user by ID');
    }
  }

  async getAllUsers(includeDeleted = false) {
    try {
      const users = await SoftDeleteHelper.findMany(
        prisma.user,
        {
          select: {
            id: true,
            name: true,
            email: true,
            nim: true,
            role: true,
            isVerified: true,
            createdAt: true,
            ktmPath: true,
            deletedAt: true // Included for status tracking
          },
          // Removing default orderBy to allow client-side or controller-level sorting if needed,
          // but mostly because it might interfere with specific requirements.
          // However, keeping a default order is usually good. 
          // Let's keep it but ensure it doesn't break anything.
          orderBy: { createdAt: 'desc' } 
        },
        includeDeleted
      );
      log.info('getAllUsers success', { count: users.length });
      return users;
    } catch (error) {
      log.error('getAllUsers failed', { error: error.message });
      throw new Error(`Error getting all users: ${error.message}`);
    }
  }

  async updateUser(userId, data) {
    try {
      // Check if user exists and not deleted
      await this.getUserById(userId);
      
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          ...data,
          updatedAt: new Date()
        }
      });

      log.info('updateUser success', { userId });
      return updatedUser;
    } catch (error) {
      log.warn('updateUser failed', { userId, error: error.message });
      throw new Error('Error updating user');
    }
  }

  async deleteUser(userId) {
    try {
      // Soft delete user
      const result = await SoftDeleteHelper.softDelete(prisma.user, userId);
      log.info('deleteUser success', { userId });
      return result;
    } catch (error) {
      log.warn('deleteUser failed', { userId, error: error.message });
      throw new Error('Error deleting user');
    }
  }

  async restoreUser(userId) {
    try {
      // Restore soft deleted user
      const result = await SoftDeleteHelper.restore(prisma.user, userId);
      log.info('restoreUser success', { userId });
      return result;
    } catch (error) {
      log.warn('restoreUser failed', { userId, error: error.message });
      throw new Error('Error restoring user');
    }
  }

  async permanentDeleteUser(userId) {
    try {
      const { deletePendingUploadsByUploader } = require('./chatPendingUploadService');
      const { deleteFileFromDisk } = require('../utils/fileDisk');

      const user = await prisma.user.findUnique({
        where: { id: parseInt(userId) },
        select: { ktmPath: true },
      });

      await deletePendingUploadsByUploader(parseInt(userId));
      const result = await SoftDeleteHelper.hardDelete(prisma.user, userId);

      if (user?.ktmPath) {
        await deleteFileFromDisk(user.ktmPath);
      }

      log.info('permanentDeleteUser success', { userId });
      return result;
    } catch (error) {
      log.warn('permanentDeleteUser failed', { userId, error: error.message });
      throw new Error('Error permanently deleting user');
    }
  }

  async findUserByEmail(email, includeDeleted = false) {
    try {
      const result = await SoftDeleteHelper.findUnique(
        prisma.user,
        { where: { email } },
        includeDeleted
      );
      log.info('findUserByEmail success', { email, found: !!result });
      return result;
    } catch (error) {
      log.warn('findUserByEmail failed', { email, error: error.message });
      throw new Error('Error finding user by email');
    }
  }

  async findUserByNim(nim, includeDeleted = false) {
    try {
      const result = await SoftDeleteHelper.findUnique(
        prisma.user,
        { where: { nim } },
        includeDeleted
      );
      log.info('findUserByNim success', { nim, found: !!result });
      return result;
    } catch (error) {
      log.warn('findUserByNim failed', { nim, error: error.message });
      throw new Error('Error finding user by NIM');
    }
  }

  async verifyUser(userId) {
    try {
      const result = await prisma.user.update({
        where: { id: userId },
        data: { isVerified: true }
      });
      log.info('verifyUser success', { userId });
      return result;
    } catch (error) {
      log.warn('verifyUser failed', { userId, error: error.message });
      throw new Error('Error verifying user');
    }
  }

  async getUserVerificationStats() {
    try {
      const total = await SoftDeleteHelper.count(prisma.user);
      const deleted = await SoftDeleteHelper.count(prisma.user, {}, true) - total;
      const verified = await SoftDeleteHelper.count(prisma.user, {
        where: { isVerified: true }
      });
      const result = {
        total,
        deleted,
        verified,
        unverified: total - verified
      };
      log.info('getUserVerificationStats success', { total, verified });
      return result;
    } catch (error) {
      log.warn('getUserVerificationStats failed', { error: error.message });
      throw new Error('Error getting user stats');
    }
  }

  async cleanupOldDeletedUsers(daysOld = 90) {
    try {
      // Cleanup users deleted more than 90 days ago
      const result = await SoftDeleteHelper.cleanupOldDeleted(prisma.user, daysOld);
      log.info('cleanupOldDeletedUsers success', { daysOld });
      return result;
    } catch (error) {
      log.warn('cleanupOldDeletedUsers failed', { error: error.message });
      throw new Error('Error cleaning up old deleted users');
    }
  }

  async getUserStatsById(userId) {
    try{
      const grouped = await prisma.report.groupBy({
        by: ['status'],
        where: { userId, deletedAt: null },
        _count: { _all: true },
      });
      const counts = grouped.reduce((acc, item) => {
        acc[item.status] = item._count._all;
        return acc;
      }, {});
      const pending = counts.PENDING || 0;
      const inReview = counts.IN_REVIEW || 0;
      const inProgress = counts.IN_PROGRESS || 0;
      const resolved = counts.RESOLVED || 0;
      const rejected = counts.REJECTED || 0;
      const canceled = counts.CANCELED || 0;
      const total = pending + inReview + inProgress + resolved + rejected + canceled;
      
      const result = {
        total,
        pending, 
        inReview,
        inProgress,
        resolved,
        rejected,
        canceled,
        // For backward compatibility with frontend
        approved: resolved,
        // Total active reports (not canceled)
        active: total - canceled
      };
      log.info('getUserStatsById success', { userId });
      return result;
    } catch (error) {
      log.warn('getUserStatsById failed', { userId, error: error.message });
      throw new Error('Error getting reports stats');
    }
  }

  async getUnverifiedStudent() {
    try {
      const unverifiedStudents = await SoftDeleteHelper.findMany(prisma.user, {
        where: { role: 'MAHASISWA', isVerified: false }
      });
      const count = unverifiedStudents.length;
      const result = {
        unverifiedStudents,
        count
      };
      log.info('getUnverifiedStudent success', { count });
      return result;
    }
    catch (error) {
      log.warn('getUnverifiedStudent failed', { error: error.message });
      throw new Error('Error getting unverified students');
    }
  }

  async getUnverifiedAdmin() {
    try {
      const unverifiedAdmins = await SoftDeleteHelper.findMany(prisma.user, {
        where: { role: 'ADMIN', isVerified: false }
      });
      const count = unverifiedAdmins.length;
      const result = {
        unverifiedAdmins,
        count
      };
      log.info('getUnverifiedAdmin success', { count });
      return result;
    }
    catch (error) {
      log.warn('getUnverifiedAdmin failed', { error: error.message });
      throw new Error('Error getting unverified admins');
    }
  }
}

module.exports = new UserServices();
