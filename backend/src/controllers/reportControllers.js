const ReportServices = require('../services/reportServices');
const ResponseFormatter = require('../utils/responseFormatter');

// Admin: Get all reports paginated (with optional search & filter)
exports.getAllReportsPaginated = async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json(ResponseFormatter.error('Forbidden'));
    }

    const { limit = 10, lastItemId, search, createdAt, categoryId, ...rest } = req.query;
    let filters = { ...rest };
    const take = parseInt(limit, 10);
    
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
      lastItemId
    );
    res.status(200).json(ResponseFormatter.success(result));
  } catch (err) {
    res.status(500).json(ResponseFormatter.error(err.message));
  }
};

// Mahasiswa: Get all reports by userId paginated (with optional search & filter)
exports.getAllReportsByUserIdPaginated = async (req, res) => {
  try {
    const { limit = 10, lastItemId, search, createdAt, categoryId, ...rest } = req.query;
    let filters = { ...rest };
    const take = parseInt(limit, 10);
    
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
    const userId = req.user.userId;
    const result = await ReportServices.getAllReportsByUserIdPaginated(
      userId,
      filters,
      take,
      false,
      lastItemId
    );
    res.status(200).json(ResponseFormatter.success(result));
  } catch (err) {
    res.status(500).json(ResponseFormatter.error(err.message));
  }
};

// Get report by ID
exports.getReportById = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const includeDeleted = req.query.includeDeleted === 'true';
    const result = await ReportServices.getReportById(id, includeDeleted);
    res.status(200).json(ResponseFormatter.success(result));
  } catch (err) {
    res.status(404).json(ResponseFormatter.error(err.message));
  }
};

// Create report
exports.createReport = async (req, res) => {
  try {
    const reportData = { ...req.body, userId: req.user.userId };
    const result = await ReportServices.createReport(reportData);
    res.status(201).json(ResponseFormatter.success(result, 'Report created'));
  } catch (err) {
    res.status(400).json(ResponseFormatter.error(err.message));
  }
};

// Update report status
exports.updateReportStatus = async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json(ResponseFormatter.error('Forbidden'));
    }

    const id = parseInt(req.params.id, 10);
    const { status } = req.body;
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
    const result = await ReportServices.updateReportStatus(id, status);
    res.status(200).json(ResponseFormatter.success(result, 'Status updated'));
  } catch (err) {
    res.status(400).json(ResponseFormatter.error(err.message));
  }
};

// Restore report (soft delete restore)
exports.restoreReport = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const result = await ReportServices.restoreReport(id);
    res.status(200).json(ResponseFormatter.success(result, 'Report restored'));
  } catch (err) {
    res.status(400).json(ResponseFormatter.error(err.message));
  }
};

// Delete report (soft delete)
exports.deleteReport = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const result = await ReportServices.deleteReport(id);
    res.status(200).json(ResponseFormatter.success(result, 'Report deleted'));
  } catch (err) {
    res.status(400).json(ResponseFormatter.error(err.message));
  }
};

exports.getReportStats = async (req, res) => {
  try {
    // Only allow ADMIN to get report stats
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json(ResponseFormatter.error('Unauthorized: Admin access required', 403));
    }
    
    const stats = await ReportServices.getReportStats();
    res.status(200).json(ResponseFormatter.success(stats, 'Report statistics retrieved successfully'));
  } catch (error) {
    console.error('getReportStats error:', error.message);
    res.status(500).json(ResponseFormatter.error('Failed to get report statistics', 500));
  }
};