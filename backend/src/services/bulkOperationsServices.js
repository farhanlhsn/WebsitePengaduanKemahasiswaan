const prisma = require('../utils/prisma');
const adminGovernanceServices = require('./adminGovernanceServices');
const { canTransition } = require('../utils/reportTransitions');
const {
  assertCanManageUser,
  getTargetUserOrThrow,
} = require('../utils/userGovernancePolicy');
const { ROLES } = require('../utils/rbac');
const { getLogger } = require('../utils/logger');

const log = getLogger('bulk-ops:service');

const MAX_BATCH_SIZE = 100;

function assertBatch(ids, name) {
  if (!Array.isArray(ids) || ids.length === 0) {
    throw new Error(`${name} must be a non-empty array`);
  }
  if (ids.length > MAX_BATCH_SIZE) {
    throw new Error(`Maksimal ${MAX_BATCH_SIZE} item per operasi bulk`);
  }
}

/**
 * Kategori yang boleh diakses actor untuk operasi bulk laporan.
 * null = semua (SUPERADMIN), [] = tidak ada.
 */
async function accessibleCategoriesOrAll(actor) {
  return adminGovernanceServices.getAccessibleCategoryIds(actor);
}

function inScope(categoryId, accessible) {
  if (accessible === null) return true; // SUPERADMIN
  return Array.isArray(accessible) && categoryId != null && accessible.includes(categoryId);
}

class BulkOperationsServices {
  /**
   * Bulk verify users. Kebijakan per-item identik dengan endpoint tunggal:
   * tiap target divalidasi via assertCanManageUser('verify') + wajib punya
   * KTM dan belum verified. SUPERADMIN target otomatis ditolak untuk actor
   * non-SUPERADMIN oleh policy.
   */
  async bulkVerifyUsers(userIds, actor) {
    try {
      assertBatch(userIds, 'userIds');

      const eligible = [];
      const skipped = [];
      for (const id of userIds) {
        try {
          const target = await getTargetUserOrThrow(id);
          await assertCanManageUser(actor, target, 'verify');
          if (target.role !== ROLES.MAHASISWA) {
            skipped.push({ id, reason: 'bukan mahasiswa' });
          } else {
            const detail = await prisma.user.findUnique({
              where: { id: target.id },
              select: { ktmPath: true, isVerified: true },
            });
            if (!detail?.ktmPath) skipped.push({ id, reason: 'tidak memiliki KTM' });
            else if (detail.isVerified) skipped.push({ id, reason: 'sudah terverifikasi' });
            else eligible.push(id);
          }
        } catch (err) {
          skipped.push({ id, reason: err.message || 'tidak diizinkan' });
        }
      }

      const result = await prisma.user.updateMany({
        where: { id: { in: eligible }, deletedAt: null },
        data: { isVerified: true, updatedAt: new Date() },
      });

      log.info('bulkVerifyUsers success', { verified: result.count, skipped: skipped.length });
      return { verified: result.count, userIds: eligible, skipped };
    } catch (error) {
      log.error('bulkVerifyUsers failed', { error: error.message });
      throw new Error(`Failed to bulk verify users: ${error.message}`);
    }
  }

  /**
   * Bulk soft delete users — kebijakan per-item identik dengan endpoint
   * tunggal (assertCanManageUser 'soft_delete'), termasuk proteksi
   * last-superadmin. Target SUPERADMIN diproses satu per satu sambil
   * menghitung ulang jumlah superadmin aktif agar guard tidak ter-race.
   */
  async bulkDeleteUsers(userIds, actor) {
    try {
      assertBatch(userIds, 'userIds');

      const targets = [];
      const skipped = [];
      for (const id of userIds) {
        try {
          const target = await getTargetUserOrThrow(id);
          if (target.role !== ROLES.SUPERADMIN) {
            // Assert di muka untuk target non-superadmin (guard last-superadmin
            // tidak relevan di sini).
            await assertCanManageUser(actor, target, 'soft_delete');
            targets.push(target);
          } else {
            targets.push(target); // diproses sequential di bawah
          }
        } catch (err) {
          skipped.push({ id, reason: err.message || 'tidak diizinkan' });
        }
      }

      let deleted = 0;
      const deletedIds = [];

      for (const target of targets) {
        try {
          if (target.role === ROLES.SUPERADMIN) {
            // Re-count superadmin aktif tepat sebelum eksekusi (anti race).
            await assertCanManageUser(actor, target, 'soft_delete');
          }
          const result = await prisma.user.updateMany({
            where: { id: target.id, deletedAt: null },
            data: { deletedAt: new Date(), updatedAt: new Date() },
          });
          if (result.count === 1) {
            deleted += 1;
            deletedIds.push(target.id);
          } else {
            skipped.push({ id: target.id, reason: 'sudah dihapus' });
          }
        } catch (err) {
          skipped.push({ id: target.id, reason: err.message || 'tidak diizinkan' });
        }
      }

      log.info('bulkDeleteUsers success', { deleted, skipped: skipped.length });
      return { deleted, userIds: deletedIds, skipped };
    } catch (error) {
      log.error('bulkDeleteUsers failed', { error: error.message });
      throw new Error(`Failed to bulk delete users: ${error.message}`);
    }
  }

