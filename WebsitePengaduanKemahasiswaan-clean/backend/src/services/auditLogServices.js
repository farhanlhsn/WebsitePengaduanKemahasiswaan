const prisma = require('../utils/prisma');
const { getLogger } = require('../utils/logger');

const log = getLogger('audit:service');

class AuditLogServices {
  /**
   * Create an audit log entry
   * @param {Object} data - { entityType, action, entityId, actorId, actorRole, ip, userAgent, metadata }
   */
  async createAuditLog(data) {
    try {
      const { entityType, action, entityId, actorId, actorName, actorRole, ip, userAgent, metadata } = data;

      const auditLog = await prisma.auditLog.create({
        data: {
          entityType,
          action,
          entityId,
          actorId,
          actorName: actorName || null,
          actorRole,
          ip: ip || null,
          userAgent: userAgent || null,
          metadata: metadata || null,
        },
      });

      log.info('Audit log created', {
        id: auditLog.id,
        entityType,
        action,
        entityId,
        actorId,
      });

      return auditLog;
    } catch (error) {
      log.error('createAuditLog failed', { error: error.message, data });
      throw new Error(`Failed to create audit log: ${error.message}`);
    }
  }

  /**
   * Get all audit logs with pagination and filters
   * @param {Object} filters - { entityType, action, actorId, limit, offset, startDate, endDate }
   */
  async getAuditLogs(filters = {}) {
    try {
      const {
        entityType,
        action,
        actorId,
        entityId,
        limit = 50,
        offset = 0,
        startDate,
        endDate,
      } = filters;

      const where = {};

      if (entityType) where.entityType = entityType;
      if (action) where.action = action;
      if (actorId) where.actorId = parseInt(actorId);
      if (entityId) where.entityId = parseInt(entityId);

      // Date range filter
      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = new Date(startDate);
        if (endDate) where.createdAt.lte = new Date(endDate);
      }

      const [logs, total] = await Promise.all([
        prisma.auditLog.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take: parseInt(limit),
          skip: parseInt(offset),
        }),
        prisma.auditLog.count({ where }),
      ]);

      log.info('getAuditLogs success', { total, limit, offset });

      return {
        logs,
        pagination: {
          total,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: offset + logs.length < total,
        },
      };
    } catch (error) {
      log.error('getAuditLogs failed', { error: error.message });
      throw new Error(`Failed to get audit logs: ${error.message}`);
    }
  }

  /**
   * Get audit logs by entity (e.g., all logs for a specific user or report)
   * @param {string} entityType - USER or REPORT
   * @param {number} entityId - ID of the entity
   */
  async getAuditLogsByEntity(entityType, entityId) {
    try {
      const logs = await prisma.auditLog.findMany({
        where: {
          entityType,
          entityId: parseInt(entityId),
        },
        orderBy: { createdAt: 'desc' },
      });

      log.info('getAuditLogsByEntity success', { entityType, entityId, count: logs.length });

      return logs;
    } catch (error) {
      log.error('getAuditLogsByEntity failed', { error: error.message });
      throw new Error(`Failed to get audit logs by entity: ${error.message}`);
    }
  }

  /**
   * Get audit logs by actor (admin user)
   * @param {number} actorId - ID of the admin user
   */
  async getAuditLogsByActor(actorId) {
    try {
      const logs = await prisma.auditLog.findMany({
        where: {
          actorId: parseInt(actorId),
        },
        orderBy: { createdAt: 'desc' },
      });

      log.info('getAuditLogsByActor success', { actorId, count: logs.length });

      return logs;
    } catch (error) {
      log.error('getAuditLogsByActor failed', { error: error.message });
      throw new Error(`Failed to get audit logs by actor: ${error.message}`);
    }
  }

  /**
   * Get audit log statistics
   */
  async getAuditStats() {
    try {
      const [totalLogs, byEntityType, byAction, recentLogs] = await Promise.all([
        prisma.auditLog.count(),
        prisma.auditLog.groupBy({
          by: ['entityType'],
          _count: true,
        }),
        prisma.auditLog.groupBy({
          by: ['action'],
          _count: true,
        }),
        prisma.auditLog.findMany({
          take: 10,
          orderBy: { createdAt: 'desc' },
        }),
      ]);

      const stats = {
        total: totalLogs,
        byEntityType: byEntityType.reduce((acc, item) => {
          acc[item.entityType] = item._count;
          return acc;
        }, {}),
        byAction: byAction.reduce((acc, item) => {
          acc[item.action] = item._count;
          return acc;
        }, {}),
        recentLogs,
      };

      log.info('getAuditStats success', { total: totalLogs });

      return stats;
    } catch (error) {
      log.error('getAuditStats failed', { error: error.message });
      throw new Error(`Failed to get audit stats: ${error.message}`);
    }
  }

  /**
   * Clean up old audit logs (older than specified days)
   * @param {number} daysOld - Delete logs older than this many days (default: 365)
   */
  async cleanupOldAuditLogs(daysOld = 365) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const result = await prisma.auditLog.deleteMany({
        where: {
          createdAt: {
            lt: cutoffDate,
          },
        },
      });

      log.info('cleanupOldAuditLogs success', { daysOld, deleted: result.count });

      return {
        deleted: result.count,
        cutoffDate,
      };
    } catch (error) {
      log.error('cleanupOldAuditLogs failed', { error: error.message });
      throw new Error(`Failed to cleanup old audit logs: ${error.message}`);
    }
  }
}

module.exports = new AuditLogServices();

