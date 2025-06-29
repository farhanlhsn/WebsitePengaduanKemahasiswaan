const prisma = require('../utils/prisma');
const SoftDeleteHelper = require('../utils/softDelete');
const RegistrationGenerator = require('../utils/registrationGenerator');

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
      return report;
    } catch (error) {
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
      let result = reports;
      if (reports.length > limit) {
        hasNextPage = true;
        result = reports.slice(0, limit);
      }

      return {
        data: result,
        pagination: {
          totalItems,
          itemsPerPage: limit,
          hasNextPage,
          lastItemId: result.length > 0 ? result[result.length - 1].id : null
        }
      };
    } catch (error) {
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
      let result = reports;
      if (reports.length > limit) {
        hasNextPage = true;
        result = reports.slice(0, limit);
      }

      return {
        data: result,
        pagination: {
          totalItems,
          itemsPerPage: limit,
          hasNextPage,
          lastItemId: result.length > 0 ? result[result.length - 1].id : null
        }
      };
    } catch (error) {
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
        }
      });
      return report;
    } catch (error) {
      throw new Error('Error creating report: ' + error.message);
    }
  }

  async updateReportStatus(id, status) {
    try {
      const report = await SoftDeleteHelper.update(prisma.report, id, { status });
      return report;
    } catch (error) {
      throw new Error('Error updating report status: ' + error.message);
    }
  }

  async restoreReport(id) {
    try {
      const report = await SoftDeleteHelper.restore(prisma.report, id);
      return report;
    } catch (error) {
      throw new Error('Error restoring report: ' + error.message);
    }
  }

  async deleteReport(id) {
    try {
      const report = await SoftDeleteHelper.softDelete(prisma.report, id);
      return report;
    } catch (error) {
      throw new Error('Error deleting report: ' + error.message);
    }
  }

  async getReportStats() {
    try{
      const data = await SoftDeleteHelper.findMany(prisma.report, {
        select: {
          status: true,
        }
      }, false)
      const total = data.length;
      const pending = data.filter(report => report.status === 'pending').length;
      const approved = data.filter(report => report.status === 'approved').length;
      const rejected = data.filter(report => report.status === 'rejected').length;
      return {
        total,
        pending,
        approved,
        rejected
      }
    } catch (error) {
      throw new Error('Error getting report stats');
    }
  }

}

module.exports = new ReportServices();