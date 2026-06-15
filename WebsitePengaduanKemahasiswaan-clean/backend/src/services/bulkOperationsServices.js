const prisma = require('../utils/prisma');
const SoftDeleteHelper = require('../utils/softDelete');
const { getLogger } = require('../utils/logger');

const log = getLogger('bulk-ops:service');

class BulkOperationsServices {
  /**
   * Bulk verify users (mahasiswa)
   * @param {Array<number>} userIds - Array of user IDs to verify
   */
  async bulkVerifyUsers(userIds) {
    try {
      if (!Array.isArray(userIds) || userIds.length === 0) {
        throw new Error('userIds must be a non-empty array');
      }

      const result = await prisma.user.updateMany({
        where: {
          id: { in: userIds },
          deletedAt: null
        },
        data: {
          isVerified: true,
          updatedAt: new Date()
        }
      });

      log.info('bulkVerifyUsers success', { count: result.count, userIds });
      return {
        verified: result.count,
        userIds
      };
    } catch (error) {
      log.error('bulkVerifyUsers failed', { error: error.message });
      throw new Error(`Failed to bulk verify users: ${error.message}`);
    }
  }

  /**
   * Bulk soft delete users
   * @param {Array<number>} userIds - Array of user IDs to delete
   */
  async bulkDeleteUsers(userIds) {
    try {
      if (!Array.isArray(userIds) || userIds.length === 0) {
        throw new Error('userIds must be a non-empty array');
      }

      const result = await prisma.user.updateMany({
        where: {
          id: { in: userIds },
          deletedAt: null
        },
        data: {
          deletedAt: new Date(),
          updatedAt: new Date()
        }
      });

      log.info('bulkDeleteUsers success', { count: result.count, userIds });
      return {
        deleted: result.count,
        userIds
      };
    } catch (error) {
      log.error('bulkDeleteUsers failed', { error: error.message });
      throw new Error(`Failed to bulk delete users: ${error.message}`);
    }
  }

  /**
   * Bulk restore users
   * @param {Array<number>} userIds - Array of user IDs to restore
   */
  async bulkRestoreUsers(userIds) {
    try {
      if (!Array.isArray(userIds) || userIds.length === 0) {
        throw new Error('userIds must be a non-empty array');
      }

      const result = await prisma.user.updateMany({
        where: {
          id: { in: userIds },
          deletedAt: { not: null }
        },
        data: {
          deletedAt: null,
          updatedAt: new Date()
        }
      });

      log.info('bulkRestoreUsers success', { count: result.count, userIds });
      return {
        restored: result.count,
        userIds
      };
    } catch (error) {
      log.error('bulkRestoreUsers failed', { error: error.message });
      throw new Error(`Failed to bulk restore users: ${error.message}`);
    }
  }

  /**
   * Bulk update report status
   * @param {Array<number>} reportIds - Array of report IDs to update
   * @param {string} status - New status for the reports
   */
  async bulkUpdateReportStatus(reportIds, status) {
    try {
      if (!Array.isArray(reportIds) || reportIds.length === 0) {
        throw new Error('reportIds must be a non-empty array');
      }

      const allowedStatuses = ['PENDING', 'IN_REVIEW', 'IN_PROGRESS', 'RESOLVED', 'REJECTED', 'CANCELED'];
      if (!allowedStatuses.includes(status)) {
        throw new Error(`Invalid status. Must be one of: ${allowedStatuses.join(', ')}`);
      }

      const updateData = {
        status,
        updatedAt: new Date()
      };

      // If status is RESOLVED, set closedAt
      if (status === 'RESOLVED') {
        updateData.closedAt = new Date();
      }

      const result = await prisma.report.updateMany({
        where: {
          id: { in: reportIds },
          deletedAt: null
        },
        data: updateData
      });

      log.info('bulkUpdateReportStatus success', { count: result.count, reportIds, status });
      return {
        updated: result.count,
        reportIds,
        newStatus: status
      };
    } catch (error) {
      log.error('bulkUpdateReportStatus failed', { error: error.message });
      throw new Error(`Failed to bulk update report status: ${error.message}`);
    }
  }

  /**
   * Bulk soft delete reports
   * @param {Array<number>} reportIds - Array of report IDs to delete
   */
  async bulkDeleteReports(reportIds) {
    try {
      if (!Array.isArray(reportIds) || reportIds.length === 0) {
        throw new Error('reportIds must be a non-empty array');
      }

      const result = await prisma.report.updateMany({
        where: {
          id: { in: reportIds },
          deletedAt: null
        },
        data: {
          deletedAt: new Date(),
          updatedAt: new Date()
        }
      });

      log.info('bulkDeleteReports success', { count: result.count, reportIds });
      return {
        deleted: result.count,
        reportIds
      };
    } catch (error) {
      log.error('bulkDeleteReports failed', { error: error.message });
      throw new Error(`Failed to bulk delete reports: ${error.message}`);
    }
  }

  /**
   * Bulk restore reports
   * @param {Array<number>} reportIds - Array of report IDs to restore
   */
  async bulkRestoreReports(reportIds) {
    try {
      if (!Array.isArray(reportIds) || reportIds.length === 0) {
        throw new Error('reportIds must be a non-empty array');
      }

      const result = await prisma.report.updateMany({
        where: {
          id: { in: reportIds },
          deletedAt: { not: null }
        },
        data: {
          deletedAt: null,
          updatedAt: new Date()
        }
      });

      log.info('bulkRestoreReports success', { count: result.count, reportIds });
      return {
        restored: result.count,
        reportIds
      };
    } catch (error) {
      log.error('bulkRestoreReports failed', { error: error.message });
      throw new Error(`Failed to bulk restore reports: ${error.message}`);
    }
  }

  /**
   * Bulk delete categories
   * @param {Array<number>} categoryIds - Array of category IDs to delete
   */
  async bulkDeleteCategories(categoryIds) {
    try {
      if (!Array.isArray(categoryIds) || categoryIds.length === 0) {
        throw new Error('categoryIds must be a non-empty array');
      }

      const result = await prisma.category.updateMany({
        where: {
          id: { in: categoryIds },
          deletedAt: null
        },
        data: {
          deletedAt: new Date(),
          updatedAt: new Date()
        }
      });

      log.info('bulkDeleteCategories success', { count: result.count, categoryIds });
      return {
        deleted: result.count,
        categoryIds
      };
    } catch (error) {
      log.error('bulkDeleteCategories failed', { error: error.message });
      throw new Error(`Failed to bulk delete categories: ${error.message}`);
    }
  }

  /**
   * Bulk restore categories
   * @param {Array<number>} categoryIds - Array of category IDs to restore
   */
  async bulkRestoreCategories(categoryIds) {
    try {
      if (!Array.isArray(categoryIds) || categoryIds.length === 0) {
        throw new Error('categoryIds must be a non-empty array');
      }

      const result = await prisma.category.updateMany({
        where: {
          id: { in: categoryIds },
          deletedAt: { not: null }
        },
        data: {
          deletedAt: null,
          updatedAt: new Date()
        }
      });

      log.info('bulkRestoreCategories success', { count: result.count, categoryIds });
      return {
        restored: result.count,
        categoryIds
      };
    } catch (error) {
      log.error('bulkRestoreCategories failed', { error: error.message });
      throw new Error(`Failed to bulk restore categories: ${error.message}`);
    }
  }
}

module.exports = new BulkOperationsServices();


