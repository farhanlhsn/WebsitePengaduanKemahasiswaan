const bulkOperationsServices = require('../services/bulkOperationsServices');
const auditLogServices = require('../services/auditLogServices');
const ResponseFormatter = require('../utils/responseFormatter');
const { getLogger } = require('../utils/logger');

const log = getLogger('bulk-ops:controller');

exports.bulkVerifyUsers = async (req, res) => {
  try {
    const { userIds } = req.body;
    log.info('Bulk verify users', { userIds, actorId: req.user.userId });

    const result = await bulkOperationsServices.bulkVerifyUsers(userIds);

    // Create audit log for bulk operation
    try {
      await auditLogServices.createAuditLog({
        entityType: 'USER',
        action: 'VERIFY_MAHASISWA',
        entityId: 0, // Bulk operation, no single entity
        actorId: req.user.userId,
        actorName: req.user.name,
        actorRole: req.user.role,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        metadata: {
          operation: 'BULK_VERIFY',
          userIds,
          count: result.verified
        }
      });
    } catch (auditError) {
      log.error('Failed to create audit log for bulk verify users', { error: auditError.message });
    }

    res.status(200).json(
      ResponseFormatter.success(result, `Successfully verified ${result.verified} users`)
    );
  } catch (error) {
    log.error('bulkVerifyUsers error', { error: error.message });
    res.status(400).json(
      ResponseFormatter.error(`Failed to bulk verify users: ${error.message}`, 400)
    );
  }
};

exports.bulkDeleteUsers = async (req, res) => {
  try {
    const { userIds } = req.body;
    log.info('Bulk delete users', { userIds, actorId: req.user.userId });

    const result = await bulkOperationsServices.bulkDeleteUsers(userIds);

    // Create audit log
    try {
      await auditLogServices.createAuditLog({
        entityType: 'USER',
        action: 'SOFT_DELETE',
        entityId: 0,
        actorId: req.user.userId,
        actorName: req.user.name,
        actorRole: req.user.role,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        metadata: {
          operation: 'BULK_DELETE',
          userIds,
          count: result.deleted
        }
      });
    } catch (auditError) {
      log.error('Failed to create audit log for bulk delete users', { error: auditError.message });
    }

    res.status(200).json(
      ResponseFormatter.success(result, `Successfully deleted ${result.deleted} users`)
    );
  } catch (error) {
    log.error('bulkDeleteUsers error', { error: error.message });
    res.status(400).json(
      ResponseFormatter.error(`Failed to bulk delete users: ${error.message}`, 400)
    );
  }
};

exports.bulkRestoreUsers = async (req, res) => {
  try {
    const { userIds } = req.body;
    log.info('Bulk restore users', { userIds, actorId: req.user.userId });

    const result = await bulkOperationsServices.bulkRestoreUsers(userIds);

    // Create audit log
    try {
      await auditLogServices.createAuditLog({
        entityType: 'USER',
        action: 'RESTORE',
        entityId: 0,
        actorId: req.user.userId,
        actorName: req.user.name,
        actorRole: req.user.role,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        metadata: {
          operation: 'BULK_RESTORE',
          userIds,
          count: result.restored
        }
      });
    } catch (auditError) {
      log.error('Failed to create audit log for bulk restore users', { error: auditError.message });
    }

    res.status(200).json(
      ResponseFormatter.success(result, `Successfully restored ${result.restored} users`)
    );
  } catch (error) {
    log.error('bulkRestoreUsers error', { error: error.message });
    res.status(400).json(
      ResponseFormatter.error(`Failed to bulk restore users: ${error.message}`, 400)
    );
  }
};