  /**
   * Bulk restore users — kebijakan per-item identik dengan endpoint tunggal.
   */
  async bulkRestoreUsers(userIds, actor) {
    try {
      assertBatch(userIds, 'userIds');

      const eligible = [];
      const skipped = [];
      for (const id of userIds) {
        try {
          const target = await getTargetUserOrThrow(id, true);
          await assertCanManageUser(actor, target, 'restore');
          if (!target.deletedAt) {
            skipped.push({ id, reason: 'tidak sedang terhapus' });
          } else {
            eligible.push(id);
          }
        } catch (err) {
          skipped.push({ id, reason: err.message || 'tidak diizinkan' });
        }
      }

      const result = await prisma.user.updateMany({
        where: { id: { in: eligible }, deletedAt: { not: null } },
        data: { deletedAt: null, updatedAt: new Date() },
      });

      log.info('bulkRestoreUsers success', { restored: result.count, skipped: skipped.length });
      return { restored: result.count, userIds: eligible, skipped };
    } catch (error) {
      log.error('bulkRestoreUsers failed', { error: error.message });
      throw new Error(`Failed to bulk restore users: ${error.message}`);
    }
  }

  /**
   * Bulk update report status — scoped per kategori assignment, mengikuti
   * state machine yang sama dengan endpoint tunggal, dan mengisi closedAt
   * untuk semua status penutupan.
   */
  async bulkUpdateReportStatus(reportIds, status, actor, reason = null) {
    try {
      assertBatch(reportIds, 'reportIds');

      const allowedStatuses = ['PENDING', 'IN_REVIEW', 'IN_PROGRESS', 'RESOLVED', 'REJECTED', 'CANCELED'];
      if (!allowedStatuses.includes(status)) {
        throw new Error(`Invalid status. Must be one of: ${allowedStatuses.join(', ')}`);
      }
      if (['REJECTED', 'CANCELED'].includes(status) && (!reason || !String(reason).trim())) {
        throw new Error('Alasan wajib diisi untuk status REJECTED atau CANCELED');
      }

      const accessible = await accessibleCategoriesOrAll(actor);

      const reports = await prisma.report.findMany({
        where: { id: { in: reportIds }, deletedAt: null },
        select: { id: true, categoryId: true, status: true },
      });
      const byId = new Map(reports.map((r) => [r.id, r]));

      const eligible = [];
      const skipped = [];
      for (const id of reportIds) {
        const r = byId.get(id);
        if (!r) skipped.push({ id, reason: 'tidak ditemukan atau sudah dihapus' });
        else if (!inScope(r.categoryId, accessible)) skipped.push({ id, reason: 'di luar kategori assignment' });
        else if (!canTransition(r.status, status)) {
          skipped.push({ id, reason: `transisi ${r.status} → ${status} tidak valid` });
        } else eligible.push(id);
      }

      const updateData = { status, updatedAt: new Date() };
      if (['RESOLVED', 'REJECTED', 'CANCELED'].includes(status)) {
        updateData.closedAt = new Date();
      }

      const result = await prisma.report.updateMany({
        where: { id: { in: eligible }, deletedAt: null },
        data: updateData,
      });

      log.info('bulkUpdateReportStatus success', {
        updated: result.count,
        status,
        skipped: skipped.length,
      });
      return { updated: result.count, reportIds: eligible, newStatus: status, skipped };
    } catch (error) {
      log.error('bulkUpdateReportStatus failed', { error: error.message });
      throw new Error(`Failed to bulk update report status: ${error.message}`);
    }
  }

