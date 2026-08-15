const {
  ANON_USER,
  shouldMaskReporter,
  anonymizeReport,
  anonymizeReportList,
  anonymizeChatMessage,
} = require('../../../src/utils/anonymizer');

const REPORTER_ID = 42;
const ADMIN_ID = 7;

function makeReport(overrides = {}) {
  return {
    id: 1,
    isAnonymous: true,
    userId: REPORTER_ID,
    user: { id: REPORTER_ID, name: 'Budi', nim: '12345678', email: 'budi@kampus.ac.id' },
    messages: [
      { id: 10, content: 'pesan saya', senderId: REPORTER_ID, sender: { id: REPORTER_ID, name: 'Budi', role: 'MAHASISWA' } },
      { id: 11, content: 'balasan admin', senderId: ADMIN_ID, sender: { id: ADMIN_ID, name: 'Pak Admin', role: 'ADMIN' } },
    ],
    ...overrides,
  };
}

describe('shouldMaskReporter', () => {
  test('returns false when report is not anonymous', () => {
    expect(shouldMaskReporter({ isAnonymous: false, userId: 1 }, { userId: 2 })).toBe(false);
  });

  test('returns false when viewer IS the reporter', () => {
    expect(shouldMaskReporter({ isAnonymous: true, userId: 1 }, { userId: 1 })).toBe(false);
  });

  test('returns true for any other viewer (including admin)', () => {
    expect(shouldMaskReporter({ isAnonymous: true, userId: 1 }, { userId: 2, role: 'ADMIN' })).toBe(true);
    expect(shouldMaskReporter({ isAnonymous: true, userId: 1 }, { userId: 99 })).toBe(true);
  });

  test('returns true when viewer is missing', () => {
    expect(shouldMaskReporter({ isAnonymous: true, userId: 1 }, null)).toBe(true);
  });
});

describe('anonymizeReport', () => {
  test('does nothing when report is not anonymous', () => {
    const r = { isAnonymous: false, userId: REPORTER_ID, user: { id: 1, name: 'Budi' } };
    anonymizeReport(r, { userId: ADMIN_ID, role: 'ADMIN' });
    expect(r.user.name).toBe('Budi');
    expect(r.userId).toBe(REPORTER_ID);
  });

  test('does nothing for the reporter themselves', () => {
    const r = makeReport();
    anonymizeReport(r, { userId: REPORTER_ID });
    expect(r.user.name).toBe('Budi');
    expect(r.messages[0].sender.name).toBe('Budi');
  });

  test('masks reporter identity for admin viewer', () => {
    const r = makeReport();
    anonymizeReport(r, { userId: ADMIN_ID, role: 'ADMIN' });
    expect(r.user).toEqual(ANON_USER);
    expect(r.userId).toBeNull();
  });

  test('masks reporter messages but preserves admin messages', () => {
    const r = makeReport();
    anonymizeReport(r, { userId: ADMIN_ID, role: 'ADMIN' });
    expect(r.messages[0].sender.name).toBe('Anonim');
    expect(r.messages[0].sender.id).toBeNull();
    expect(r.messages[0].senderId).toBeNull();
    // Admin's own message untouched
    expect(r.messages[1].sender.name).toBe('Pak Admin');
    expect(r.messages[1].senderId).toBe(ADMIN_ID);
  });

  test('handles report with no messages array', () => {
    const r = { isAnonymous: true, userId: REPORTER_ID, user: { id: REPORTER_ID, name: 'Budi' } };
    anonymizeReport(r, { userId: ADMIN_ID, role: 'ADMIN' });
    expect(r.user).toEqual(ANON_USER);
  });

  test('returns null/undefined unchanged', () => {
    expect(anonymizeReport(null, { userId: 1 })).toBeNull();
    expect(anonymizeReport(undefined, { userId: 1 })).toBeUndefined();
  });
});

describe('anonymizeReportList', () => {
  test('masks each anonymous report independently', () => {
    const reports = [
      makeReport(),
      { id: 2, isAnonymous: false, userId: 99, user: { id: 99, name: 'Public' } },
    ];
    anonymizeReportList(reports, { userId: ADMIN_ID, role: 'ADMIN' });
    expect(reports[0].user).toEqual(ANON_USER);
    expect(reports[1].user.name).toBe('Public');
  });
});

describe('anonymizeChatMessage', () => {
  test('masks reporter-sent message for non-reporter viewer', () => {
    const report = { isAnonymous: true, userId: REPORTER_ID };
    const msg = { id: 10, senderId: REPORTER_ID, sender: { id: REPORTER_ID, name: 'Budi' } };
    anonymizeChatMessage(msg, report, { userId: ADMIN_ID, role: 'ADMIN' });
    expect(msg.sender.name).toBe('Anonim');
    expect(msg.senderId).toBeNull();
  });

  test('does not mask admin-sent message even when report is anonymous', () => {
    const report = { isAnonymous: true, userId: REPORTER_ID };
    const msg = { id: 11, senderId: ADMIN_ID, sender: { id: ADMIN_ID, name: 'Pak Admin' } };
    anonymizeChatMessage(msg, report, { userId: REPORTER_ID });
    expect(msg.sender.name).toBe('Pak Admin');
    expect(msg.senderId).toBe(ADMIN_ID);
  });

  test('reporter sees their own message unmasked', () => {
    const report = { isAnonymous: true, userId: REPORTER_ID };
    const msg = { id: 10, senderId: REPORTER_ID, sender: { id: REPORTER_ID, name: 'Budi' } };
    anonymizeChatMessage(msg, report, { userId: REPORTER_ID });
    expect(msg.sender.name).toBe('Budi');
    expect(msg.senderId).toBe(REPORTER_ID);
  });
});
