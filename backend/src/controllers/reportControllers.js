const ReportServices = require('../services/reportServices');
const auditLogServices = require('../services/auditLogServices');
const adminGovernanceServices = require('../services/adminGovernanceServices');
const emailService = require('../services/emailService');
const prisma = require('../utils/prisma');
const ResponseFormatter = require('../utils/responseFormatter');
const { anonymizeReport, anonymizeReportList } = require('../utils/anonymizer');
const { isSuperAdmin, isAdmin } = require('../utils/rbac');
const { canAccessReport, canAdminManageReport, isReportOwner } = require('../utils/accessPolicy');
const { getLogger } = require('../utils/logger');
const log = getLogger('report:controller');

/**
 * Rate-limit gate for VIEW_ANONYMOUS audit logs.
 *
 * We log when an admin opens an anonymous report's detail page, but a single
 * admin refreshing or polling the page would create dozens of redundant audit
 * rows in seconds. Key is `${actorId}:${reportId}` and we only allow one audit
 * entry per window (5 minutes).
 *
 * Audit L11: memakai Redis bila tersedia agar jendela dedup konsisten di
 * seluruh instance backend (multi-replica); fallback ke Map in-memory bila
 * Redis tidak dikonfigurasi (dev/test).
 */
const redisClient = require('../utils/redis');
const ANON_VIEW_AUDIT_WINDOW_MS = 5 * 60 * 1000;
const ANON_VIEW_AUDIT_WINDOW_S = Math.floor(ANON_VIEW_AUDIT_WINDOW_MS / 1000);
const anonViewAuditCache = new Map();

async function shouldRecordAnonViewAudit(actorId, reportId) {
  const redisKey = `anon_view_audit:${actorId}:${reportId}`;

  if (redisClient) {
    try {
      // SET NX EX: hanya sukses bila key belum ada dalam jendela. Mengembalikan
      // 'OK' pada pandangan pertama, null pada pandangan berulang.
      const setRes = await redisClient.set(redisKey, '1', 'EX', ANON_VIEW_AUDIT_WINDOW_S, 'NX');
      return setRes === 'OK';
    } catch (err) {
      log.warn('VIEW_ANONYMOUS redis gate failed, falling back to memory', { error: err.message });
      // lanjut ke jalur in-memory di bawah
    }
  }

  const key = `${actorId}:${reportId}`;
  const now = Date.now();
  const lastAt = anonViewAuditCache.get(key);
  if (lastAt && now - lastAt < ANON_VIEW_AUDIT_WINDOW_MS) return false;
  anonViewAuditCache.set(key, now);
  // Opportunistic pruning to keep memory bounded under load.
  if (anonViewAuditCache.size > 1000) {
    for (const [k, v] of anonViewAuditCache) {
      if (now - v >= ANON_VIEW_AUDIT_WINDOW_MS) anonViewAuditCache.delete(k);
    }
  }
  return true;
}

