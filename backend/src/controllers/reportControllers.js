const ReportServices = require('../services/reportServices');
const auditLogServices = require('../services/auditLogServices');
const ResponseFormatter = require('../utils/responseFormatter');
const { getLogger } = require('../utils/logger');
const log = getLogger('report:controller');

// Admin: Get all reports paginated (with optional search & filter)
exports.getAllReportsPaginated = async (req, res) => {
  try {
    const { limit = 10, lastItemId: lastItemIdRaw, search, createdAt, categoryId, ...rest } = req.query;
    let filters = { ...rest };
    const take = parseInt(limit, 10);
    log.info('Admin get reports paginated', { take, search, createdAt, categoryId });
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
    // Universal createdAt filter (in days)
    if (createdAt) {
      const days = parseInt(createdAt, 10);
      if (!isNaN(days)) {
        const dateAgo = new Date();
        dateAgo.setDate(dateAgo.getDate() - days);
        filters.createdAt = { gte: dateAgo };
      }
    }
    const result = await ReportServices.getAllReportsPaginated(
      take,
      filters,
      false,
      lastItemIdInt
    );
    res.status(200).json(ResponseFormatter.success(result));
  } catch (err) {
    log.error('getAllReportsPaginated error', { error: err.message });
    res.status(500).json(ResponseFormatter.error(err.message));
  }
};

// Mahasiswa: Get all reports by userId paginated (with optional search & filter)
exports.getAllReportsByUserIdPaginated = async (req, res) => {
  try {
    const { limit = 10, lastItemId: lastItemIdRaw, search, createdAt, categoryId, ...rest } = req.query;
    let filters = { ...rest };
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
    res.status(200).json(ResponseFormatter.success(result));
  } catch (err) {
    log.warn('getReportById error', { error: err.message });
    res.status(404).json(ResponseFormatter.error(err.message));
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
    const { status } = req.body;
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
    
    // Get old report status for audit log
    const oldReport = await ReportServices.getReportById(id);
    const oldStatus = oldReport.status;
    
    const result = await ReportServices.updateReportStatus(id, status);
    
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
          newStatus: status
        }
      });
    } catch (auditError) {
      log.error('Failed to create audit log for update report status', { error: auditError.message });
    }
    
    res.status(200).json(ResponseFormatter.success(result, 'Status updated'));
  } catch (err) {
    log.warn('updateReportStatus error', { error: err.message });
    res.status(400).json(ResponseFormatter.error(err.message));
  }
};

// Restore report (soft delete restore)
exports.restoreReport = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    log.info('Restore report', { id });
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
    
    const result = await ReportServices.deleteReport(id);
    
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
  } catch (err) {
    log.warn('deleteReport error', { error: err.message });
    res.status(400).json(ResponseFormatter.error(err.message));
  }
};

exports.getReportStats = async (req, res) => {
  try {
    const stats = await ReportServices.getReportStats();
    log.info('Get report stats');
    res.status(200).json(ResponseFormatter.success(stats, 'Report statistics retrieved successfully'));
  } catch (error) {
    log.error('getReportStats error', { error: error.message });
    res.status(500).json(ResponseFormatter.error('Failed to get report statistics', 500));
  }
};

// Permanent delete report (hard delete)
exports.permanentDeleteReport = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    log.info('Permanent delete report', { id });
    
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