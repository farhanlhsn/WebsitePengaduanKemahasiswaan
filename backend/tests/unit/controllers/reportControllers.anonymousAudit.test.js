/**
 * Tests for AN-6 — in-memory rate-limit cache for VIEW_ANONYMOUS audit logs.
 *
 * The cache prevents an admin who refreshes or polls an anonymous report's
 * detail page from creating dozens of redundant audit rows in seconds. We
 * verify:
 *   - first call records (returns true)
 *   - subsequent calls within the window are suppressed (return false)
 *   - calls after the window elapses record again
 *   - different (admin, report) pairs are tracked independently
 */

// Mock everything the controller pulls in so we can require the module
// without booting the world.
jest.mock('../../../src/services/reportServices', () => ({}));
jest.mock('../../../src/services/auditLogServices', () => ({ createAuditLog: jest.fn() }));
jest.mock('../../../src/services/emailService', () => ({}));
jest.mock('../../../src/utils/prisma', () => ({}));
jest.mock('../../../src/utils/anonymizer', () => ({
  anonymizeReport: jest.fn((r) => r),
  anonymizeReportList: jest.fn((r) => r),
}));

const reportControllers = require('../../../src/controllers/reportControllers');
const { shouldRecordAnonViewAudit, anonViewAuditCache, ANON_VIEW_AUDIT_WINDOW_MS } =
  reportControllers.__test;

describe('shouldRecordAnonViewAudit', () => {
  beforeEach(() => {
    anonViewAuditCache.clear();
  });

  test('first call for a (admin, report) pair returns true', async () => {
    expect(await shouldRecordAnonViewAudit(7, 100)).toBe(true);
  });

  test('subsequent call within window returns false', async () => {
    await shouldRecordAnonViewAudit(7, 100);
    expect(await shouldRecordAnonViewAudit(7, 100)).toBe(false);
    expect(await shouldRecordAnonViewAudit(7, 100)).toBe(false);
  });

  test('different report by same admin tracked independently', async () => {
    expect(await shouldRecordAnonViewAudit(7, 100)).toBe(true);
    expect(await shouldRecordAnonViewAudit(7, 200)).toBe(true);
  });

  test('different admin viewing same report tracked independently', async () => {
    expect(await shouldRecordAnonViewAudit(7, 100)).toBe(true);
    expect(await shouldRecordAnonViewAudit(8, 100)).toBe(true);
  });

  test('after window elapses, a new entry is recorded', async () => {
    await shouldRecordAnonViewAudit(7, 100);
    // Manually shift the cached timestamp into the past.
    anonViewAuditCache.set('7:100', Date.now() - ANON_VIEW_AUDIT_WINDOW_MS - 1);
    expect(await shouldRecordAnonViewAudit(7, 100)).toBe(true);
  });

  test('window is exactly 5 minutes', () => {
    expect(ANON_VIEW_AUDIT_WINDOW_MS).toBe(5 * 60 * 1000);
  });
});
