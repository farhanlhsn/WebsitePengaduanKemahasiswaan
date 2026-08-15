/**
 * Tests for atomic report status transitions (audit finding B1).
 *
 * updateReportStatus harus memakai update kondisional
 * (WHERE id AND status = expected) sehingga dua proses konkuren tidak bisa
 * saling menimpa transisi status.
 */

jest.mock('../../../src/utils/prisma', () => ({
  report: {
    updateMany: jest.fn(),
    findUnique: jest.fn(),
  },
  category: { findFirst: jest.fn() },
}));
jest.mock('../../../src/utils/softDelete', () => ({
  findUnique: jest.fn(),
  findMany: jest.fn(),
  softDelete: jest.fn(),
  restore: jest.fn(),
}));
jest.mock('../../../src/utils/registrationGenerator', () => ({
  generateRegistrationNumber: jest.fn(),
}));
jest.mock('../../../src/utils/logger', () => ({
  getLogger: () => ({ info: jest.fn(), warn: jest.fn(), error: jest.fn() }),
}));

const prisma = require('../../../src/utils/prisma');
const ReportServices = require('../../../src/services/reportServices');

beforeEach(() => {
  jest.clearAllMocks();
  prisma.report.findUnique.mockResolvedValue({
    id: 1,
    status: 'IN_REVIEW',
    title: 'T',
    registrationNumber: 'REG-1',
    userId: 9,
  });
});

describe('updateReportStatus conditional update (audit B1)', () => {
  test('includes expected status in WHERE clause', async () => {
    prisma.report.updateMany.mockResolvedValue({ count: 1 });

    await ReportServices.updateReportStatus(1, 'IN_PROGRESS', 'IN_REVIEW');

    const args = prisma.report.updateMany.mock.calls[0][0];
    expect(args.where).toEqual({ id: 1, deletedAt: null, status: 'IN_REVIEW' });
    expect(args.data.status).toBe('IN_PROGRESS');
  });

  test('throws 409-style error when no row matched (status changed concurrently)', async () => {
    prisma.report.updateMany.mockResolvedValue({ count: 0 });

    await expect(
      ReportServices.updateReportStatus(1, 'IN_PROGRESS', 'IN_REVIEW')
    ).rejects.toMatchObject({ statusCode: 409 });
  });

  test('sets closedAt for RESOLVED/REJECTED/CANCELED', async () => {
    prisma.report.updateMany.mockResolvedValue({ count: 1 });

    await ReportServices.updateReportStatus(1, 'RESOLVED', 'IN_PROGRESS');
    expect(prisma.report.updateMany.mock.calls[0][0].data.closedAt).toBeInstanceOf(Date);

    await ReportServices.updateReportStatus(1, 'REJECTED', 'IN_PROGRESS');
    expect(prisma.report.updateMany.mock.calls[1][0].data.closedAt).toBeInstanceOf(Date);

    await ReportServices.updateReportStatus(1, 'CANCELED', 'PENDING');
    expect(prisma.report.updateMany.mock.calls[2][0].data.closedAt).toBeInstanceOf(Date);
  });

  test('does not set closedAt for non-closing statuses', async () => {
    prisma.report.updateMany.mockResolvedValue({ count: 1 });

    await ReportServices.updateReportStatus(1, 'IN_REVIEW', 'PENDING');
    expect(prisma.report.updateMany.mock.calls[0][0].data.closedAt).toBeUndefined();
  });

  test('works without expectedStatus (backward compat)', async () => {
    prisma.report.updateMany.mockResolvedValue({ count: 1 });

    await ReportServices.updateReportStatus(1, 'IN_REVIEW');
    const args = prisma.report.updateMany.mock.calls[0][0];
    expect(args.where.status).toBeUndefined();
  });
});
