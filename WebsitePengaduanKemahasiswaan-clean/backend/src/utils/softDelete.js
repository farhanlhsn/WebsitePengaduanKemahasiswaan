// Utility functions for soft delete operations

/**
 * Soft delete utility untuk Prisma
 */
class SoftDeleteHelper {
  
  /**
   * Soft delete a record
   * @param {Object} model - Prisma model
   * @param {number} id - Record ID
   * @returns {Promise<Object>}
   */
  static async softDelete(model, id) {
    return await model.update({
      where: { id },
      data: { deletedAt: new Date() }
    });
  }

  /**
   * Restore a soft deleted record
   * @param {Object} model - Prisma model
   * @param {number} id - Record ID
   * @returns {Promise<Object>}
   */
  static async restore(model, id) {
    return await model.update({
      where: { id },
      data: { deletedAt: null }
    });
  }

  /**
   * Find many with soft delete filter
   * @param {Object} model - Prisma model
   * @param {Object} options - Query options
   * @param {boolean} includeDeleted - Include deleted records
   * @returns {Promise<Array>}
   */
  static async findMany(model, options = {}, includeDeleted = false) {
    const where = includeDeleted 
      ? options.where || {}
      : { ...options.where, deletedAt: null };

    return await model.findMany({
      ...options,
      where
    });
  }

  /**
   * Find unique with soft delete filter
   * @param {Object} model - Prisma model
   * @param {Object} options - Query options
   * @param {boolean} includeDeleted - Include deleted records
   * @returns {Promise<Object|null>}
   */
  static async findUnique(model, options = {}, includeDeleted = false) {
    if (!includeDeleted) {
      options.where = { ...options.where, deletedAt: null };
    }

    return await model.findUnique(options);
  }

  /**
   * Count records with soft delete filter
   * @param {Object} model - Prisma model
   * @param {Object} options - Query options
   * @param {boolean} includeDeleted - Include deleted records
   * @returns {Promise<number>}
   */
  static async count(model, options = {}, includeDeleted = false) {
    const where = includeDeleted 
      ? options.where || {}
      : { ...options.where, deletedAt: null };

    return await model.count({
      ...options,
      where
    });
  }

  /**
   * Permanently delete a record (hard delete)
   * @param {Object} model - Prisma model
   * @param {number} id - Record ID
   * @returns {Promise<Object>}
   */
  static async hardDelete(model, id) {
    return await model.delete({
      where: { id }
    });
  }

  /**
   * Clean up old soft deleted records
   * @param {Object} model - Prisma model
   * @param {number} daysOld - Days old threshold
   * @returns {Promise<Object>}
   */
  static async cleanupOldDeleted(model, daysOld = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    return await model.deleteMany({
      where: {
        deletedAt: {
          not: null,
          lt: cutoffDate
        }
      }
    });
  }
}

module.exports = SoftDeleteHelper; 