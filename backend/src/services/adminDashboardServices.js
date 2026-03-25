const prisma = require('../utils/prisma');
const SoftDeleteHelper = require('../utils/softDelete');
const { getLogger } = require('../utils/logger');

const log = getLogger('admin-dashboard:service');

class AdminDashboardServices {
  /**
   * Get comprehensive dashboard statistics for admin
   */
  async getDashboardStats() {
    try {
      // Get all stats in parallel for better performance
      const [
        usersStats,
        reportsStats,
        categoriesStats,
        recentReports,
        recentUsers,
        recentAuditLogs,
        reportsTrend
      ] = await Promise.all([
        this.getUsersStats(),
        this.getReportsStats(),
        this.getCategoriesStats(),
        this.getRecentReports(5),
        this.getRecentUsers(5),
        this.getRecentAuditLogs(10),
        this.getReportsTrend(7) // Last 7 days
      ]);

      const stats = {
        users: usersStats,
        reports: reportsStats,
        categories: categoriesStats,
        recent: {
          reports: recentReports,
          users: recentUsers,
          auditLogs: recentAuditLogs
        },
        trends: {
          reports: reportsTrend
        },
        timestamp: new Date().toISOString()
      };

      log.info('getDashboardStats success');
      return stats;
    } catch (error) {
      log.error('getDashboardStats failed', { error: error.message });
      throw new Error(`Failed to get dashboard stats: ${error.message}`);
    }
  }

  /**
   * Get users statistics
   */
  async getUsersStats() {
    try {
      const [total, deleted, verified, mahasiswa, admin] = await Promise.all([
        SoftDeleteHelper.count(prisma.user),
        SoftDeleteHelper.count(prisma.user, {}, true),
        SoftDeleteHelper.count(prisma.user, { where: { isVerified: true } }),
        SoftDeleteHelper.count(prisma.user, { where: { role: 'MAHASISWA' } }),
        SoftDeleteHelper.count(prisma.user, { where: { role: 'ADMIN' } })
      ]);

      return {
        total,
        deleted: deleted - total,
        active: total,
        verified,
        unverified: total - verified,
        byRole: {
          mahasiswa,
          admin
        }
      };
    } catch (error) {
      log.error('getUsersStats failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Get reports statistics
   */
  async getReportsStats() {
    try {
      const [total, deleted, byStatus] = await Promise.all([
        SoftDeleteHelper.count(prisma.report),
        SoftDeleteHelper.count(prisma.report, {}, true),
        prisma.report.groupBy({
          by: ['status'],
          where: { deletedAt: null },
          _count: true
        })
      ]);

      const statusCounts = byStatus.reduce((acc, item) => {
        acc[item.status.toLowerCase()] = item._count;
        return acc;
      }, {});

      return {
        total,
        deleted: deleted - total,
        active: total,
        pending: statusCounts.pending || 0,
        inReview: statusCounts.in_review || 0,
        inProgress: statusCounts.in_progress || 0,
        resolved: statusCounts.resolved || 0,
        rejected: statusCounts.rejected || 0,
        canceled: statusCounts.canceled || 0
      };
    } catch (error) {
      log.error('getReportsStats failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Get categories statistics
   */
  async getCategoriesStats() {
    try {
      const [total, deleted, withReportCounts] = await Promise.all([
        SoftDeleteHelper.count(prisma.category),
        SoftDeleteHelper.count(prisma.category, {}, true),
        prisma.category.findMany({
          where: { deletedAt: null },
          select: {
            id: true,
            name: true,
            _count: {
              select: {
                reports: {
                  where: { deletedAt: null }
                }
              }
            }
          },
          orderBy: {
            reports: {
              _count: 'desc'
            }
          },
          take: 5
        })
      ]);

      const topCategories = withReportCounts.map(cat => ({
        id: cat.id,
        name: cat.name,
        reportCount: cat._count.reports
      }));

      return {
        total,
        deleted: deleted - total,
        active: total,
        topCategories
      };
    } catch (error) {
      log.error('getCategoriesStats failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Get recent reports
   */
  async getRecentReports(limit = 5) {
    try {
      const reports = await SoftDeleteHelper.findMany(
        prisma.report,
        {
          select: {
            id: true,
            registrationNumber: true,
            title: true,
            status: true,
            createdAt: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            },
            category: {
              select: {
                id: true,
                name: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: limit
        }
      );

      return reports;
    } catch (error) {
      log.error('getRecentReports failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Get recent users
   */
  async getRecentUsers(limit = 5) {
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
            createdAt: true
          },
          orderBy: { createdAt: 'desc' },
          take: limit
        }
      );

      return users;
    } catch (error) {
      log.error('getRecentUsers failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Get recent audit logs
   */
  async getRecentAuditLogs(limit = 10) {
    try {
      const logs = await prisma.auditLog.findMany({
        take: limit,
        orderBy: { createdAt: 'desc' }
      });

      return logs;
    } catch (error) {
      log.error('getRecentAuditLogs failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Get reports trend (count per day for the last N days)
   */
  async getReportsTrend(days = 7) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      startDate.setHours(0, 0, 0, 0);

      // Get reports created in the last N days
      const reports = await prisma.report.findMany({
        where: {
          createdAt: {
            gte: startDate
          }
        },
        select: {
          createdAt: true
        }
      });

      // Group by date
      const trendMap = {};
      for (let i = 0; i < days; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        const dateKey = date.toISOString().split('T')[0];
        trendMap[dateKey] = 0;
      }

      reports.forEach(report => {
        const dateKey = new Date(report.createdAt).toISOString().split('T')[0];
        if (trendMap[dateKey] !== undefined) {
          trendMap[dateKey]++;
        }
      });

      // Convert to array format
      const trend = Object.entries(trendMap).map(([date, count]) => ({
        date,
        count
      }));

      return trend;
    } catch (error) {
      log.error('getReportsTrend failed', { error: error.message });
      throw error;
    }
  }
}

module.exports = new AdminDashboardServices();


