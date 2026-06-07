const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const prisma = require('../utils/prisma');
const emailService = require('../services/emailService');
const ResponseFormatter = require('../utils/responseFormatter');
const { getLogger } = require('../utils/logger');
const { validatePassword } = require('../utils/passwordPolicy');
const { clearRefreshCookie } = require('../utils/refreshCookie');
const { hashToken } = require('../utils/tokenHash');

const log = getLogger('password-reset:controller');

/**
 * POST /auth/forgot-password
 * Request a password reset link via email.
 * Always returns success to prevent email enumeration.
 */
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    log.info('Forgot password request', { email });

    // Always return success message (prevent email enumeration)
    const successMessage = 'Jika email terdaftar, link reset password akan dikirim.';

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true, email: true, deletedAt: true }
    });

    // If user not found or deleted, still return success
    if (!user || user.deletedAt) {
      return res.json(ResponseFormatter.success(null, successMessage));
    }

    // Delete any existing reset tokens for this user
    await prisma.passwordResetToken.deleteMany({
      where: { userId: user.id }
    });

    // Generate secure random token
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = hashToken(token);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.passwordResetToken.create({
      data: { tokenHash, userId: user.id, expiresAt }
    });

    // Send reset email (fire-and-forget)
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${token}`;
    emailService.sendPasswordResetEmail(user.email, user.name, resetUrl)
      .catch(err => log.error('Failed to send reset email', { error: err.message }));

    log.info('Password reset token created', { userId: user.id });
    res.json(ResponseFormatter.success(null, successMessage));
  } catch (error) {
    log.error('forgotPassword error', { error: error.message });
    res.status(500).json(ResponseFormatter.error('Terjadi kesalahan. Silakan coba lagi.', 500));
  }
};

/**
 * POST /auth/reset-password
 * Reset password using a valid token.
 */
exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    log.info('Reset password attempt');

    if (!token || !newPassword) {
      return res.status(400).json(
        ResponseFormatter.error('Token dan password baru diperlukan', 400)
      );
    }

    const passwordCheck = validatePassword(newPassword);
    if (!passwordCheck.valid) {
      return res.status(400).json(
        ResponseFormatter.error(passwordCheck.errors.join('. '), 400)
      );
    }

    // Find token in database
    const tokenHash = hashToken(token);
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: { user: { select: { id: true, email: true } } }
    });

    // Validate token
    if (!resetToken) {
      log.warn('Reset password: token not found');
      return res.status(400).json(
        ResponseFormatter.error('Token tidak valid atau sudah expired', 400)
      );
    }

    if (resetToken.usedAt) {
      log.warn('Reset password: token already used', { userId: resetToken.userId });
      return res.status(400).json(
        ResponseFormatter.error('Token sudah pernah digunakan', 400)
      );
    }

    if (resetToken.expiresAt < new Date()) {
      log.warn('Reset password: token expired', { userId: resetToken.userId });
      return res.status(400).json(
        ResponseFormatter.error('Token sudah expired. Silakan request ulang.', 400)
      );
    }

    // Hash new password and consume token atomically
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const consumed = await prisma.$transaction(async (tx) => {
      const current = await tx.passwordResetToken.findUnique({
        where: { id: resetToken.id },
      });
      if (!current || current.usedAt || current.expiresAt < new Date()) {
        return false;
      }

      await tx.user.update({
        where: { id: resetToken.userId },
        data: {
          password: hashedPassword,
          tokenVersion: { increment: 1 },
        },
      });

      await tx.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      });

      await tx.refreshToken.deleteMany({ where: { userId: resetToken.userId } });
      return true;
    });

    if (!consumed) {
      return res.status(400).json(
        ResponseFormatter.error('Token sudah pernah digunakan atau expired', 400)
      );
    }

    log.info('Password reset successful', { userId: resetToken.userId });
    res.json(ResponseFormatter.success(null, 'Password berhasil direset. Silakan login dengan password baru.'));
  } catch (error) {
    log.error('resetPassword error', { error: error.message });
    res.status(500).json(ResponseFormatter.error('Terjadi kesalahan. Silakan coba lagi.', 500));
  }
};

/**
 * POST /auth/change-password
 * Change password for authenticated user (knows current password).
 */
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.userId;
    log.info('Change password attempt', { userId });

    if (!currentPassword || !newPassword) {
      return res.status(400).json(
        ResponseFormatter.error('Password lama dan baru diperlukan', 400)
      );
    }

    const passwordCheck = validatePassword(newPassword);
    if (!passwordCheck.valid) {
      return res.status(400).json(
        ResponseFormatter.error(passwordCheck.errors.join('. '), 400)
      );
    }

    // Get user with password
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, password: true }
    });

    if (!user) {
      return res.status(404).json(ResponseFormatter.error('User not found', 404));
    }

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      log.warn('Change password: wrong current password', { userId });
      return res.status(400).json(
        ResponseFormatter.error('Password lama tidak sesuai', 400)
      );
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: {
          password: hashedPassword,
          tokenVersion: { increment: 1 },
        },
      }),
      prisma.refreshToken.deleteMany({ where: { userId } }),
    ]);

    clearRefreshCookie(res);

    log.info('Password changed successfully — sessions invalidated', { userId });
    res.json(ResponseFormatter.success(
      { requireReLogin: true, code: 'SESSION_INVALIDATED' },
      'Password berhasil diubah. Silakan login kembali.'
    ));
  } catch (error) {
    log.error('changePassword error', { error: error.message });
    res.status(500).json(ResponseFormatter.error('Gagal mengubah password', 500));
  }
};