// Admin: Get all reports paginated (with optional search & filter)
exports.getAllReportsPaginated = async (req, res) => {
  try {
    const { limit = 10, lastItemId: lastItemIdRaw, search, createdAt, categoryId, assignedToId, includeDeleted: includeDeletedRaw, status, priority } = req.query;
    // Audit M10: JANGAN spread req.query ke Prisma `where`. Hanya param
    // whitelist yang boleh menjadi filter.
    const filters = {};
    if (status && ['PENDING', 'IN_REVIEW', 'IN_PROGRESS', 'RESOLVED', 'REJECTED', 'CANCELED'].includes(status)) {
      filters.status = status;
    }
    if (priority && ['LOW', 'MEDIUM', 'HIGH', 'URGENT'].includes(priority)) {
      filters.priority = priority;
    }
    const includeDeleted = includeDeletedRaw === 'true' || includeDeletedRaw === true;
    const take = parseInt(limit, 10);
    log.info('Admin get reports paginated', { take, search, createdAt, categoryId, assignedToId });
    let lastItemIdInt = null;
    if (lastItemIdRaw) {
      lastItemIdInt = parseInt(lastItemIdRaw, 10);
      if (isNaN(lastItemIdInt)) {
        return res.status(400).json(ResponseFormatter.error('Invalid lastItemId provided', 400));
      }
    }
    
    // Parse categoryId to integer if provided
    if (categoryId) {
      const parsedCategoryId = parseInt(categoryId, 10);
      if (isNaN(parsedCategoryId)) {
        return res.status(400).json(ResponseFormatter.error('Invalid categoryId provided', 400));
      }
      filters.categoryId = parsedCategoryId;
    }

    // Filter by assignedToId
    if (assignedToId === 'me') {
      filters.assignedToId = req.user.userId;
    } else if (assignedToId === 'unassigned') {
      filters.assignedToId = null;
    } else if (assignedToId) {
      const parsedAssignedId = parseInt(assignedToId, 10);
      if (!isNaN(parsedAssignedId)) {
        filters.assignedToId = parsedAssignedId;
      }
    }
    
    if (search) {
      filters.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }
    // Universal createdAt filter (in days)
    if (createdAt) {
      const days = parseInt(createdAt, 10);
      if (!isNaN(days)) {
        const dateAgo = new Date();
        dateAgo.setDate(dateAgo.getDate() - days);
        filters.createdAt = { gte: dateAgo };
      }
    }

    // BE-6: scope ADMIN users to their assigned categories. SUPERADMIN sees
    // everything (sentinel: getAccessibleCategoryIds returns null).
    const accessibleCategoryIds = await adminGovernanceServices.getAccessibleCategoryIds(req.user);
    if (accessibleCategoryIds !== null) {
      if (accessibleCategoryIds.length === 0) {
        // ADMIN with no assignments — return empty payload immediately, do not
        // expose any category by accident.
        return res.status(200).json(
          ResponseFormatter.success({
            data: [],
            pagination: { totalItems: 0, itemsPerPage: take, hasNextPage: false, lastItemId: null },
          })
        );
      }
      // Compose with any explicit categoryId filter the caller passed.
      if (filters.categoryId !== undefined) {
        if (!accessibleCategoryIds.includes(filters.categoryId)) {
          return res.status(200).json(
            ResponseFormatter.success({
              data: [],
              pagination: { totalItems: 0, itemsPerPage: take, hasNextPage: false, lastItemId: null },
            })
          );
        }
      } else {
        filters.categoryId = { in: accessibleCategoryIds };
      }
    }

    const result = await ReportServices.getAllReportsPaginated(
      take,
      filters,
      includeDeleted,
      lastItemIdInt
    );
    // Mask reporter identity for any anonymous report (admin included)
    if (result?.data) anonymizeReportList(result.data, req.user);
    res.status(200).json(ResponseFormatter.success(result));
  } catch (err) {
    log.error('getAllReportsPaginated error', { error: err.message });
    res.status(500).json(ResponseFormatter.error(err.message));
  }
};

// Mahasiswa: Get all reports by userId paginated (with optional search & filter)
exports.getAllReportsByUserIdPaginated = async (req, res) => {
  try {
    const { limit = 10, lastItemId: lastItemIdRaw, search, createdAt, categoryId, status } = req.query;
    // Audit M10: hanya param whitelist yang jadi filter — `userId` TIDAK boleh
    // datang dari query; selalu dari sesi (lihat getAllReportsByUserIdPaginated).
    const filters = {};
    if (status && ['PENDING', 'IN_REVIEW', 'IN_PROGRESS', 'RESOLVED', 'REJECTED', 'CANCELED'].includes(status)) {
      filters.status = status;
    }
    const take = parseInt(limit, 10);
    log.info('User get reports paginated', { userId: req.user?.userId, take, search, createdAt, categoryId });
    let lastItemIdInt = null;
    if (lastItemIdRaw) {
      lastItemIdInt = parseInt(lastItemIdRaw, 10);
      if (isNaN(lastItemIdInt)) {
        return res.status(400).json(ResponseFormatter.error('Invalid lastItemId provided', 400));
      }
    }
    
    // Parse categoryId to integer if provided
    if (categoryId) {
      const parsedCategoryId = parseInt(categoryId, 10);
      if (isNaN(parsedCategoryId)) {
        return res.status(400).json(ResponseFormatter.error('Invalid categoryId provided', 400));
      }
      filters.categoryId = parsedCategoryId;
    }
    
    if (search) {
      filters.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }
    if (createdAt) {
      const days = parseInt(createdAt, 10);
      if (!isNaN(days)) {
        const dateAgo = new Date();
        dateAgo.setDate(dateAgo.getDate() - days);
        filters.createdAt = { gte: dateAgo };
      }
    }
    const userIdRaw = req.user.userId;
    const userId = parseInt(userIdRaw, 10);
    if (isNaN(userId)) {
      return res.status(400).json(ResponseFormatter.error('Invalid userId provided', 400));
    }
    const result = await ReportServices.getAllReportsByUserIdPaginated(
      userId,
      filters,
      take,
      false,
      lastItemIdInt
    );
    // No-op for the reporter's own list, but kept for safety/consistency.
    if (result?.data) anonymizeReportList(result.data, req.user);
    res.status(200).json(ResponseFormatter.success(result));
  } catch (err) {
    log.error('getAllReportsByUserIdPaginated error', { error: err.message });
    res.status(500).json(ResponseFormatter.error(err.message));
  }
};

