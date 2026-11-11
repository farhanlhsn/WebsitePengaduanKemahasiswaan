/**
 * Nilai dari pengguna (nama, judul laporan, alasan) di-escape sebelum masuk
 * template HTML email, supaya tidak bisa menyisipkan tautan phishing ke email
 * resmi kampus seperti email reset password.
 */

jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({
    sendMail: jest.fn().mockResolvedValue({ messageId: 'stub' }),
  })),
}));

const emailService = require('../../../src/services/emailService');

const PAYLOAD = 'X</strong><a href="https://phish.invalid">Reset Password</a>';

describe('emailService escapes user-controlled values', () => {
  let sendEmailSpy;

  beforeEach(() => {
    sendEmailSpy = jest.spyOn(emailService, 'sendEmail').mockResolvedValue({ messageId: 'spy' });
  });

  afterEach(() => sendEmailSpy.mockRestore());

  function renderedHtml() {
    return sendEmailSpy.mock.calls[0][2];
  }

  test('password reset email: name is escaped, reset link intact', async () => {
    await emailService.sendPasswordResetEmail('v@kampus.ac.id', PAYLOAD, 'https://app.invalid/reset?token=abc');
    const html = renderedHtml();
    expect(html).not.toContain('<a href="https://phish.invalid">');
    expect(html).toContain('X&lt;/strong&gt;&lt;a href=&quot;https://phish.invalid&quot;&gt;');
    expect(html).toContain('href="https://app.invalid/reset?token=abc"');
  });

  test('chat notification: report title and sender name are escaped', async () => {
    await emailService.notifyNewMessage('a@kampus.ac.id', 'Admin', PAYLOAD, 'AK/01', PAYLOAD, {
      isAnonymous: false,
      senderRole: 'MAHASISWA',
    });
    expect(renderedHtml()).not.toContain('<a href="https://phish.invalid">');
  });

  test('rejection email: reason is escaped', async () => {
    await emailService.sendRejectionEmail('a@kampus.ac.id', 'Budi', PAYLOAD);
    expect(renderedHtml()).not.toContain('<a href="https://phish.invalid">');
  });
});
