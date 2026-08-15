const auditLogServices = require('../services/auditLogServices');
const ResponseFormatter = require('../utils/responseFormatter');
const { getLogger } = require('../utils/logger');

const log = getLogger('audit:controller');

exports.getAuditLogs = async (req, res) => {
  try {
    const filters = {
      entityType: req.query.entityType,
      action: req.query.action,
      actorId: req.query.actorId,
      entityId: req.query.entityId,
      limit: req.query.limit || 50,
      offset: req.query.offset || 0,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
    };

    log.info('Get audit logs', { filters });

    const result = await auditLogServices.getAuditLogs(filters);

    res.status(200).json(
      ResponseFormatter.success(result, 'Audit logs retrieved successfully')
    );
  } catch (error) {
    log.error('getAuditLogs error', { error: error.message });
    res.status(500).json(
      ResponseFormatter.error(`Failed to get audit logs: ${error.message}`, 500)
    );
  }
};

exports.getAuditLogsByEntity = async (req, res) => {
  try {
    const { entityType, entityId } = req.params;

    log.info('Get audit logs by entity', { entityType, entityId });

    // Validate entityType
    if (!['USER', 'REPORT', 'CATEGORY', 'ASSIGNMENT'].includes(entityType)) {
      return res.status(400).json(
        ResponseFormatter.error('Invalid entity type. Must be USER, REPORT, CATEGORY, or ASSIGNMENT', 400)
      );
    }

    const logs = await auditLogServices.getAuditLogsByEntity(entityType, entityId);

    res.status(200).json(
      ResponseFormatter.success(logs, 'Audit logs retrieved successfully')
    );
  } catch (error) {
    log.error('getAuditLogsByEntity error', { error: error.message });
    res.status(500).json(
      ResponseFormatter.error(`Failed to get audit logs: ${error.message}`, 500)
    );
  }
};

exports.getAuditLogsByActor = async (req, res) => {
  try {
    const { actorId } = req.params;

    log.info('Get audit logs by actor', { actorId });

    const logs = await auditLogServices.getAuditLogsByActor(actorId);

    res.status(200).json(
      ResponseFormatter.success(logs, 'Audit logs retrieved successfully')
    );
  } catch (error) {
    log.error('getAuditLogsByActor error', { error: error.message });
    res.status(500).json(
      ResponseFormatter.error(`Failed to get audit logs: ${error.message}`, 500)
    );
  }
};

exports.getAuditStats = async (req, res) => {
  try {
    log.info('Get audit stats');

    const stats = await auditLogServices.getAuditStats();

    res.status(200).json(
      ResponseFormatter.success(stats, 'Audit statistics retrieved successfully')
    );
  } catch (error) {
    log.error('getAuditStats error', { error: error.message });
    res.status(500).json(
      ResponseFormatter.error(`Failed to get audit statistics: ${error.message}`, 500)
    );
  }
};

exports.cleanupOldAuditLogs = async (req, res) => {
  try {
    const daysOld = parseInt(req.query.daysOld) || 365;

    log.info('Cleanup old audit logs', { daysOld });

    const result = await auditLogServices.cleanupOldAuditLogs(daysOld);

    // Audit L2: aksi cleanup audit log itu sendiri harus tercatat agar ada
    // jejak siapa menghapus berapa baris (fire-and-forget, jangan gagalkan response).
    auditLogServices
      .createAuditLog({
        entityType: 'USER',
        action: 'HARD_DELETE',
        entityId: 0,
        actorId: req.user?.userId,
        actorName: req.user?.name,
        actorRole: req.user?.role,
        ip: req.ip,
        userAgent: req.headers?.['user-agent'],
        metadata: {
          operation: 'AUDIT_LOG_CLEANUP',
          daysOld,
          deleted: result?.count ?? result,
        },
      })
      .catch((e) => log.error('Failed to log audit cleanup', { error: e.message }));

    res.status(200).json(
      ResponseFormatter.success(
        result,
        `Cleaned up audit logs older than ${daysOld} days`
      )
    );
  } catch (error) {
    log.error('cleanupOldAuditLogs error', { error: error.message });
    res.status(500).json(
      ResponseFormatter.error(`Failed to cleanup audit logs: ${error.message}`, 500)
    );
  }
};