// Get report by ID
exports.getReportById = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const includeDeleted = req.query.includeDeleted === 'true' || req.query.includeDeleted === true;
    log.info('Get report by id', { id, includeDeleted });
    const result = await ReportServices.getReportById(id, includeDeleted);

    const access = await canAccessReport(req.user, result, { includeDeleted });
    if (!access.allowed) {
      return res.status(access.statusCode || 403).json(
        ResponseFormatter.error(access.reason || 'Access denied', access.statusCode || 403)
      );
    }

    // BE-6: enforce category scope for ADMIN. The reporter (any role) and any
    // SUPERADMIN bypass this check. ADMIN must have the report's category in
    // their assignment list.
    const isOwner = isReportOwner(req.user, result);
    const isAdminTier = req.user?.role === 'ADMIN' || req.user?.role === 'SUPERADMIN';
    if (isAdminTier && !isOwner && !isSuperAdmin(req.user)) {
      const accessibleCategoryIds = await adminGovernanceServices.getAccessibleCategoryIds(req.user);
      if (
        accessibleCategoryIds !== null &&
        (!result.categoryId || !accessibleCategoryIds.includes(result.categoryId))
      ) {
        return res.status(403).json(
          ResponseFormatter.error('You are not assigned to this report\'s category', 403)
        );
      }
    }

    // Audit anonymous-report views by admins. Recorded BEFORE masking so we
    // still know which admin viewed which anonymous report. The reporter
    // viewing their own report is not audited.
    if (
      result?.isAnonymous &&
      isAdminTier &&
      !isOwner &&
      (await shouldRecordAnonViewAudit(req.user.userId, result.id))
    ) {
      // Fire-and-forget — never block the response on audit-log latency.
      auditLogServices
        .createAuditLog({
          entityType: 'REPORT',
          action: 'VIEW_ANONYMOUS',
          entityId: result.id,
          actorId: req.user.userId,
          actorName: req.user.name,
          actorRole: req.user.role,
          ip: req.ip,
          userAgent: req.headers['user-agent'],
          metadata: {
            registrationNumber: result.registrationNumber,
            masked: true,
          },
        })
        .catch(auditErr =>
          log.error('Failed to create VIEW_ANONYMOUS audit log', { error: auditErr.message })
        );
    }

    // Mask reporter identity (and chat sender) when the report is anonymous.
    // Admins are NOT exempt — only the reporter themselves sees their identity.
    // SUPERADMIN does NOT bypass anonymity. Anonymity is a reporter privilege
    // independent of admin tier.
    anonymizeReport(result, req.user);

    res.status(200).json(ResponseFormatter.success(result));
  } catch (err) {
    log.warn('getReportById error', { error: err.message });
    res.status(404).json(ResponseFormatter.error(err.message));
  }
};