  /**
   * Bulk soft delete reports — scoped per kategori assignment.
   */
  async bulkDeleteReports(reportIds, actor) {
    try {
      assertBatch(reportIds, 'reportIds');

      const accessible = await accessibleCategoriesOrAll(actor);

      const reports = await prisma.report.findMany({
        where: { id: { in: reportIds }, deletedAt: null },
        select: { id: true, categoryId: true },
      });
      const byId = new Map(reports.map((r) => [r.id, r]));

      const eligible = [];
      const skipped = [];
      for (const id of reportIds) {
        const r = byId.get(id);
        if (!r) skipped.push({ id, reason: 'tidak ditemukan atau sudah dihapus' });
        else if (!inScope(r.categoryId, accessible)) skipped.push({ id, reason: 'di luar kategori assignment' });
        else eligible.push(id);
      }

      const result = await prisma.report.updateMany({
        where: { id: { in: eligible }, deletedAt: null },
        data: { deletedAt: new Date(), updatedAt: new Date() },
      });

      log.info('bulkDeleteReports success', { deleted: result.count, skipped: skipped.length });
      return { deleted: result.count, reportIds: eligible, skipped };
    } catch (error) {
      log.error('bulkDeleteReports failed', { error: error.message });
      throw new Error(`Failed to bulk delete reports: ${error.message}`);
    }
  }

  /**
   * Bulk restore reports — scoped per kategori assignment.
   */
  async bulkRestoreReports(reportIds, actor) {
    try {
      assertBatch(reportIds, 'reportIds');

      const accessible = await accessibleCategoriesOrAll(actor);

      const reports = await prisma.report.findMany({
        where: { id: { in: reportIds }, deletedAt: { not: null } },
        select: { id: true, categoryId: true },
      });
      const byId = new Map(reports.map((r) => [r.id, r]));

      const eligible = [];
      const skipped = [];
      for (const id of reportIds) {
        const r = byId.get(id);
        if (!r) skipped.push({ id, reason: 'tidak ditemukan atau tidak terhapus' });
        else if (!inScope(r.categoryId, accessible)) skipped.push({ id, reason: 'di luar kategori assignment' });
        else eligible.push(id);
      }

      const result = await prisma.report.updateMany({
        where: { id: { in: eligible }, deletedAt: { not: null } },
        data: { deletedAt: null, updatedAt: new Date() },
      });

      log.info('bulkRestoreReports success', { restored: result.count, skipped: skipped.length });
      return { restored: result.count, reportIds: eligible, skipped };
    } catch (error) {
      log.error('bulkRestoreReports failed', { error: error.message });
      throw new Error(`Failed to bulk restore reports: ${error.message}`);
    }
  }

  /**
   * Bulk delete categories — menolak kategori yang masih punya laporan aktif.
   * (Route sudah SUPERADMIN-only.)
   */
  async bulkDeleteCategories(categoryIds) {
    try {
      assertBatch(categoryIds, 'categoryIds');

      // Guard yang sama dengan deleteCategory tunggal: kategori dengan
      // laporan aktif tidak boleh dihapus.
      const busy = await prisma.report.groupBy({
        by: ['categoryId'],
        where: { categoryId: { in: categoryIds }, deletedAt: null },
        _count: { _all: true },
      });
      const busyIds = new Set(busy.filter((b) => b._count._all > 0).map((b) => b.categoryId));

      const eligible = [];
      const skipped = [];
      for (const id of categoryIds) {
        if (busyIds.has(id)) skipped.push({ id, reason: 'memiliki laporan aktif' });
        else eligible.push(id);
      }

      const result = await prisma.category.updateMany({
        where: { id: { in: eligible }, deletedAt: null },
        data: { deletedAt: new Date(), updatedAt: new Date() },
      });

      log.info('bulkDeleteCategories success', { deleted: result.count, skipped: skipped.length });
      return { deleted: result.count, categoryIds: eligible, skipped };
    } catch (error) {
      log.error('bulkDeleteCategories failed', { error: error.message });
      throw new Error(`Failed to bulk delete categories: ${error.message}`);
    }
  }

  /**
   * Bulk restore categories. (Route sudah SUPERADMIN-only.)
   */
  async bulkRestoreCategories(categoryIds) {
    try {
      assertBatch(categoryIds, 'categoryIds');

      const result = await prisma.category.updateMany({
        where: { id: { in: categoryIds }, deletedAt: { not: null } },
        data: { deletedAt: null, updatedAt: new Date() },
      });

      log.info('bulkRestoreCategories success', { count: result.count, categoryIds });
      return { restored: result.count, categoryIds, skipped: [] };
    } catch (error) {
      log.error('bulkRestoreCategories failed', { error: error.message });
      throw new Error(`Failed to bulk restore categories: ${error.message}`);
    }
  }
}

module.exports = new BulkOperationsServices();
