const categoryServices = require('../services/categoryServices');
const ResponseFormatter = require('../utils/responseFormatter');
const { isSuperAdmin } = require('../utils/rbac');
const { getLogger } = require('../utils/logger');
const log = getLogger('category:controller');

function resolveIncludeDeleted(req) {
  const requested = req.query.includeDeleted === 'true' || req.query.includeDeleted === true;
  if (!requested) return false;
  return !!(req.user && isSuperAdmin(req.user));
}

exports.getAllCategories = async (req, res) => {
  try {
    const includeDeleted = resolveIncludeDeleted(req);
    log.info('Get all categories', { includeDeleted });
    const categories = await categoryServices.getAllCategories(includeDeleted);
    
    res.status(200).json(ResponseFormatter.success(categories, 'Categories retrieved successfully'));
  } catch (error) {
    log.error('getAllCategories error', { error: error.message });
    res.status(500).json(ResponseFormatter.error('Failed to get categories', 500));
  }
};

exports.getCategoriesWithReports = async (req, res) => {
  try {
    const includeDeleted = resolveIncludeDeleted(req);
    log.info('Get categories with reports', { includeDeleted });
    const categories = await categoryServices.getCategoriesWithReports(includeDeleted);
    
    res.status(200).json(ResponseFormatter.success(categories, 'Categories with reports retrieved successfully'));
  } catch (error) {
    log.error('getCategoriesWithReports error', { error: error.message });
    res.status(500).json(ResponseFormatter.error('Failed to get categories with reports', 500));
  }
};

exports.getCategoryById = async (req, res) => {
  try {
    const categoryId = parseInt(req.params.id);
    const includeDeleted = resolveIncludeDeleted(req);
    log.info('Get category by id', { id: categoryId, includeDeleted });
    
    if (!categoryId || isNaN(categoryId)) {
      return res.status(400).json(ResponseFormatter.error('Invalid category ID provided', 400));
    }
    
    const category = await categoryServices.getCategoryById(categoryId, includeDeleted);
    res.status(200).json(ResponseFormatter.success(category, 'Category retrieved successfully'));
  } catch (error) {
    log.warn('getCategoryById error', { error: error.message });
    res.status(404).json(ResponseFormatter.error('Category not found', 404));
  }
};

exports.getCategoryBySlug = async (req, res) => {
  try {
    const slug = req.params.slug;
    const includeDeleted = resolveIncludeDeleted(req);
    log.info('Get category by slug', { slug, includeDeleted });
    
    if (!slug) {
      return res.status(400).json(ResponseFormatter.error('Category slug is required', 400));
    }
    
    const category = await categoryServices.getCategoryBySlug(slug, includeDeleted);
    res.status(200).json(ResponseFormatter.success(category, 'Category retrieved successfully'));
  } catch (error) {
    log.warn('getCategoryBySlug error', { error: error.message });
    res.status(404).json(ResponseFormatter.error('Category not found', 404));
  }
};

exports.createCategory = async (req, res) => {
  try {
    const { name } = req.body;
    log.info('Create category', { name });
    
    if (!name || name.trim() === '') {
      return res.status(400).json(ResponseFormatter.error('Category name is required', 400));
    }
    
    const category = await categoryServices.createCategory(req.body);
    res.status(201).json(ResponseFormatter.success(category, 'Category created successfully'));
  } catch (error) {
    log.warn('createCategory error', { error: error.message });
    
    if (error.message.includes('already exists')) {
      res.status(409).json(ResponseFormatter.error(error.message, 409));
    } else {
      res.status(400).json(ResponseFormatter.error('Failed to create category', 400));
    }
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const categoryId = parseInt(req.params.id);
    log.info('Update category', { id: categoryId });
    
    if (!categoryId || isNaN(categoryId)) {
      return res.status(400).json(ResponseFormatter.error('Invalid category ID provided', 400));
    }
    
    const category = await categoryServices.updateCategory(categoryId, req.body);
    res.status(200).json(ResponseFormatter.success(category, 'Category updated successfully'));
  } catch (error) {
    log.warn('updateCategory error', { error: error.message });
    
    if (error.message.includes('already exists')) {
      res.status(409).json(ResponseFormatter.error(error.message, 409));
    } else if (error.message.includes('not found')) {
      res.status(404).json(ResponseFormatter.error('Category not found', 404));
    } else {
      res.status(400).json(ResponseFormatter.error('Failed to update category', 400));
    }
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const categoryId = parseInt(req.params.id);
    log.info('Delete category', { id: categoryId });
    
    if (!categoryId || isNaN(categoryId)) {
      return res.status(400).json(ResponseFormatter.error('Invalid category ID provided', 400));
    }
    
    await categoryServices.deleteCategory(categoryId);
    res.status(200).json(ResponseFormatter.success(null, 'Category deleted successfully (soft delete)'));
  } catch (error) {
    log.warn('deleteCategory error', { error: error.message });
    
    if (error.message.includes('has') && error.message.includes('reports')) {
      res.status(409).json(ResponseFormatter.error(error.message, 409));
    } else if (error.message.includes('not found')) {
      res.status(404).json(ResponseFormatter.error('Category not found', 404));
    } else {
      res.status(400).json(ResponseFormatter.error('Failed to delete category', 400));
    }
  }
};

