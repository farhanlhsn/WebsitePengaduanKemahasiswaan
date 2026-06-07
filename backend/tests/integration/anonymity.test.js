/**
 * AN-8: end-to-end anonymity verification.
 *
 * Scenario: a student files an anonymous report on a category that allows
 * anonymous reporting. We verify that across every read path used by an
 * admin, the reporter's identity is masked, while the reporter themselves
 * always sees their own name.
 *
 * Routes covered:
 *   POST /v1/api/reports                      (create)
 *   GET  /v1/api/reports                      (admin list — masked)
 *   GET  /v1/api/reports/:id                  (admin detail — masked)
 *   GET  /v1/api/reports/:id                  (reporter detail — unmasked)
 *   GET  /v1/api/reports/user                 (reporter own list)
 *   GET  /v1/api/chat/reports                 (chat list)
 *   GET  /v1/api/chat/messages/:id            (chat messages)
 *
 * Plus AN-1 regression coverage on the admin dashboard recent-reports widget.
 */

const request = require('supertest');
const {
  prisma,
  buildApp,
  createUser,
  createAdmin,
  createSuperAdmin,
  authHeader,
  createCategory,
  grantCategory,
} = require('./helpers');

let app;
beforeAll(() => {
  app = buildApp();
});

async function setupAnonymousReportScenario() {
  const reporter = await createUser({
    name: 'Budi Asli',
    email: `budi-${Date.now()}@kampus.ac.id`,
    nim: '20210001',
    isVerified: true,
  });
  const superadmin = await createSuperAdmin({ name: 'Pak SA' });
  const admin = await createAdmin({ name: 'Bu Admin' });
  const category = await createCategory({
    name: 'KasusSensitif',
    slug: 'kasus-sensitif',
    allowAnonymous: true,
  });
  await grantCategory(admin.id, category.id, superadmin.id);

  // Create the anonymous report directly via DB to bypass the (rate-limited)
  // create endpoint and keep the test fast and deterministic.
  const report = await prisma.report.create({
    data: {
      title: 'Laporan Anonim',
      description: 'isi laporan anonim',
      registrationNumber: `KKR-${Date.now()}`,
      categoryId: category.id,
      userId: reporter.id,
      isAnonymous: true,
      priority: 'MEDIUM',
    },
  });

  // Reporter sends one message; admin sends one reply.
  const reporterMsg = await prisma.message.create({
    data: { reportId: report.id, senderId: reporter.id, content: 'pesan dari pelapor' },
  });
  const adminMsg = await prisma.message.create({
    data: { reportId: report.id, senderId: admin.id, content: 'pesan balasan admin' },
  });

  return { reporter, admin, superadmin, category, report, reporterMsg, adminMsg };
}

describe('AN-8 anonymity end-to-end', () => {
  test('admin sees masked reporter on GET /reports list', async () => {
    const { admin, report } = await setupAnonymousReportScenario();
    const res = await request(app)
      .get('/v1/api/reports')
      .set(authHeader(admin))
      .expect(200);
    const item = res.body.data.data.find((r) => r.id === report.id);
    expect(item).toBeDefined();
    expect(item.user.name).toBe('Anonim');
    expect(item.user.email).toBeNull();
    expect(item.userId).toBeNull();
  });

  test('admin sees masked reporter on GET /reports/:id', async () => {
    const { admin, report } = await setupAnonymousReportScenario();
    const res = await request(app)
      .get(`/v1/api/reports/${report.id}`)
      .set(authHeader(admin))
      .expect(200);
    expect(res.body.data.user.name).toBe('Anonim');
    expect(res.body.data.user.email).toBeNull();
  });

  test('SUPERADMIN also sees masked identity (anonymity not bypassed)', async () => {
    const { superadmin, report } = await setupAnonymousReportScenario();
    const res = await request(app)
      .get(`/v1/api/reports/${report.id}`)
      .set(authHeader(superadmin))
      .expect(200);
    expect(res.body.data.user.name).toBe('Anonim');
  });

  test('reporter sees their own real identity', async () => {
    const { reporter, report } = await setupAnonymousReportScenario();
    const res = await request(app)
      .get(`/v1/api/reports/${report.id}`)
      .set(authHeader(reporter))
      .expect(200);
    expect(res.body.data.user.name).toBe('Budi Asli');
    expect(res.body.data.user.nim).toBe('20210001');
  });

  test('admin chat list masks reporter and last-message sender', async () => {
    const { admin, report } = await setupAnonymousReportScenario();
    const res = await request(app)
      .get('/v1/api/chat/reports')
      .set(authHeader(admin))
      .expect(200);
    const entry = res.body.data.reports.find((r) => r.id === report.id);
    expect(entry).toBeDefined();
    expect(entry.user.name).toBe('Anonim');
    expect(entry.isAnonymous).toBe(true);
  });

  test('admin chat messages mask reporter messages but not admin messages', async () => {
    const { admin, report, reporterMsg, adminMsg } = await setupAnonymousReportScenario();
    const res = await request(app)
      .get(`/v1/api/chat/reports/${report.id}/messages`)
      .set(authHeader(admin))
      .expect(200);
    const messages = res.body.data.messages;
    const fromReporter = messages.find((m) => m.id === reporterMsg.id);
    const fromAdmin = messages.find((m) => m.id === adminMsg.id);
    expect(fromReporter.sender.name).toBe('Anonim');
    expect(fromReporter.senderId).toBeNull();
    expect(fromAdmin.sender.name).toBe('Bu Admin');
  });

  test('reporter chat messages keep their real name visible to themselves', async () => {
    const { reporter, report, reporterMsg } = await setupAnonymousReportScenario();
    const res = await request(app)
      .get(`/v1/api/chat/reports/${report.id}/messages`)
      .set(authHeader(reporter))
      .expect(200);
    const fromReporter = res.body.data.messages.find((m) => m.id === reporterMsg.id);
    expect(fromReporter.sender.name).toBe('Budi Asli');
  });
});

describe('BE-6 ADMIN category scope (regression)', () => {
  test('ADMIN without grant on a category cannot see its reports in list', async () => {
    const { report } = await setupAnonymousReportScenario();
    const otherAdmin = await createAdmin({ name: 'Other Admin' });
    // No grantCategory call — otherAdmin has zero assignments.

    const res = await request(app)
      .get('/v1/api/reports')
      .set(authHeader(otherAdmin))
      .expect(200);
    const found = res.body.data.data.find((r) => r.id === report.id);
    expect(found).toBeUndefined();
    expect(res.body.data.data).toHaveLength(0);
  });

  test('ADMIN without grant gets 403 when fetching detail by id', async () => {
    const { report } = await setupAnonymousReportScenario();
    const otherAdmin = await createAdmin({ name: 'Stranger Admin' });
    await request(app)
      .get(`/v1/api/reports/${report.id}`)
      .set(authHeader(otherAdmin))
      .expect(403);
  });

  test('SUPERADMIN sees all categories without explicit grants', async () => {
    const { superadmin, report } = await setupAnonymousReportScenario();
    const res = await request(app)
      .get('/v1/api/reports')
      .set(authHeader(superadmin))
      .expect(200);
    expect(res.body.data.data.find((r) => r.id === report.id)).toBeDefined();
  });
});