// Edit report (only when PENDING, only by owner)
exports.editReport = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const userId = req.user.userId;
    const { title, description, categoryId } = req.body;
    log.info('Edit report', { id, userId });

    // Get current report
    const report = await ReportServices.getReportById(id);

    // Only owner can edit
    if (report.userId !== userId) {
      return res.status(403).json(ResponseFormatter.error('Hanya pemilik laporan yang bisa mengedit', 403));
    }

    // Only editable when PENDING
    if (report.status !== 'PENDING') {
      return res.status(400).json(ResponseFormatter.error(
        'Laporan hanya bisa diedit saat status PENDING. Status saat ini: ' + report.status
      ));
    }

    // Build update data from explicit whitelist
    const updateData = {};
    if (title) updateData.title = title;
    if (description) updateData.description = description;
    if (categoryId) updateData.categoryId = categoryId;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json(ResponseFormatter.error('Tidak ada data yang diubah'));
    }

    // Audit M9: jika kategori berubah, validasi ulang kategori tujuan —
    // harus aktif (belum dihapus) dan tetap kompatibel dengan anonimitas.
    if (categoryId && Number(categoryId) !== Number(report.categoryId)) {
      const newCategory = await prisma.category.findFirst({
        where: { id: Number(categoryId), deletedAt: null },
        select: { id: true, allowAnonymous: true },
      });
      if (!newCategory) {
        return res.status(400).json(
          ResponseFormatter.error('Kategori tidak ditemukan atau sudah dihapus', 400)
        );
      }
      if (report.isAnonymous && !newCategory.allowAnonymous) {
        return res.status(400).json(
          ResponseFormatter.error('Kategori baru tidak mengizinkan laporan anonim', 400)
        );
      }
    }

    // Defense-in-depth: assert no immutable field slipped through.
    // (Current code can't trigger this, but guards against future refactors
    // that might spread req.body into updateData.)
    try {
      ReportServices.assertImmutableFieldsNotMutated(updateData);
    } catch (immutableErr) {
      return res.status(400).json(ResponseFormatter.error(immutableErr.message));
    }

    // Audit B1: update kondisional — laporan harus masih PENDING (dan milik
    // user ini, belum terhapus) tepat saat penulisan, menutup race TOCTOU.
    const updated = await prisma.report.updateMany({
      where: { id, userId, status: 'PENDING', deletedAt: null },
      data: updateData,
    });
    if (updated.count !== 1) {
      return res.status(409).json(ResponseFormatter.error(
        'Laporan baru saja berubah (status bukan PENDING lagi). Muat ulang dan coba lagi.',
        409
      ));
    }

    const result = await prisma.report.findUnique({
      where: { id },
      select: { id: true, title: true, description: true, categoryId: true, status: true, registrationNumber: true }
    });

    // Audit L2: edit laporan wajib tercatat.
    try {
      await auditLogServices.createAuditLog({
        entityType: 'REPORT',
        action: 'UPDATE',
        entityId: id,
        actorId: req.user.userId,
        actorName: req.user.name,
        actorRole: req.user.role,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        metadata: {
          operation: 'EDIT_REPORT',
          updatedFields: Object.keys(updateData),
          registrationNumber: result?.registrationNumber,
        },
      });
    } catch (auditError) {
      log.error('Failed to create audit log for edit report', { error: auditError.message });
    }

    res.status(200).json(ResponseFormatter.success(result, 'Laporan berhasil diperbarui'));
  } catch (err) {
    log.warn('editReport error', { error: err.message });
    res.status(400).json(ResponseFormatter.error(err.message));
  }
};

// Create report
exports.createReport = async (req, res) => {
  try {
    const reportData = { ...req.body, userId: req.user.userId };
    log.info('Create report', { userId: req.user?.userId, categoryId: req.body?.categoryId });
    const result = await ReportServices.createReport(reportData);
    res.status(201).json(ResponseFormatter.success(result, 'Report created'));
  } catch (err) {
    log.warn('createReport error', { error: err.message });
    res.status(400).json(ResponseFormatter.error(err.message));
  }
};

