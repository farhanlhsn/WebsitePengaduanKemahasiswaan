const prisma = require('../utils/prisma');
const SoftDeleteHelper = require('../utils/softDelete');
const { getLogger } = require('../utils/logger');
const log = getLogger('category:service');

class CategoryServices {
  async getCategoryById(categoryId, includeDeleted = false) {
    try {
      const category = await SoftDeleteHelper.findUnique(
        prisma.category,
        {
          where: { id: categoryId },
          select: {
            id: true,
            name: true,
            slug: true,
            createdAt: true,
            updatedAt: true,
            deletedAt: true
          },
        },
        includeDeleted
      );
      
      if (!category) {
        throw new Error('Category not found');
      }

      // Add report count manually
      const reportCount = await prisma.report.count({
        where: {
          categoryId: categoryId,
          ...(includeDeleted ? {} : { deletedAt: null })
        }
      });

      const result = {
        ...category,
        _count: { reports: reportCount }
      };
      log.info('getCategoryById success', { categoryId });
      return result;
    } catch (error) {
      log.warn('getCategoryById failed', { categoryId, error: error.message });
      throw new Error('Failed to get category by id');
    }
  }

  async getCategoryBySlug(slug, includeDeleted = false) {
    try {
      const category = await SoftDeleteHelper.findUnique(
        prisma.category,
        {
          where: { slug: slug },
          select: {
            id: true,
            name: true,
            slug: true,
            createdAt: true,
            updatedAt: true,
            deletedAt: true
          },
        },
        includeDeleted
      );
      
      if (!category) {
        throw new Error('Category not found');
      }

      // Add report count manually
      const reportCount = await prisma.report.count({
        where: {
          categoryId: category.id,
          ...(includeDeleted ? {} : { deletedAt: null })
        }
      });

      const result = {
        ...category,
        _count: { reports: reportCount }
      };
      log.info('getCategoryBySlug success', { slug });
      return result;
    } catch (error) {
      log.warn('getCategoryBySlug failed', { slug, error: error.message });
      throw new Error('Failed to get category by slug');
    }
  }

  async getAllCategories(includeDeleted = false) {
    try {
      log.info('getAllCategories', { includeDeleted });
      
      const categories = await SoftDeleteHelper.findMany(
        prisma.category,
        {
          select: {
            id: true,
            name: true,
            slug: true,
            createdAt: true,
            updatedAt: true,
            deletedAt: true,
          },
          orderBy: { createdAt: 'desc' }
        },
        includeDeleted
      );

      log.info('getAllCategories fetched', { count: categories.length });
      return categories;

    } catch (error) {
      log.error('getAllCategories error', { error: error.message });
      throw new Error('Failed to get categories');
    }
  }