exports.bulkUpdateReportStatus = async (req, res) => {
  try {
    const { reportIds, status } = req.body;
    log.info('Bulk update report status', { reportIds, status, actorId: req.user.userId });

    const result = await bulkOperationsServices.bulkUpdateReportStatus(reportIds, status);

    // Create audit log
    try {
      await auditLogServices.createAuditLog({
        entityType: 'REPORT',
        action: 'UPDATE_STATUS',
        entityId: 0,
        actorId: req.user.userId,
        actorName: req.user.name,
        actorRole: req.user.role,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        metadata: {
          operation: 'BULK_UPDATE_STATUS',
          reportIds,
          newStatus: status,
          count: result.updated
        }
      });
    } catch (auditError) {
      log.error('Failed to create audit log for bulk update report status', { error: auditError.message });
    }

    res.status(200).json(
      ResponseFormatter.success(result, `Successfully updated ${result.updated} reports`)
    );
  } catch (error) {
    log.error('bulkUpdateReportStatus error', { error: error.message });
    res.status(400).json(
      ResponseFormatter.error(`Failed to bulk update report status: ${error.message}`, 400)
    );
  }
};

exports.bulkDeleteReports = async (req, res) => {
  try {
    const { reportIds } = req.body;
    log.info('Bulk delete reports', { reportIds, actorId: req.user.userId });

    const result = await bulkOperationsServices.bulkDeleteReports(reportIds);

    // Create audit log
    try {
      await auditLogServices.createAuditLog({
        entityType: 'REPORT',
        action: 'SOFT_DELETE',
        entityId: 0,
        actorId: req.user.userId,
        actorName: req.user.name,
        actorRole: req.user.role,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        metadata: {
          operation: 'BULK_DELETE',
          reportIds,
          count: result.deleted
        }
      });
    } catch (auditError) {
      log.error('Failed to create audit log for bulk delete reports', { error: auditError.message });
    }

    res.status(200).json(
      ResponseFormatter.success(result, `Successfully deleted ${result.deleted} reports`)
    );
  } catch (error) {
    log.error('bulkDeleteReports error', { error: error.message });
    res.status(400).json(
      ResponseFormatter.error(`Failed to bulk delete reports: ${error.message}`, 400)
    );
  }
};

exports.bulkRestoreReports = async (req, res) => {
  try {
    const { reportIds } = req.body;
    log.info('Bulk restore reports', { reportIds, actorId: req.user.userId });

    const result = await bulkOperationsServices.bulkRestoreReports(reportIds);

    // Create audit log
    try {
      await auditLogServices.createAuditLog({
        entityType: 'REPORT',
        action: 'RESTORE',
        entityId: 0,
        actorId: req.user.userId,
        actorName: req.user.name,
        actorRole: req.user.role,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        metadata: {
          operation: 'BULK_RESTORE',
          reportIds,
          count: result.restored
        }
      });
    } catch (auditError) {
      log.error('Failed to create audit log for bulk restore reports', { error: auditError.message });
    }

    res.status(200).json(
      ResponseFormatter.success(result, `Successfully restored ${result.restored} reports`)
    );
  } catch (error) {
    log.error('bulkRestoreReports error', { error: error.message });
    res.status(400).json(
      ResponseFormatter.error(`Failed to bulk restore reports: ${error.message}`, 400)
    );
  }
};

exports.bulkDeleteCategories = async (req, res) => {
  try {
    const { categoryIds } = req.body;
    log.info('Bulk delete categories', { categoryIds, actorId: req.user.userId });

    const result = await bulkOperationsServices.bulkDeleteCategories(categoryIds);

    res.status(200).json(
      ResponseFormatter.success(result, `Successfully deleted ${result.deleted} categories`)
    );
  } catch (error) {
    log.error('bulkDeleteCategories error', { error: error.message });
    res.status(400).json(
      ResponseFormatter.error(`Failed to bulk delete categories: ${error.message}`, 400)
    );
  }
};

exports.bulkRestoreCategories = async (req, res) => {
  try {
    const { categoryIds } = req.body;
    log.info('Bulk restore categories', { categoryIds, actorId: req.user.userId });

    const result = await bulkOperationsServices.bulkRestoreCategories(categoryIds);

    res.status(200).json(
      ResponseFormatter.success(result, `Successfully restored ${result.restored} categories`)
    );
  } catch (error) {
    log.error('bulkRestoreCategories error', { error: error.message });
    res.status(400).json(
      ResponseFormatter.error(`Failed to bulk restore categories: ${error.message}`, 400)
    );
  }
};

