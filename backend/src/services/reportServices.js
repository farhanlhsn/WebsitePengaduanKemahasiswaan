const prisma = require('../utils/prisma');
const SoftDeleteHelper = require('../utils/softDelete');
const RegistrationGenerator = require('../utils/registrationGenerator');
const { getLogger } = require('../utils/logger');
const log = getLogger('report:service');

class ReportServices {
  async getReportById(id, includeDeleted = false) {
    try {
      const report = await SoftDeleteHelper.findUnique(prisma.report, {
        where: { id },
        select: {
          id: true,
          registrationNumber: true,
          title: true,
          description: true,
          status: true,
          userId: true,
          categoryId: true,
          category: {
            select: {
              id: true,
              slug: true,
              name: true,
            }
          },
          user: {
            select: {
              id: true,
              name: true,
              nim: true,
              email: true,
            }
          },
          attachments: {
            select: {
              id: true,
              filePath: true,
              fileName: true,
              fileType: true,
              createdAt: true,
              messageId: true
            }
          },
          messages: {
            select: {
              id: true,
              content: true,
              senderId: true,
              isRead: true,
              createdAt: true,
              sender: {
                select: {
                  name: true,
                  role: true,
                }
              }
            },
            orderBy: {
              createdAt: 'asc'
            }
          },
          createdAt: true,
          updatedAt: true,
          closedAt: true,
          deletedAt: true,
        }
      }, includeDeleted);
      if (!report) {
        throw new Error('Report not found');
      }
      // Keep only report-level attachments (exclude chat attachments)
      report.attachments = report.attachments.filter(att => att.messageId === null);
      log.info('getReportById success', { id });
      return report;
    } catch (error) {
      log.warn('getReportById failed', { id, error: error.message });
      throw new Error('Error getting report by ID');
    }
  }