  async getCategoriesWithReports(includeDeleted = false) {
    try {
      const categories = await SoftDeleteHelper.findMany(
        prisma.category,
        {
          select: {
            id: true,
            name: true,
            slug: true,
            createdAt: true,
            updatedAt: true,
            deletedAt: true,
            reports: {
              where: includeDeleted ? {} : { deletedAt: null },
              select: {
                id: true,
                title: true,
                status: true,
                createdAt: true
              },
              orderBy: { createdAt: 'desc' },
              take: 5 // Limit to 5 recent reports per category
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        includeDeleted
      );

      // Add report count manually for each category
      const categoriesWithCount = await Promise.all(
        categories.map(async (category) => {
          const reportCount = await prisma.report.count({
            where: {
              categoryId: category.id,
              ...(includeDeleted ? {} : { deletedAt: null })
            }
          });
          
          return {
            ...category,
            _count: { reports: reportCount }
          };
        })
      );

      log.info('getCategoriesWithReports', { count: categoriesWithCount.length });
      return categoriesWithCount;
    } catch (error) {
      log.warn('getCategoriesWithReports failed', { error: error.message });
      throw new Error('Failed to get categories with reports');
    }
  }

  generateSlug(text) {
    return text
      .toString() // Pastikan input adalah string
      .toLowerCase() // 1. Ubah ke huruf kecil
      .replace(/\s+/g, '-') // 2. Ganti spasi dengan -
      .replace(/[^\w\-]+/g, '') // 3. Hapus semua karakter non-kata (selain huruf, angka, _) dan non-hyphen
      .replace(/\-\-+/g, '-') // 4. Ganti beberapa - dengan satu -
      .replace(/^-+/, '') // 5. Hapus - di awal
      .replace(/-+$/, ''); // 6. Hapus - di akhir
  }

  async createCategory(categoryData) {
    try {
      // Check if category name already exists (including deleted ones)
      const existingCategory = await SoftDeleteHelper.findUnique(
        prisma.category,
        { where: { name: categoryData.name } },
        true // Include deleted
      );

      if (existingCategory) {
        if (existingCategory.deletedAt) {
          throw new Error('Category with this name exists but is deleted. Please restore or use different name.');
        } else {
          throw new Error('Category with this name already exists');
        }
      }

      const slug = this.generateSlug(categoryData.name);
      
      // Check if slug already exists
      const existingSlug = await SoftDeleteHelper.findUnique(
        prisma.category,
        { where: { slug: slug } },
        true
      );

      if (existingSlug) {
        throw new Error('Category slug already exists');
      }

      const newCategory = await prisma.category.create({
        data: {
          name: categoryData.name,
          slug: slug,
        },
      });
      
      log.info('createCategory success', { id: newCategory.id, name: newCategory.name });
      return newCategory;
    } catch (error) {
      log.warn('createCategory failed', { error: error.message });
      throw new Error(error.message || 'Failed to create category');
    }
  }

  async updateCategory(categoryId, categoryData) {
    try {
      // Check if category exists and not deleted - use simple findUnique instead of getCategoryById
      const existingCategory = await SoftDeleteHelper.findUnique(
        prisma.category,
        { where: { id: categoryId } },
        false // Don't include deleted
      );

      if (!existingCategory) {
        throw new Error('Category not found');
      }
      
      // Check if new name already exists (excluding current category)
      if (categoryData.name) {
        const nameConflict = await SoftDeleteHelper.findUnique(
          prisma.category,
          { 
            where: { 
              name: categoryData.name,
              NOT: { id: categoryId }
            } 
          },
          false
        );

        if (nameConflict) {
          throw new Error('Category with this name already exists');
        }
      }

      const updateData = { ...categoryData };
      if (categoryData.name) {
        updateData.slug = this.generateSlug(categoryData.name);
      }

      const updatedCategory = await prisma.category.update({
        where: { id: categoryId },
        data: {
          ...updateData,
          updatedAt: new Date()
        },
      });
      
      log.info('updateCategory success', { id: updatedCategory.id });
      return updatedCategory;
    } catch (error) {
      log.warn('updateCategory failed', { categoryId, error: error.message });
      throw new Error(error.message || 'Failed to update category');
    }
  }

  async deleteCategory(categoryId) {
    try {
      // Check if category has active reports
      const reportsCount = await SoftDeleteHelper.count(
        prisma.report,
        { where: { categoryId: categoryId } }
      );

      if (reportsCount > 0) {
        throw new Error(`Cannot delete category. It has ${reportsCount} active reports. Reports will be unlinked from category.`);
      }

      // Soft delete category
      const result = await SoftDeleteHelper.softDelete(prisma.category, categoryId);
      log.info('deleteCategory success', { categoryId });
      return result;
    } catch (error) {
      log.warn('deleteCategory failed', { categoryId, error: error.message });
      throw new Error(error.message || 'Failed to delete category');
    }
  }

  async restoreCategory(categoryId) {
    try {
      // Check if category exists in deleted state
      const category = await SoftDeleteHelper.findUnique(
        prisma.category,
        { where: { id: categoryId } },
        true
      );

      if (!category) {
        throw new Error('Category not found');
      }

      if (!category.deletedAt) {
        throw new Error('Category is not deleted');
      }

      // Check if name/slug conflicts with existing active categories
      const nameConflict = await SoftDeleteHelper.findUnique(
        prisma.category,
        { where: { name: category.name } },
        false
      );

      if (nameConflict) {
        throw new Error('Cannot restore: Another active category with the same name exists');
      }

      // Restore category
      const result = await SoftDeleteHelper.restore(prisma.category, categoryId);
      log.info('restoreCategory success', { categoryId });
      return result;
    } catch (error) {
      log.warn('restoreCategory failed', { categoryId, error: error.message });
      throw new Error(error.message || 'Failed to restore category');
    }
  }

  async permanentDeleteCategory(categoryId) {
    try {
      // Check if category has any reports (including deleted ones)
      const reportsCount = await SoftDeleteHelper.count(
        prisma.report,
        { where: { categoryId: categoryId } },
        true // Include deleted reports
      );

      if (reportsCount > 0) {
        throw new Error(`Cannot permanently delete category. It has ${reportsCount} reports (including deleted ones). Please remove all report associations first.`);
      }

      // Hard delete category
      const result = await SoftDeleteHelper.hardDelete(prisma.category, categoryId);
      log.info('permanentDeleteCategory success', { categoryId });
      return result;
    } catch (error) {
      log.warn('permanentDeleteCategory failed', { categoryId, error: error.message });
      throw new Error(error.message || 'Failed to permanently delete category');
    }
  }

  async getCategoryStats() {
    try {
      const total = await SoftDeleteHelper.count(prisma.category);
      const deleted = await SoftDeleteHelper.count(prisma.category, {}, true) - total;
      
      // Get all categories and calculate report counts
      const categories = await SoftDeleteHelper.findMany(
        prisma.category,
        {
          select: {
            id: true,
            name: true
          }
        }
      );

      // Calculate report counts for each category
      const categoriesWithCounts = await Promise.all(
        categories.map(async (category) => {
          const reportCount = await prisma.report.count({
            where: {
              categoryId: category.id,
              deletedAt: null
            }
          });
          
          return {
            ...category,
            _count: { reports: reportCount }
          };
        })
      );

      // Sort by report count and take top 5
      const topCategories = categoriesWithCounts
        .sort((a, b) => b._count.reports - a._count.reports)
        .slice(0, 5);

      const result = {
        total,
        deleted,
        active: total,
        topCategories
      };
      log.info('getCategoryStats success', { total, deleted });
      return result;
    } catch (error) {
      log.warn('getCategoryStats failed', { error: error.message });
      throw new Error('Failed to get category statistics');
    }
  }

  async cleanupOldDeletedCategories(daysOld = 90) {
    try {
      // Cleanup categories deleted more than specified days ago
      const result = await SoftDeleteHelper.cleanupOldDeleted(prisma.category, daysOld);
      log.info('cleanupOldDeletedCategories success', { daysOld });
      return result;
    } catch (error) {
      log.warn('cleanupOldDeletedCategories failed', { error: error.message });
      throw new Error('Failed to cleanup old deleted categories');
    }
  }

  async searchCategories(searchTerm, includeDeleted = false) {
    try {
      const categories = await SoftDeleteHelper.findMany(
        prisma.category,
        {
          where: {
            OR: [
              { name: { contains: searchTerm, mode: 'insensitive' } },
              { slug: { contains: searchTerm, mode: 'insensitive' } }
            ]
          },
          select: {
            id: true,
            name: true,
            slug: true,
            createdAt: true,
            updatedAt: true,
            deletedAt: true
          },
          orderBy: { name: 'asc' }
        },
        includeDeleted
      );

      // Add report count manually for each category
      const categoriesWithCount = await Promise.all(
        categories.map(async (category) => {
          const reportCount = await prisma.report.count({
            where: {
              categoryId: category.id,
              ...(includeDeleted ? {} : { deletedAt: null })
            }
          });
          
          return {
            ...category,
            _count: { reports: reportCount }
          };
        })
      );
      
      log.info('searchCategories success', { count: categoriesWithCount.length });
      return categoriesWithCount;
    } catch (error) {
      log.warn('searchCategories failed', { error: error.message });
      throw new Error('Failed to search categories');
    }
  }
}

module.exports = new CategoryServices();