// Update report status
exports.updateReportStatus = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { status, reason } = req.body;
    log.info('Update report status', { id, status });
    const allowedStatus = [
      'PENDING',
      'IN_REVIEW',
      'IN_PROGRESS',
      'RESOLVED',
      'REJECTED',
      'CANCELED'
    ];
    if (!allowedStatus.includes(status)) {
      return res.status(400).json(ResponseFormatter.error(
        `Status must be one of: ${allowedStatus.join(', ')}`
      ));
    }
    if (['REJECTED', 'CANCELED'].includes(status) && !reason?.trim()) {
      return res.status(400).json(
        ResponseFormatter.error('Alasan wajib diisi untuk status REJECTED atau CANCELED', 400)
      );
    }
    
    // Get old report status for audit log and transition validation
    const oldReport = await ReportServices.getReportById(id);
    const oldStatus = oldReport.status;

    const access = await canAdminManageReport(req.user, oldReport);
    if (!access.allowed) {
      return res.status(access.statusCode || 403).json(
        ResponseFormatter.error(access.reason || 'Access denied', access.statusCode || 403)
      );
    }

    // Status transition validation (state machine — satu sumber dengan bulk ops)
    const { VALID_TRANSITIONS } = require('../utils/reportTransitions');
    const allowed = VALID_TRANSITIONS[oldStatus] || [];
    if (!allowed.includes(status)) {
      return res.status(400).json(ResponseFormatter.error(
        `Tidak bisa mengubah status dari ${oldStatus} ke ${status}. Transisi yang diizinkan: ${allowed.join(', ')}`
      ));
    }
    
    const result = await ReportServices.updateReportStatus(id, status, oldStatus, reason);
    
    // Create audit log
    try {
      await auditLogServices.createAuditLog({
        entityType: 'REPORT',
        action: 'UPDATE_STATUS',
        entityId: id,
        actorId: req.user.userId,
        actorName: req.user.name,
        actorRole: req.user.role,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        metadata: {
          reportTitle: result.title,
          registrationNumber: result.registrationNumber,
          oldStatus,
          newStatus: status,
          reason: reason?.trim() || null
        }
      });
    } catch (auditError) {
      log.error('Failed to create audit log for update report status', { error: auditError.message });
    }
    
    // Send email notification to report owner (fire-and-forget)
    if (result.userId) {
      prisma.user.findUnique({
        where: { id: result.userId },
        select: { email: true, name: true }
      }).then(reportOwner => {
        if (reportOwner) {
          emailService.notifyStatusChange(
            reportOwner.email,
            reportOwner.name,
            result.title,
            result.registrationNumber,
            oldStatus,
            status
          ).catch(err => log.error('Status change email failed', { error: err.message }));
        }
      }).catch(err => log.error('Failed to fetch report owner for email', { error: err.message }));
    }
    
    res.status(200).json(ResponseFormatter.success(result, 'Status updated'));
  } catch (err) {
    log.warn('updateReportStatus error', { error: err.message });
    const statusCode = err.statusCode || 400;
    res.status(statusCode).json(ResponseFormatter.error(err.message, statusCode));
  }
};

// Restore report (soft delete restore)
exports.restoreReport = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    log.info('Restore report', { id });

    const access = await canAdminManageReport(req.user, id, { includeDeleted: true });
    if (!access.allowed) {
      return res.status(access.statusCode || 403).json(
        ResponseFormatter.error(access.reason || 'Access denied', access.statusCode || 403)
      );
    }

    const result = await ReportServices.restoreReport(id);
    
    // Create audit log
    try {
      await auditLogServices.createAuditLog({
        entityType: 'REPORT',
        action: 'RESTORE',
        entityId: id,
        actorId: req.user.userId,
        actorName: req.user.name,
        actorRole: req.user.role,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        metadata: {
          reportTitle: result.title,
          registrationNumber: result.registrationNumber,
          status: result.status
        }
      });
    } catch (auditError) {
      log.error('Failed to create audit log for restore report', { error: auditError.message });
    }
    
    res.status(200).json(ResponseFormatter.success(result, 'Report restored'));
  } catch (err) {
    log.warn('restoreReport error', { error: err.message });
    res.status(400).json(ResponseFormatter.error(err.message));
  }
};

