/**
 * Tests for AN-1 — admin dashboard "Recent Reports" widget masking.
 *
 * Before AN-1, `getRecentReports` returned `user.name` and `user.email`
 * directly from Prisma without going through the anonymizer, so anonymous
 * reports leaked the reporter's real identity to admins on the home dashboard.
 *
 * The fix selects `isAnonymous` + `userId` in the service query and runs the
 * anonymizer in the controller before sending the response. This test
 * confirms the controller-level masking applies to recent reports.
 */

jest.mock('../../../src/utils/logger', () => ({
  getLogger: () => ({ info: jest.fn(), warn: jest.fn(), error: jest.fn() }),
}));

const adminDashboardServices = require('../../../src/services/adminDashboardServices');
jest.mock('../../../src/services/adminDashboardServices');

const adminDashboardController = require('../../../src/controllers/adminDashboardControllers');

function makeRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('adminDashboardControllers.getDashboardStats anonymity', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('masks anonymous reports in recent.reports for admin viewer', async () => {
    adminDashboardServices.getDashboardStats.mockResolvedValue({
      stats: {},
      recent: {
        reports: [
          {
            id: 1,
            isAnonymous: true,
            userId: 42,
            user: { id: 42, name: 'Budi', email: 'budi@kampus.ac.id' },
            title: 'Kasus sensitif',
          },
          {
            id: 2,
            isAnonymous: false,
            userId: 99,
            user: { id: 99, name: 'Andi', email: 'andi@kampus.ac.id' },
            title: 'Permintaan biasa',
          },
        ],
      },
    });

    const req = { user: { userId: 7, role: 'ADMIN' } };
    const res = makeRes();
    await adminDashboardController.getDashboardStats(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    const payload = res.json.mock.calls[0][0];
    const reports = payload.data.recent.reports;

    // Anonymous report: identity masked to "Anonim"
    expect(reports[0].user.name).toBe('Anonim');
    expect(reports[0].user.email).toBeNull();
    expect(reports[0].userId).toBeNull();

    // Non-anonymous report: identity preserved
    expect(reports[1].user.name).toBe('Andi');
    expect(reports[1].user.email).toBe('andi@kampus.ac.id');
  });

  test('does not mask when reporter views their own anonymous report', async () => {
    // Edge case: even on the admin dashboard, if the viewer happens to be the
    // reporter (e.g. an admin who also filed a report and views the widget),
    // they see their own real identity.
    adminDashboardServices.getDashboardStats.mockResolvedValue({
      recent: {
        reports: [
          {
            id: 1,
            isAnonymous: true,
            userId: 42,
            user: { id: 42, name: 'Budi', email: 'budi@kampus.ac.id' },
          },
        ],
      },
    });

    const req = { user: { userId: 42, role: 'ADMIN' } };
    const res = makeRes();
    await adminDashboardController.getDashboardStats(req, res);

    const reports = res.json.mock.calls[0][0].data.recent.reports;
    expect(reports[0].user.name).toBe('Budi');
  });

  test('handles missing recent.reports gracefully', async () => {
    adminDashboardServices.getDashboardStats.mockResolvedValue({});
    const req = { user: { userId: 7, role: 'ADMIN' } };
    const res = makeRes();
    await adminDashboardController.getDashboardStats(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
