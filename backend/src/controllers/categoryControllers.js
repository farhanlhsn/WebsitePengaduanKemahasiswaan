const categoryServices = require('../services/categoryServices');
const ResponseFormatter = require('../utils/responseFormatter');

exports.getAllCategories = async (req, res) => {
  try {
    const includeDeleted = req.query.includeDeleted === 'true';
    const categories = await categoryServices.getAllCategories(includeDeleted);
    
    res.status(200).json(ResponseFormatter.success(categories, 'Categories retrieved successfully'));
  } catch (error) {
    console.error('getAllCategories error:', error.message);
    res.status(500).json(ResponseFormatter.error('Failed to get categories', 500));
  }
};

exports.getCategoriesWithReports = async (req, res) => {
  try {
    const includeDeleted = req.query.includeDeleted === 'true';
    const categories = await categoryServices.getCategoriesWithReports(includeDeleted);
    
    res.status(200).json(ResponseFormatter.success(categories, 'Categories with reports retrieved successfully'));
  } catch (error) {
    console.error('getCategoriesWithReports error:', error.message);
    res.status(500).json(ResponseFormatter.error('Failed to get categories with reports', 500));
  }
};

exports.getCategoryById = async (req, res) => {
  try {
    const categoryId = parseInt(req.params.id);
    const includeDeleted = req.query.includeDeleted === 'true';
    
    if (!categoryId || isNaN(categoryId)) {
      return res.status(400).json(ResponseFormatter.error('Invalid category ID provided', 400));
    }
    
    const category = await categoryServices.getCategoryById(categoryId, includeDeleted);
    res.status(200).json(ResponseFormatter.success(category, 'Category retrieved successfully'));
  } catch (error) {
    console.error('getCategoryById error:', error.message);
    res.status(404).json(ResponseFormatter.error('Category not found', 404));
  }
};

exports.getCategoryBySlug = async (req, res) => {
  try {
    const slug = req.params.slug;
    const includeDeleted = req.query.includeDeleted === 'true';
    
    if (!slug) {
      return res.status(400).json(ResponseFormatter.error('Category slug is required', 400));
    }
    
    const category = await categoryServices.getCategoryBySlug(slug, includeDeleted);
    res.status(200).json(ResponseFormatter.success(category, 'Category retrieved successfully'));
  } catch (error) {
    console.error('getCategoryBySlug error:', error.message);
    res.status(404).json(ResponseFormatter.error('Category not found', 404));
  }
};

exports.createCategory = async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name || name.trim() === '') {
      return res.status(400).json(ResponseFormatter.error('Category name is required', 400));
    }
    
    const category = await categoryServices.createCategory(req.body);
    res.status(201).json(ResponseFormatter.success(category, 'Category created successfully'));
  } catch (error) {
    console.error('createCategory error:', error.message);
    
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
    
    if (!categoryId || isNaN(categoryId)) {
      return res.status(400).json(ResponseFormatter.error('Invalid category ID provided', 400));
    }
    
    const category = await categoryServices.updateCategory(categoryId, req.body);
    res.status(200).json(ResponseFormatter.success(category, 'Category updated successfully'));
  } catch (error) {
    console.error('updateCategory error:', error.message);
    
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
    
    if (!categoryId || isNaN(categoryId)) {
      return res.status(400).json(ResponseFormatter.error('Invalid category ID provided', 400));
    }
    
    await categoryServices.deleteCategory(categoryId);
    res.status(200).json(ResponseFormatter.success(null, 'Category deleted successfully (soft delete)'));
  } catch (error) {
    console.error('deleteCategory error:', error.message);
    
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
    
    if (!categoryId || isNaN(categoryId)) {
      return res.status(400).json(ResponseFormatter.error('Invalid category ID provided', 400));
    }
    
    const category = await categoryServices.restoreCategory(categoryId);
    res.status(200).json(ResponseFormatter.success(category, 'Category restored successfully'));
  } catch (error) {
    console.error('restoreCategory error:', error.message);
    
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
    console.error('permanentDeleteCategory error:', error.message);
    
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
    res.status(200).json(ResponseFormatter.success(stats, 'Category statistics retrieved successfully'));
  } catch (error) {
    console.error('getCategoryStats error:', error.message);
    res.status(500).json(ResponseFormatter.error('Failed to get category statistics', 500));
  }
};

exports.searchCategories = async (req, res) => {
  try {
    const { q: searchTerm } = req.query;
    const includeDeleted = req.query.includeDeleted === 'true';
    
    if (!searchTerm || searchTerm.trim() === '') {
      return res.status(400).json(ResponseFormatter.error('Search term is required', 400));
    }
    
    const categories = await categoryServices.searchCategories(searchTerm, includeDeleted);
    res.status(200).json(ResponseFormatter.success(categories, `Found ${categories.length} categories matching "${searchTerm}"`));
  } catch (error) {
    console.error('searchCategories error:', error.message);
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
    const result = await categoryServices.cleanupOldDeletedCategories(daysOld);
    
    res.status(200).json(ResponseFormatter.success(result, `Cleaned up categories deleted more than ${daysOld} days ago`));
  } catch (error) {
    console.error('cleanupOldDeletedCategories error:', error.message);
    res.status(500).json(ResponseFormatter.error('Failed to cleanup old deleted categories', 500));
  }
};