exports.restoreCategory = async (req, res) => {
  try {
    const categoryId = parseInt(req.params.id);
    log.info('Restore category', { id: categoryId });
    
    if (!categoryId || isNaN(categoryId)) {
      return res.status(400).json(ResponseFormatter.error('Invalid category ID provided', 400));
    }
    
    const category = await categoryServices.restoreCategory(categoryId);
    res.status(200).json(ResponseFormatter.success(category, 'Category restored successfully'));
  } catch (error) {
    log.warn('restoreCategory error', { error: error.message });
    
    if (error.message.includes('not found')) {
      res.status(404).json(ResponseFormatter.error('Category not found', 404));
    } else if (error.message.includes('not deleted')) {
      res.status(400).json(ResponseFormatter.error('Category is not deleted', 400));
    } else if (error.message.includes('conflict')) {
      res.status(409).json(ResponseFormatter.error(error.message, 409));
    } else {
      res.status(400).json(ResponseFormatter.error('Failed to restore category', 400));
    }
  }
};

exports.permanentDeleteCategory = async (req, res) => {
  try {
    const categoryId = parseInt(req.params.id);
    log.info('Permanent delete category', { id: categoryId, role: req.user?.role });
    
    if (!categoryId || isNaN(categoryId)) {
      return res.status(400).json(ResponseFormatter.error('Invalid category ID provided', 400));
    }
    
    // Only allow ADMIN to permanently delete
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json(ResponseFormatter.error('Unauthorized: Admin access required', 403));
    }
    
    await categoryServices.permanentDeleteCategory(categoryId);
    res.status(200).json(ResponseFormatter.success(null, 'Category permanently deleted'));
  } catch (error) {
    log.warn('permanentDeleteCategory error', { error: error.message });
    
    if (error.message.includes('has') && error.message.includes('reports')) {
      res.status(409).json(ResponseFormatter.error(error.message, 409));
    } else if (error.message.includes('not found')) {
      res.status(404).json(ResponseFormatter.error('Category not found', 404));
    } else {
      res.status(400).json(ResponseFormatter.error('Failed to permanently delete category', 400));
    }
  }
};

exports.getCategoryStats = async (req, res) => {
  try {
    const stats = await categoryServices.getCategoryStats();
    log.info('Get category stats');
    res.status(200).json(ResponseFormatter.success(stats, 'Category statistics retrieved successfully'));
  } catch (error) {
    log.error('getCategoryStats error', { error: error.message });
    res.status(500).json(ResponseFormatter.error('Failed to get category statistics', 500));
  }
};

exports.searchCategories = async (req, res) => {
  try {
    const { q: searchTerm } = req.query;
    log.info('Search categories', { q: searchTerm });
    const includeDeleted = req.query.includeDeleted === 'true';
    
    if (!searchTerm || searchTerm.trim() === '') {
      return res.status(400).json(ResponseFormatter.error('Search term is required', 400));
    }
    
    const categories = await categoryServices.searchCategories(searchTerm, includeDeleted);
    res.status(200).json(ResponseFormatter.success(categories, `Found ${categories.length} categories matching "${searchTerm}"`));
  } catch (error) {
    log.error('searchCategories error', { error: error.message });
    res.status(500).json(ResponseFormatter.error('Failed to search categories', 500));
  }
};

exports.cleanupOldDeletedCategories = async (req, res) => {
  try {
    // Only allow ADMIN to cleanup
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json(ResponseFormatter.error('Unauthorized: Admin access required', 403));
    }
    
    const daysOld = parseInt(req.query.daysOld) || 90;
    log.info('Cleanup old deleted categories', { daysOld });
    const result = await categoryServices.cleanupOldDeletedCategories(daysOld);
    
    res.status(200).json(ResponseFormatter.success(result, `Cleaned up categories deleted more than ${daysOld} days ago`));
  } catch (error) {
    log.error('cleanupOldDeletedCategories error', { error: error.message });
    res.status(500).json(ResponseFormatter.error('Failed to cleanup old deleted categories', 500));
  }
};