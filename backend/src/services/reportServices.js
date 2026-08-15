const prisma = require('../utils/prisma');
const SoftDeleteHelper = require('../utils/softDelete');
const RegistrationGenerator = require('../utils/registrationGenerator');
const { getLogger } = require('../utils/logger');
const log = getLogger('report:service');

/**
 * Fields that must NEVER be mutable post-creation. Used by service-level
 * mutation helpers to defend against accidental future regressions where a
 * generic update endpoint forgets to whitelist allowed fields.
 *
 * - isAnonymous: anonymity guarantee — flipping this would expose the reporter
 *   retroactively or deny their masking, both unacceptable.
 * - userId: the authoring user. Reassigning the author breaks audit trail.
 * - registrationNumber: human-facing identifier; if it changes, references in
 *   email / chat / external systems become inconsistent.
 */
const IMMUTABLE_FIELDS = Object.freeze(['isAnonymous', 'userId', 'registrationNumber']);

function assertImmutableFieldsNotMutated(updates) {
  if (!updates || typeof updates !== 'object') return;
  for (const field of IMMUTABLE_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(updates, field)) {
      throw new Error(
        `Field "${field}" is immutable and cannot be updated after report creation`
      );
    }
  }
}

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
          priority: true,
          isAnonymous: true,
          userId: true,
          categoryId: true,
          category: {
            select: {
              id: true,
              slug: true,
              name: true,
              allowAnonymous: true,
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
                  id: true,
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
          rejectedReason: true,
          canceledReason: true,
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
          priority: true,
          isAnonymous: true,
          userId: true,
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
              id: true,
              name: true,
              nim: true,
              email: true,
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
      // Gabungkan userId dan filter lain. Audit M10: userId sesi harus selalu
      // menang — letakkan setelah spread agar tidak bisa ditimpa caller.
      const where = {
        ...filters,
        userId
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
          ...filters,
          userId
        },
        select: {
          id: true,
          title: true,
          description: true,
          status: true,
          priority: true,
          isAnonymous: true,
          userId: true,
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
              id: true,
              name: true,
              nim: true,
              email: true,
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
      // Ambil category untuk mendapatkan slug, default priority, dan anonymous setting.
      // Audit M9: kategori yang sudah soft-delete tidak boleh dipakai.
      const category = await prisma.category.findFirst({
        where: { id: reportData.categoryId, deletedAt: null },
        select: { slug: true, defaultPriority: true, allowAnonymous: true }
      });
      
      if (!category) {
        throw new Error('Category not found');
      }

      // Validate anonymous flag
      if (reportData.isAnonymous && !category.allowAnonymous) {
        throw new Error('Anonymous reporting is not allowed for this category');
      }
      
      // Generate registration number.
      // Audit M1: dua create konkuren di kategori/hari yang sama bisa
      // menghitung nomor identik — bila unique constraint (P2002) menabrak,
      // hitung ulang dan coba lagi (max 3 percobaan).
      let report;
      for (let attempt = 0; attempt < 3; attempt++) {
        const registrationNumber = await RegistrationGenerator.generateRegistrationNumber(category.slug);
        try {
          report = await prisma.report.create({
            data: {
              title: reportData.title,
              description: reportData.description,
              userId: reportData.userId,
              categoryId: reportData.categoryId,
              registrationNumber,
              priority: category.defaultPriority || 'MEDIUM',
              isAnonymous: reportData.isAnonymous || false
            },
          });
          break;
        } catch (createError) {
          if (createError?.code === 'P2002' && attempt < 2) continue;
          throw createError;
        }
      }
      log.info('createReport success', { id: report.id, userId: report.userId, priority: report.priority, isAnonymous: report.isAnonymous });
      return report;
    } catch (error) {
      log.warn('createReport failed', { error: error.message });
      throw new Error('Error creating report: ' + error.message);
    }
  }

  async updateReportStatus(id, status, expectedStatus = undefined, reason = null) {
    try {
      // Defense-in-depth: status is the only mutable input here. We rebuild the
      // update payload explicitly rather than spreading caller-provided data,
      // and run the immutable-field guard for symmetry with future updaters.
      const updates = { status };
      assertImmutableFieldsNotMutated(updates);

      // Audit B1: update kondisional — cegah race TOCTOU antara validasi
      // transisi dan penulisan. Jika status sudah diubah proses lain,
      // update mempengaruhi 0 baris dan kita menolak dengan 409.
      const CLOSED_STATUSES = ['RESOLVED', 'REJECTED', 'CANCELED'];
      const trimmedReason = reason && String(reason).trim() ? String(reason).trim() : null;
      const data = {
        ...updates,
        ...(CLOSED_STATUSES.includes(status) ? { closedAt: new Date() } : {}),
        // Audit: alasan penutupan kini persist di laporan (bukan hanya audit log).
        ...(status === 'REJECTED' ? { rejectedReason: trimmedReason } : {}),
        ...(status === 'CANCELED' ? { canceledReason: trimmedReason } : {}),
      };

      const where = { id, deletedAt: null };
      if (expectedStatus) where.status = expectedStatus;

      const updated = await prisma.report.updateMany({ where, data });
      if (updated.count !== 1) {
        const err = new Error(
          'Status laporan baru saja berubah oleh proses lain. Muat ulang dan coba lagi.'
        );
        err.statusCode = 409;
        throw err;
      }

      const report = await prisma.report.findUnique({
        where: { id },
        select: {
          id: true,
          status: true,
          updatedAt: true,
          closedAt: true,
          rejectedReason: true,
          canceledReason: true,
          userId: true,
          title: true,
          registrationNumber: true,
        }
      });
      log.info('updateReportStatus success', { id, status });
      return report;
    } catch (error) {
      log.warn('updateReportStatus failed', { id, error: error.message });
      if (error.statusCode === 409) throw error;
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
      const { deletePendingUploadsByReport } = require('./chatPendingUploadService');
      const { deleteFileFromDisk } = require('../utils/fileDisk');

      const attachments = await prisma.attachment.findMany({
        where: { reportId: parseInt(id) },
        select: { filePath: true },
      });

      await deletePendingUploadsByReport(parseInt(id));
      const report = await SoftDeleteHelper.hardDelete(prisma.report, id);

      await Promise.allSettled(attachments.map((a) => deleteFileFromDisk(a.filePath)));

      log.info('permanentDeleteReport success', { id });
      return report;
    } catch (error) {
      log.warn('permanentDeleteReport failed', { id, error: error.message });
      throw new Error('Error permanently deleting report: ' + error.message);
    }
  }

  /**
   * @param {?Array<number>} categoryIds - Audit B5: null = semua kategori
   * (SUPERADMIN), array = hanya kategori tersebut (ADMIN scoped). Array
   * kosong menghasilkan statistik nol — bukan fallback ke global.
   */
  async getReportStats(categoryIds = null) {
    try{
      log.info('getReportStats start');
      const grouped = await prisma.report.groupBy({
        by: ['status'],
        where: {
          deletedAt: null,
          ...(Array.isArray(categoryIds) ? { categoryId: { in: categoryIds } } : {}),
        },
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

const reportServices = new ReportServices();
reportServices.IMMUTABLE_FIELDS = IMMUTABLE_FIELDS;
reportServices.assertImmutableFieldsNotMutated = assertImmutableFieldsNotMutated;

module.exports = reportServices;
