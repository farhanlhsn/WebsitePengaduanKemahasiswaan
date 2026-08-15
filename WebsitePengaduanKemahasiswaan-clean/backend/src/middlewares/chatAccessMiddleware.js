const { canAccessReport } = require('../utils/accessPolicy');
const ResponseFormatter = require('../utils/responseFormatter');

async function requireReportAccess(req, res, next) {
  try {
    const access = await canAccessReport(req.user, req.params.reportId);
    if (!access.allowed) {
      return res.status(403).json(ResponseFormatter.error('Akses ditolak.', 403));
    }
    req.reportAccess = access.report;
    next();
  } catch (error) {
    return res.status(500).json(ResponseFormatter.error('Access check failed', 500));
  }
}

module.exports = requireReportAccess;
