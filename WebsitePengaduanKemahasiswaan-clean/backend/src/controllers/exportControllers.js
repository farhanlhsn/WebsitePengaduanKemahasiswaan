const prisma = require('../utils/prisma');
const ResponseFormatter = require('../utils/responseFormatter');
const adminGovernanceServices = require('../services/adminGovernanceServices');
const { getLogger } = require('../utils/logger');

const log = getLogger('export:controller');

/**
 * Export reports to CSV format.
 * GET /v1/api/admin/export/reports?status=PENDING&startDate=...&endDate=...
 */
exports.exportReports = async (req, res) => {
  try {
    const { status, startDate, endDate, categoryId } = req.query;
    log.info('Export reports', { status, startDate, endDate, categoryId });

    const where = { deletedAt: null };
    if (status) where.status = status;
    if (categoryId) where.categoryId = parseInt(categoryId);
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const accessibleCategoryIds = await adminGovernanceServices.getAccessibleCategoryIds(req.user);
    if (accessibleCategoryIds !== null) {
      if (accessibleCategoryIds.length === 0) {
        where.categoryId = { in: [] };
      } else if (where.categoryId) {
        if (!accessibleCategoryIds.includes(where.categoryId)) {
          where.categoryId = { in: [] };
        }
      } else {
        where.categoryId = { in: accessibleCategoryIds };
      }
    }

    const headers = [
      'No', 'No. Registrasi', 'Judul', 'Deskripsi', 'Status', 'Prioritas',
      'Kategori', 'Pelapor', 'NIM', 'Email', 'Ditugaskan Ke',
      'Anonim', 'Tanggal Dibuat', 'Terakhir Update'
    ];

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="laporan_${formatDateFile(new Date())}.csv"`);
    res.status(200);
    res.write('\uFEFF');
    res.write(`${headers.join(',')}\n`);

    let cursor = null;
    let rowNumber = 1;
    const pageSize = 500;
    do {
      const reports = await prisma.report.findMany({
        where,
        select: {
          id: true,
          registrationNumber: true,
          title: true,
          description: true,
          status: true,
          priority: true,
          isAnonymous: true,
          createdAt: true,
          updatedAt: true,
          user: { select: { name: true, nim: true, email: true } },
          category: { select: { name: true } },
          assignedTo: { select: { name: true } },
        },
        orderBy: { id: 'asc' },
        take: pageSize,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      });

      for (const r of reports) {
        const row = [
          rowNumber++,
          r.registrationNumber,
          escapeCsv(r.title),
          escapeCsv(r.description.substring(0, 200)),
          r.status,
          r.priority,
          r.category?.name || '-',
          r.isAnonymous ? 'Anonim' : (r.user?.name || '-'),
          r.isAnonymous ? '-' : (r.user?.nim || '-'),
          r.isAnonymous ? '-' : (r.user?.email || '-'),
          r.assignedTo?.name || 'Belum ditugaskan',
          r.isAnonymous ? 'Ya' : 'Tidak',
          formatDate(r.createdAt),
          formatDate(r.updatedAt)
        ];
        res.write(`${row.join(',')}\n`);
      }

      cursor = reports.length === pageSize ? reports[reports.length - 1].id : null;
    } while (cursor);

    res.end();
  } catch (error) {
    log.error('exportReports error', { error: error.message });
    res.status(500).json(ResponseFormatter.error('Failed to export reports', 500));
  }
};

/**
 * Export users to CSV format.
 * GET /v1/api/admin/export/users
 */
exports.exportUsers = async (req, res) => {
  try {
    log.info('Export users');

    const headers = ['No', 'Nama', 'Email', 'NIM', 'Role', 'Terverifikasi', 'Jumlah Laporan', 'Tanggal Daftar'];

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="users_${formatDateFile(new Date())}.csv"`);
    res.status(200);
    res.write('\uFEFF');
    res.write(`${headers.join(',')}\n`);

    let cursor = null;
    let rowNumber = 1;
    const pageSize = 500;
    do {
      const users = await prisma.user.findMany({
        where: { deletedAt: null },
        select: {
          id: true, name: true, email: true, nim: true,
          role: true, isVerified: true, createdAt: true,
          _count: { select: { reports: true } }
        },
        orderBy: { id: 'asc' },
        take: pageSize,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      });

      for (const u of users) {
        const row = [
          rowNumber++,
          escapeCsv(u.name),
          u.email,
          u.nim || '-',
          u.role,
          u.isVerified ? 'Ya' : 'Tidak',
          u._count.reports,
          formatDate(u.createdAt)
        ];
        res.write(`${row.join(',')}\n`);
      }

      cursor = users.length === pageSize ? users[users.length - 1].id : null;
    } while (cursor);

    res.end();
  } catch (error) {
    log.error('exportUsers error', { error: error.message });
    res.status(500).json(ResponseFormatter.error('Failed to export users', 500));
  }
};

// Helper: escape CSV field
function escapeCsv(str) {
  if (!str) return '""';
  const escaped = str.replace(/"/g, '""').replace(/\n/g, ' ').replace(/\r/g, '');
  return `"${escaped}"`;
}

// Helper: format date for display
function formatDate(date) {
  if (!date) return '-';
  return new Date(date).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });
}

// Helper: format date for filename
function formatDateFile(date) {
  return date.toISOString().split('T')[0];
}
