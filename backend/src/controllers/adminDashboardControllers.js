const adminDashboardServices = require('../services/adminDashboardServices');
const ResponseFormatter = require('../utils/responseFormatter');
const { anonymizeReportList } = require('../utils/anonymizer');
const { getLogger } = require('../utils/logger');

const log = getLogger('admin-dashboard:controller');

exports.getDashboardStats = async (req, res) => {
  try {
    log.info('Get admin dashboard stats');

    const stats = await adminDashboardServices.getDashboardStats(req.user);

    // Mask reporter identity on recent reports widget for anonymous reports.
    // Admins are NOT exempt — only the reporter themselves sees their identity.
    if (stats?.recent?.reports) {
      anonymizeReportList(stats.recent.reports, req.user);
    }

    res.status(200).json(
      ResponseFormatter.success(stats, 'Dashboard statistics retrieved successfully')
    );
  } catch (error) {
    log.error('getDashboardStats error', { error: error.message });
    res.status(500).json(
      ResponseFormatter.error(`Failed to get dashboard statistics: ${error.message}`, 500)
    );
  }
};


