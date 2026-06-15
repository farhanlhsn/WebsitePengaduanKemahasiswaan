/**
 * Tests for AN-7 — anonymity-aware sender naming in chat email notifications.
 *
 * `notifyNewMessage` accepts an `options` object so callers can tell the
 * helper whether the parent report is anonymous AND whether the sender is
 * the reporter (whose identity must be masked) or an admin (whose identity
 * is never masked). The HTML body must reflect those rules.
 */

// nodemailer is heavy and not needed for these tests — stub it.
jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({
    sendMail: jest.fn().mockResolvedValue({ messageId: 'stub' }),
  })),
}));

const emailService = require('../../../src/services/emailService');

describe('emailService.notifyNewMessage anonymity handling', () => {
  let sendEmailSpy;

  beforeEach(() => {
    // Spy on the underlying transport call so we can inspect the rendered HTML.
    sendEmailSpy = jest
      .spyOn(emailService, 'sendEmail')
      .mockResolvedValue({ messageId: 'spy' });
  });

  afterEach(() => {
    sendEmailSpy.mockRestore();
  });

  test('non-anonymous report: real sender name appears in the body', async () => {
    await emailService.notifyNewMessage(
      'budi@kampus.ac.id',
      'Budi',
      'Permasalahan kelas',
      'AKD-2026-0001',
      'Pak Admin',
      { isAnonymous: false, senderRole: 'ADMIN' }
    );
    const html = sendEmailSpy.mock.calls[0][2];
    expect(html).toContain('Pak Admin');
    expect(html).not.toContain('Anonim');
  });

  test('anonymous report, sender is the reporter (MAHASISWA): name is masked to Anonim', async () => {
    await emailService.notifyNewMessage(
      'admin@kampus.ac.id',
      'Pak Admin',
      'Kasus sensitif',
      'KKR-2026-0001',
      'Budi',
      { isAnonymous: true, senderRole: 'MAHASISWA' }
    );
    const html = sendEmailSpy.mock.calls[0][2];
    expect(html).toContain('Anonim');
    expect(html).not.toContain('Budi');
  });

  test('anonymous report, sender is admin: real admin name preserved', async () => {
    // Admin replying on an anonymous report still signs with their real name.
    // The reporter knows who they are talking to; only the reporter is masked.
    await emailService.notifyNewMessage(
      'budi@kampus.ac.id',
      'Anonim', // reporter recipient — recipient name is up to caller
      'Kasus sensitif',
      'KKR-2026-0001',
      'Pak Admin',
      { isAnonymous: true, senderRole: 'ADMIN' }
    );
    const html = sendEmailSpy.mock.calls[0][2];
    expect(html).toContain('Pak Admin');
  });

  test('backward compatibility: omitting options preserves real sender name', async () => {
    // Existing callers (if any) that don't pass options must keep working.
    await emailService.notifyNewMessage(
      'budi@kampus.ac.id',
      'Budi',
      'General',
      'AKD-2026-0001',
      'Pak Admin'
    );
    const html = sendEmailSpy.mock.calls[0][2];
    expect(html).toContain('Pak Admin');
    expect(html).not.toContain('Anonim');
  });
});