  //for admin
  async getAllReportsPaginated(limit = 10, filters = {}, includeDeleted = false, lastItemId = null) {
    try {
      // Hitung total data (termasuk filter)
      const totalItems = await SoftDeleteHelper.count(
        prisma.report,
        {
          where: filters
        },
        includeDeleted
      );

      // Siapkan query dasar
      const query = {
        where: filters,
        select: {
          id: true,
          title: true,
          description: true,
          status: true,
          registrationNumber: true,
          category: {
            select: {
              slug: true,
              name: true,
            }
          },
          closedAt: true,
          createdAt: true,
          updatedAt: true,
          deletedAt: true,
          user: {
            select: {
              name: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limit + 1 // Ambil satu lebih banyak untuk cek hasNextPage
      };
      if (lastItemId) {
        query.cursor = { id: lastItemId };
        query.skip = 1; // Lewati item cursor itu sendiri
      }

      const reports = await SoftDeleteHelper.findMany(
        prisma.report,
        query,
        includeDeleted
      );

      // Cek apakah masih ada halaman berikutnya
      let hasNextPage = false;
      let pageItems = reports;
      if (reports.length > limit) {
        hasNextPage = true;
        pageItems = reports.slice(0, limit);
      }

      const payload = {
        data: pageItems,
        pagination: {
          totalItems,
          itemsPerPage: limit,
          hasNextPage,
          lastItemId: pageItems.length > 0 ? pageItems[pageItems.length - 1].id : null
        }
      };
      log.info('getAllReportsPaginated success', { totalItems, take: limit, hasNextPage });
      return payload;
    } catch (error) {
      log.warn('getAllReportsPaginated failed', { error: error.message });
      throw new Error('Error getting reports: ' + error.message);
    }
  }

  //for mahasiswa
  async getAllReportsByUserIdPaginated(userId, filters = {}, limit = 10, includeDeleted = false, lastItemId = null) {
    try {
      // Gabungkan userId dan filter lain
      const where = {
        userId,
        ...filters
      };

      // Hitung total data user (dengan filter)
      const totalItems = await SoftDeleteHelper.count(
        prisma.report,
        { where },
        includeDeleted
      );

      // Siapkan query dasar
      const query = {
        where: {
          userId,
          ...filters
        },
        select: {
          id: true,
          title: true,
          description: true,
          status: true,
          registrationNumber: true,
          category: {
            select: {
              slug: true,
              name: true,
            }
          },
          closedAt: true,
          createdAt: true,
          updatedAt: true,
          deletedAt: true,
          user: {
            select: {
              name: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limit + 1
      };
      if (lastItemId) {
        query.cursor = { id: lastItemId };
        query.skip = 1;
      }

      const reports = await SoftDeleteHelper.findMany(prisma.report, query, includeDeleted);

      let hasNextPage = false;
      let pageItems = reports;
      if (reports.length > limit) {
        hasNextPage = true;
        pageItems = reports.slice(0, limit);
      }

      const payload = {
        data: pageItems,
        pagination: {
          totalItems,
          itemsPerPage: limit,
          hasNextPage,
          lastItemId: pageItems.length > 0 ? pageItems[pageItems.length - 1].id : null
        }
      };
      log.info('getAllReportsByUserIdPaginated success', { userId, totalItems, take: limit, hasNextPage });
      return payload;
    } catch (error) {
      log.warn('getAllReportsByUserIdPaginated failed', { userId, error: error.message });
      throw new Error('Error getting reports by user ID: ' + error.message);
    }
  }

  async createReport(reportData) {
    try {
      // Ambil category untuk mendapatkan slug
      const category = await prisma.category.findUnique({
        where: { id: reportData.categoryId },
        select: { slug: true }
      });
      
      if (!category) {
        throw new Error('Category not found');
      }
      
      // Generate registration number
      const registrationNumber = await RegistrationGenerator.generateRegistrationNumber(category.slug);
      
      const report = await prisma.report.create({
        data: {
          ...reportData,
          registrationNumber
        },
      });
      log.info('createReport success', { id: report.id, userId: report.userId });
      return report;
    } catch (error) {
      log.warn('createReport failed', { error: error.message });
      throw new Error('Error creating report: ' + error.message);
    }
  }

  async updateReportStatus(id, status) {
    try {
      const report = await prisma.report.update({
        where: { id },
        data: { status },
        select: {
          id: true,
          status: true,
          updatedAt: true,
        }
      });
      log.info('updateReportStatus success', { id, status });
      return report;
    } catch (error) {
      log.warn('updateReportStatus failed', { id, error: error.message });
      throw new Error('Error updating report status: ' + error.message);
    }
  }

  async restoreReport(id) {
    try {
      const report = await SoftDeleteHelper.restore(prisma.report, id);
      log.info('restoreReport success', { id });
      return report;
    } catch (error) {
      log.warn('restoreReport failed', { id, error: error.message });
      throw new Error('Error restoring report: ' + error.message);
    }
  }

  async deleteReport(id) {
    try {
      const report = await SoftDeleteHelper.softDelete(prisma.report, id);
      log.info('deleteReport success', { id });
      return report;
    } catch (error) {
      log.warn('deleteReport failed', { id, error: error.message });
      throw new Error('Error deleting report: ' + error.message);
    }
  }

  async permanentDeleteReport(id) {
    try {
      const report = await SoftDeleteHelper.hardDelete(prisma.report, id);
      log.info('permanentDeleteReport success', { id });
      return report;
    } catch (error) {
      log.warn('permanentDeleteReport failed', { id, error: error.message });
      throw new Error('Error permanently deleting report: ' + error.message);
    }
  }

  async getReportStats() {
    try{
      log.info('getReportStats start');
      const data = await SoftDeleteHelper.findMany(prisma.report, {
        select: {
          status: true,
        }
      }, false)
      log.info('getReportStats data retrieved', { count: data.length });
      
      const total = data.length;
      const pending = data.filter(report => report.status === 'PENDING').length;
      const inReview = data.filter(report => report.status === 'IN_REVIEW').length;
      const inProgress = data.filter(report => report.status === 'IN_PROGRESS').length;
      const resolved = data.filter(report => report.status === 'RESOLVED').length;
      const rejected = data.filter(report => report.status === 'REJECTED').length;
      const canceled = data.filter(report => report.status === 'CANCELED').length;
      
      const stats = {
        total,
        pending,
        inReview,
        inProgress,
        resolved,
        rejected,
        canceled
      };
      
      log.info('getReportStats calculated');
      return stats;
    } catch (error) {
      log.error('getReportStats failed', { error: error.message });
      throw new Error('Error getting report stats: ' + error.message);
    }
  }

}

module.exports = new ReportServices();