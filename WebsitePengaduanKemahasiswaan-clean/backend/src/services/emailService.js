const nodemailer = require('nodemailer');
const { getLogger } = require('../utils/logger');
const log = getLogger('email:service');

/**
 * Email notification service for the complaint system.
 * Gracefully degrades if SMTP is not configured (logs warning, doesn't crash).
 */
class EmailService {
  constructor() {
    this.transporter = null;
    this.isConfigured = false;
  }

  initialize() {
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
      log.warn('Email service not configured — SMTP env vars missing. Notifications disabled.');
      return;
    }

    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: parseInt(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    this.isConfigured = true;
    log.info('Email service initialized', { host: process.env.SMTP_HOST });
  }

  /**
   * Send an email. Returns null on failure (non-blocking).
   */
  async sendEmail(to, subject, html) {
    if (!this.isConfigured) {
      log.warn('Email not sent — service not configured', { to, subject });
      // Log for local testing fallback
      log.info('============== MOCK EMAIL FALLBACK ==============');
      log.info(`To: ${to}`);
      log.info(`Subject: ${subject}`);
      log.info(`Content preview: ${html.substring(0, 500)}...`);
      log.info('=================================================');
      return null;
    }

    try {
      const result = await this.transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to,
        subject,
        html
      });
      log.info('Email sent successfully', { to, subject, messageId: result.messageId });
      return result;
    } catch (error) {
      log.error('Email send failed', { to, subject, error: error.message });
      return null;
    }
  }

  /**
   * Notify student when their report status changes.
   */
  async notifyStatusChange(userEmail, userName, reportTitle, regNumber, oldStatus, newStatus) {
    const statusLabels = {
      PENDING: 'Menunggu',
      IN_REVIEW: 'Sedang Ditinjau',
      IN_PROGRESS: 'Sedang Diproses',
      RESOLVED: 'Selesai',
      REJECTED: 'Ditolak',
      CANCELED: 'Dibatalkan'
    };

    const subject = `[Update] Laporan #${regNumber} — ${statusLabels[newStatus] || newStatus}`;
    const html = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #1976d2; padding: 20px; border-radius: 8px 8px 0 0;">
          <h2 style="color: white; margin: 0;">Pengaduan Kemahasiswaan UBH</h2>
        </div>
        <div style="padding: 24px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 8px 8px;">
          <p>Halo <strong>${userName}</strong>,</p>
          <p>Status laporan Anda telah diperbarui:</p>
          <table style="border-collapse: collapse; width: 100%; margin: 16px 0;">
            <tr>
              <td style="padding: 10px 12px; border: 1px solid #e0e0e0; background: #f5f5f5; width: 140px;"><strong>Judul</strong></td>
              <td style="padding: 10px 12px; border: 1px solid #e0e0e0;">${reportTitle}</td>
            </tr>
            <tr>
              <td style="padding: 10px 12px; border: 1px solid #e0e0e0; background: #f5f5f5;"><strong>No. Registrasi</strong></td>
              <td style="padding: 10px 12px; border: 1px solid #e0e0e0;">${regNumber}</td>
            </tr>
            <tr>
              <td style="padding: 10px 12px; border: 1px solid #e0e0e0; background: #f5f5f5;"><strong>Status Lama</strong></td>
              <td style="padding: 10px 12px; border: 1px solid #e0e0e0;">${statusLabels[oldStatus] || oldStatus}</td>
            </tr>
            <tr>
              <td style="padding: 10px 12px; border: 1px solid #e0e0e0; background: #f5f5f5;"><strong>Status Baru</strong></td>
              <td style="padding: 10px 12px; border: 1px solid #e0e0e0;"><strong style="color: #1976d2;">${statusLabels[newStatus] || newStatus}</strong></td>
            </tr>
          </table>
          <p>Silakan login ke sistem untuk melihat detail lebih lanjut.</p>
          <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
          <p style="color: #666; font-size: 12px; margin: 0;">
            Email ini dikirim otomatis oleh Sistem Pengaduan Kemahasiswaan — Universitas Bung Hatta.<br>
            Jangan membalas email ini.
          </p>
        </div>
      </div>
    `;

    return this.sendEmail(userEmail, subject, html);
  }

  /**
   * Notify student when their account is verified.
   */
  async notifyAccountVerified(userEmail, userName) {
    const subject = '✅ Akun Anda Telah Diverifikasi — Pengaduan Kemahasiswaan UBH';
    const html = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #2e7d32; padding: 20px; border-radius: 8px 8px 0 0;">
          <h2 style="color: white; margin: 0;">Pengaduan Kemahasiswaan UBH</h2>
        </div>
        <div style="padding: 24px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 8px 8px;">
          <p>Halo <strong>${userName}</strong>,</p>
          <p>Selamat! Akun Anda telah <strong>diverifikasi</strong> oleh admin.</p>
          <p>Anda sekarang dapat:</p>
          <ul>
            <li>Login ke sistem pengaduan</li>
            <li>Mengajukan laporan pengaduan</li>
            <li>Memantau status laporan</li>
            <li>Berkomunikasi dengan admin melalui chat</li>
          </ul>
          <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
          <p style="color: #666; font-size: 12px; margin: 0;">
            Email ini dikirim otomatis oleh Sistem Pengaduan Kemahasiswaan — Universitas Bung Hatta.<br>
            Jangan membalas email ini.
          </p>
        </div>
      </div>
    `;

    return this.sendEmail(userEmail, subject, html);
  }

  /**
   * Notify student that their registration was rejected.
   */
  async sendRejectionEmail(userEmail, userName, reason) {
    const subject = '❌ Registrasi Ditolak — Pengaduan Kemahasiswaan UBH';
    const html = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #d32f2f; padding: 20px; border-radius: 8px 8px 0 0;">
          <h2 style="color: white; margin: 0;">Registrasi Ditolak</h2>
        </div>
        <div style="padding: 24px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 8px 8px;">
          <p>Halo <strong>${userName}</strong>,</p>
          <p>Mohon maaf, registrasi akun Anda telah <strong>ditolak</strong> oleh admin.</p>
          <p><strong>Alasan:</strong></p>
          <p style="background: #fff3f3; padding: 12px; border-left: 4px solid #d32f2f; border-radius: 4px;">
            ${reason}
          </p>
          <p>Jika Anda merasa ini adalah kesalahan, silakan daftar ulang dengan data yang benar
          atau hubungi admin kampus untuk informasi lebih lanjut.</p>
          <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
          <p style="color: #666; font-size: 12px; margin: 0;">
            Sistem Pengaduan Kemahasiswaan — Universitas Bung Hatta
          </p>
        </div>
      </div>
    `;

    return this.sendEmail(userEmail, subject, html);
  }

  /**
   * Send password reset email with link.
   */
  async sendPasswordResetEmail(userEmail, userName, resetUrl) {
    const subject = 'Reset Password — Pengaduan Kemahasiswaan UBH';
    const html = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #d32f2f; padding: 20px; border-radius: 8px 8px 0 0;">
          <h2 style="color: white; margin: 0;">Reset Password</h2>
        </div>
        <div style="padding: 24px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 8px 8px;">
          <p>Halo <strong>${userName}</strong>,</p>
          <p>Kami menerima permintaan untuk mereset password akun Anda.</p>
          <p>Klik tombol di bawah untuk mengatur password baru:</p>
          <div style="text-align: center; margin: 24px 0;">
            <a href="${resetUrl}" style="display: inline-block; padding: 14px 28px; 
               background: #1976d2; color: white; text-decoration: none; border-radius: 6px;
               font-weight: bold; font-size: 16px;">
              Reset Password
            </a>
          </div>
          <p style="color: #666; font-size: 14px;">
            Link ini berlaku selama <strong>1 jam</strong>. Setelah itu, Anda perlu meminta link baru.
          </p>
          <p style="color: #666; font-size: 14px;">
            Jika Anda tidak meminta reset password, abaikan email ini. Akun Anda tetap aman.
          </p>
          <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
          <p style="color: #999; font-size: 11px;">
            Jika tombol tidak berfungsi, salin link berikut ke browser:<br>
            <a href="${resetUrl}" style="color: #1976d2; word-break: break-all;">${resetUrl}</a>
          </p>
          <p style="color: #666; font-size: 12px; margin: 0;">
            Sistem Pengaduan Kemahasiswaan — Universitas Bung Hatta
          </p>
        </div>
      </div>
    `;

    return this.sendEmail(userEmail, subject, html);
  }

  /**
   * Notify a recipient when a new chat message is received on a report.
   *
   * Anonymity-aware: when `options.isAnonymous === true` and the sender is the
   * report's reporter (i.e. NOT an admin), the displayed sender name is forced
   * to "Anonim" so the email body cannot leak the reporter's real name to
   * other parties.
   *
   * Callers MUST pass `options.isAnonymous` (the report's flag) and
   * `options.senderRole` so this helper can apply the correct policy. Passing
   * neither is treated as the safe default (no anonymity assumed, real name
   * preserved as before for backward compatibility).
   *
   * @param {string} userEmail
   * @param {string} userName
   * @param {string} reportTitle
   * @param {string} regNumber
   * @param {string} senderName - Real sender name as captured at send time.
   * @param {{ isAnonymous?: boolean, senderRole?: 'ADMIN' | 'MAHASISWA' | string }} [options]
   */
  async notifyNewMessage(userEmail, userName, reportTitle, regNumber, senderName, options = {}) {
    const { isAnonymous = false, senderRole } = options;
    // Mask sender name if the report is anonymous AND the sender is the reporter.
    // Admin senders keep their real names because their identity is not protected.
    const displaySenderName =
      isAnonymous && senderRole && senderRole !== 'ADMIN' ? 'Anonim' : senderName;

    const subject = `[Pesan Baru] Laporan #${regNumber} — ${reportTitle}`;
    const html = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #1976d2; padding: 20px; border-radius: 8px 8px 0 0;">
          <h2 style="color: white; margin: 0;">Pengaduan Kemahasiswaan UBH</h2>
        </div>
        <div style="padding: 24px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 8px 8px;">
          <p>Halo <strong>${userName}</strong>,</p>
          <p>Anda menerima pesan baru dari <strong>${displaySenderName}</strong> pada laporan:</p>
          <p style="background: #f5f5f5; padding: 12px; border-radius: 4px;">
            <strong>${reportTitle}</strong> (${regNumber})
          </p>
          <p>Silakan login ke sistem untuk membaca dan membalas pesan.</p>
          <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
          <p style="color: #666; font-size: 12px; margin: 0;">
            Email ini dikirim otomatis oleh Sistem Pengaduan Kemahasiswaan — Universitas Bung Hatta.<br>
            Jangan membalas email ini.
          </p>
        </div>
      </div>
    `;

    return this.sendEmail(userEmail, subject, html);
  }
}

// Singleton instance
const emailService = new EmailService();
emailService.initialize();

module.exports = emailService;