// Delete report (soft delete)
exports.deleteReport = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    log.info('Delete report', { id });
    
    // Get report details before deletion for audit log
    const report = await ReportServices.getReportById(id, true);

    const access = await canAccessReport(req.user, report, { includeDeleted: true });
    if (!access.allowed) {
      return res.status(access.statusCode || 403).json(
        ResponseFormatter.error(access.reason || 'Access denied', access.statusCode || 403)
      );
    }
    if (!isAdmin(req.user) && report.status !== 'PENDING') {
      return res.status(400).json(
        ResponseFormatter.error('Laporan hanya bisa dihapus oleh pemilik saat status PENDING', 400)
      );
    }
    
    let result;
    if (!isAdmin(req.user)) {
      // Bagi mahasiswa, menghapus laporan PENDING berarti membatalkannya.
      // Audit B1: teruskan status yang terbaca agar update kondisional
      // menolak bila status berubah di tengah proses (TOCTOU).
      result = await ReportServices.updateReportStatus(id, 'CANCELED', report.status);
      
      // Create audit log for cancellation
      try {
        await auditLogServices.createAuditLog({
          entityType: 'REPORT',
          action: 'UPDATE_STATUS',
          entityId: id,
          actorId: req.user.userId,
          actorName: req.user.name,
          actorRole: req.user.role,
          ip: req.ip,
          userAgent: req.headers['user-agent'],
          metadata: {
            reportTitle: report.title,
            registrationNumber: report.registrationNumber,
            oldStatus: report.status,
            newStatus: 'CANCELED',
            reason: 'Dibatalkan oleh mahasiswa'
          }
        });
      } catch (auditError) {
        log.error('Failed to create audit log for cancel report', { error: auditError.message });
      }

      // Kirim email notifikasi kepada pemilik laporan
      if (result.userId) {
        prisma.user.findUnique({
          where: { id: result.userId },
          select: { email: true, name: true }
        }).then(reportOwner => {
          if (reportOwner) {
            emailService.notifyStatusChange(
              reportOwner.email,
              reportOwner.name,
              result.title,
              result.registrationNumber,
              report.status,
              'CANCELED'
            ).catch(err => log.error('Status change email failed', { error: err.message }));
          }
        }).catch(err => log.error('Failed to fetch report owner for email', { error: err.message }));
      }
      
      res.status(200).json(ResponseFormatter.success(result, 'Laporan berhasil dibatalkan'));
    } else {
      result = await ReportServices.deleteReport(id);
      
      // Create audit log
      try {
        await auditLogServices.createAuditLog({
          entityType: 'REPORT',
          action: 'SOFT_DELETE',
          entityId: id,
          actorId: req.user.userId,
          actorName: req.user.name,
          actorRole: req.user.role,
          ip: req.ip,
          userAgent: req.headers['user-agent'],
          metadata: {
            reportTitle: report.title,
            registrationNumber: report.registrationNumber,
            status: report.status
          }
        });
      } catch (auditError) {
        log.error('Failed to create audit log for delete report', { error: auditError.message });
      }
      
      res.status(200).json(ResponseFormatter.success(result, 'Report deleted'));
    }
  } catch (err) {
    log.warn('deleteReport error', { error: err.message });
    const statusCode = err.statusCode || 400;
    res.status(statusCode).json(ResponseFormatter.error(err.message, statusCode));
  }
};

exports.getReportStats = async (req, res) => {
  try {
    // Audit B5: ADMIN hanya melihat statistik kategori assignment-nya;
    // SUPERADMIN (sentinel null) melihat global.
    const categoryIds = await adminGovernanceServices.getAccessibleCategoryIds(req.user);
    const stats = await ReportServices.getReportStats(categoryIds);
    log.info('Get report stats');
    res.status(200).json(ResponseFormatter.success(stats, 'Report statistics retrieved successfully'));
  } catch (error) {
    log.error('getReportStats error', { error: error.message });
    res.status(500).json(ResponseFormatter.error('Failed to get report statistics', 500));
  }
};

// Assign report to an admin (admin only)
exports.assignReport = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { assignedToId } = req.body;
    log.info('Assign report', { id, assignedToId });

    // BE-6: ADMIN can only assign reports in their accessible categories.
    // SUPERADMIN can assign any report.
    if (!isSuperAdmin(req.user)) {
      const target = await prisma.report.findUnique({
        where: { id },
        select: { categoryId: true },
      });
      if (!target) {
        return res.status(404).json(ResponseFormatter.error('Report not found', 404));
      }
      const accessible = await adminGovernanceServices.getAccessibleCategoryIds(req.user);
      if (accessible !== null && (!target.categoryId || !accessible.includes(target.categoryId))) {
        return res.status(403).json(
          ResponseFormatter.error('You are not assigned to this report\'s category', 403)
        );
      }
    }

    // If assigning (not unassigning), validate assignee is an admin
    if (assignedToId) {
      const assignee = await prisma.user.findUnique({
        where: { id: assignedToId },
        select: { id: true, role: true, name: true, isVerified: true, deletedAt: true }
      });
      if (!assignee || assignee.deletedAt) {
        return res.status(400).json(
          ResponseFormatter.error('Assignee not found or has been deleted')
        );
      }
      if (!assignee.isVerified) {
        return res.status(400).json(
          ResponseFormatter.error('Cannot assign to an unverified admin')
        );
      }
      if (assignee.role !== 'ADMIN' && assignee.role !== 'SUPERADMIN') {
        return res.status(400).json(
          ResponseFormatter.error('Can only assign reports to admin users')
        );
      }

      if (assignee.role === 'ADMIN') {
        const report = await prisma.report.findUnique({
          where: { id },
          select: { categoryId: true },
        });
        const assignment = await prisma.adminCategoryAssignment.findUnique({
          where: {
            adminId_categoryId: {
              adminId: assignee.id,
              categoryId: report?.categoryId,
            },
          },
        });
        if (!assignment) {
          return res.status(400).json(
            ResponseFormatter.error('Assignee is not assigned to this report\'s category')
          );
        }
      }
    }

    const result = await prisma.report.update({
      where: { id },
      data: { assignedToId: assignedToId || null },
      select: {
        id: true,
        assignedToId: true,
        title: true,
        registrationNumber: true,
        assignedTo: { select: { id: true, name: true, email: true } }
      }
    });

    // Audit L2: assignment/unassignment laporan wajib tercatat.
    try {
      await auditLogServices.createAuditLog({
        entityType: 'REPORT',
        action: 'UPDATE',
        entityId: id,
        actorId: req.user.userId,
        actorName: req.user.name,
        actorRole: req.user.role,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        metadata: {
          operation: assignedToId ? 'ASSIGN_REPORT' : 'UNASSIGN_REPORT',
          assignedToId: assignedToId || null,
          reportTitle: result.title,
          registrationNumber: result.registrationNumber,
        },
      });
    } catch (auditError) {
      log.error('Failed to create audit log for assign report', { error: auditError.message });
    }

    res.status(200).json(ResponseFormatter.success(result, assignedToId ? 'Report assigned' : 'Report unassigned'));
  } catch (err) {
    log.warn('assignReport error', { error: err.message });
    res.status(400).json(ResponseFormatter.error(err.message));
  }
};

