const prisma = require('../utils/prisma');
const SoftDeleteHelper = require('../utils/softDelete');

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
      return user;
    } catch (error) {
      throw new Error('Error getting user by ID');
    }
  }

  async getAllUsers(includeDeleted = false) {
    try {
      return await SoftDeleteHelper.findMany(
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
            updatedAt: true,
            deletedAt: true
          },
          orderBy: { createdAt: 'desc' }
        },
        includeDeleted
      );
    } catch (error) {
      throw new Error('Error getting all users');
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

      return updatedUser;
    } catch (error) {
      throw new Error('Error updating user');
    }
  }

  async deleteUser(userId) {
    try {
      // Soft delete user
      return await SoftDeleteHelper.softDelete(prisma.user, userId);
    } catch (error) {
      throw new Error('Error deleting user');
    }
  }

  async restoreUser(userId) {
    try {
      // Restore soft deleted user
      return await SoftDeleteHelper.restore(prisma.user, userId);
    } catch (error) {
      throw new Error('Error restoring user');
    }
  }

  async permanentDeleteUser(userId) {
    try {
      // Hard delete user (be careful!)
      return await SoftDeleteHelper.hardDelete(prisma.user, userId);
    } catch (error) {
      throw new Error('Error permanently deleting user');
    }
  }

  async findUserByEmail(email, includeDeleted = false) {
    try {
      return await SoftDeleteHelper.findUnique(
        prisma.user,
        { where: { email } },
        includeDeleted
      );
    } catch (error) {
      throw new Error('Error finding user by email');
    }
  }

  async findUserByNim(nim, includeDeleted = false) {
    try {
      return await SoftDeleteHelper.findUnique(
        prisma.user,
        { where: { nim } },
        includeDeleted
      );
    } catch (error) {
      throw new Error('Error finding user by NIM');
    }
  }

  async verifyStudent(userId) {
    try {
      return await prisma.user.update({
        where: { id: userId },
        data: { isVerified: true }
      });
    } catch (error) {
      throw new Error('Error verifying student');
    }
  }

  async getUserStats() {
    try {
      const total = await SoftDeleteHelper.count(prisma.user);
      const deleted = await SoftDeleteHelper.count(prisma.user, {}, true) - total;
      const verified = await SoftDeleteHelper.count(prisma.user, {
        where: { isVerified: true }
      });
      return {
        total,
        deleted,
        verified,
        unverified: total - verified
      };
    } catch (error) {
      throw new Error('Error getting user stats');
    }
  }

  async cleanupOldDeletedUsers(daysOld = 90) {
    try {
      // Cleanup users deleted more than 90 days ago
      return await SoftDeleteHelper.cleanupOldDeleted(prisma.user, daysOld);
    } catch (error) {
      throw new Error('Error cleaning up old deleted users');
    }
  }
}

module.exports = new UserServices();