// Update report priority (admin only)
exports.updateReportPriority = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { priority } = req.body;
    log.info('Update report priority', { id, priority });

    const allowedPriority = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
    if (!allowedPriority.includes(priority)) {
      return res.status(400).json(
        ResponseFormatter.error(`Priority must be one of: ${allowedPriority.join(', ')}`)
      );
    }

    const access = await canAdminManageReport(req.user, id);
    if (!access.allowed) {
      return res.status(access.statusCode || 403).json(
        ResponseFormatter.error(access.reason || 'Access denied', access.statusCode || 403)
      );
    }

    const result = await prisma.report.update({
      where: { id },
      data: { priority },
      select: { id: true, priority: true, title: true, registrationNumber: true }
    });

    // Audit L2: perubahan prioritas wajib tercatat.
    try {
      await auditLogServices.createAuditLog({
        entityType: 'REPORT',
        action: 'UPDATE',
        entityId: id,
        actorId: req.user.userId,
        actorName: req.user.name,
        actorRole: req.user.role,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        metadata: {
          operation: 'UPDATE_PRIORITY',
          newPriority: priority,
          reportTitle: result.title,
          registrationNumber: result.registrationNumber,
        },
      });
    } catch (auditError) {
      log.error('Failed to create audit log for update priority', { error: auditError.message });
    }

    res.status(200).json(ResponseFormatter.success(result, 'Priority updated'));
  } catch (err) {
    log.warn('updateReportPriority error', { error: err.message });
    res.status(400).json(ResponseFormatter.error(err.message));
  }
};

// Permanent delete report (hard delete)
exports.permanentDeleteReport = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    log.info('Permanent delete report', { id });

    if (!isSuperAdmin(req.user)) {
      return res.status(403).json(ResponseFormatter.error('Super admin privileges required', 403));
    }
    
    // Get report details before permanent deletion for audit log
    const report = await ReportServices.getReportById(id, true); // Include deleted
    
    await ReportServices.permanentDeleteReport(id);
    
    // Create audit log
    try {
      await auditLogServices.createAuditLog({
        entityType: 'REPORT',
        action: 'HARD_DELETE',
        entityId: id,
        actorId: req.user.userId,
        actorName: req.user.name,
        actorRole: req.user.role,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        metadata: {
          reportTitle: report.title,
          registrationNumber: report.registrationNumber,
          status: report.status
        }
      });
    } catch (auditError) {
      log.error('Failed to create audit log for permanent delete report', { error: auditError.message });
    }
    
    res.status(200).json(ResponseFormatter.success(null, 'Report permanently deleted'));
  } catch (err) {
    log.warn('permanentDeleteReport error', { error: err.message });
    res.status(400).json(ResponseFormatter.error(err.message));
  }
};

// Internals exposed for unit testing the rate-limit cache only.
// Not part of the public controller surface.
exports.__test = {
  shouldRecordAnonViewAudit,
  anonViewAuditCache,
  ANON_VIEW_AUDIT_WINDOW_MS,
};
