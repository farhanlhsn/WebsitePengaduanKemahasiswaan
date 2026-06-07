const authServices = require('../services/authServices');
const prisma = require('../utils/prisma');
const jwt = require('jsonwebtoken');
const { getLogger } = require('../utils/logger');
const { validatePassword } = require('../utils/passwordPolicy');
const { isAllowedDomain, getAllowedDomains } = require('../utils/emailValidator');
const log = getLogger('auth:controller');
const { refreshCookieOptions, clearRefreshCookie } = require('../utils/refreshCookie');
const { hashToken } = require('../utils/tokenHash');

/**
 * Process KTM file upload and return the file path.
 * Standalone function to avoid `this` binding issues when called from route handlers.
 * @param {object} req - Express request object with file attached by multer
 * @returns {string} The path to the uploaded KTM file
 * @throws {Error} If no file, invalid type, or file too large
 */
async function uploadKtm(req) {
  try {
    const file = req.file;
    if (!file) {
      throw new Error('No file uploaded');
    }
    
    // Validasi file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.mimetype)) {
      throw new Error('Invalid file type. Only JPEG, JPG, PNG, and WebP are allowed');
    }
    
    // Validasi file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new Error('File size too large. Maximum size is 5MB');
    }
    
    const ktmPath = `/uploads/ktm/${file.filename}`;
    log.info('KTM uploaded successfully', { filename: file.filename, mimetype: file.mimetype, size: file.size });
    return ktmPath;
  } catch (error) {
    log.warn('Upload KTM failed', { error: error.message });
    throw new Error('Error uploading file: ' + error.message);
  }
}

exports.uploadKtm = uploadKtm;

exports.registerStudent = async (req, res) => {
  try {
    log.info('Register student attempt', { email: req.body?.email, nim: req.body?.nim });
    // Validasi input
    const { name, email, password, nim } = req.body;
    
    if (!name || !email || !password || !nim) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        message: 'Name, email, password, and NIM are required' 
      });
    }
    
    // Validasi email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        error: 'Invalid email format',
        message: 'Please provide a valid email address' 
      });
    }

    // Validasi email domain (whitelist kampus)
    if (!isAllowedDomain(email)) {
      const domains = getAllowedDomains();
      return res.status(400).json({
        error: 'Email domain tidak diizinkan',
        message: domains.length > 0
          ? `Hanya email kampus yang diperbolehkan (contoh: @${domains[0]})`
          : 'Email domain tidak valid'
      });
    }
    
    // Validasi password strength
    const passwordCheck = validatePassword(password);
    if (!passwordCheck.valid) {
      return res.status(400).json({ 
        error: 'Password tidak memenuhi syarat',
        message: passwordCheck.errors.join('. '),
        details: passwordCheck.errors
      });
    }
    
    // Validasi NIM format (sesuaikan dengan format NIM kampus)
    const nimRegex = /^\d{8,}$/; // Minimal 8 digit angka
    if (!nimRegex.test(nim)) {
      return res.status(400).json({ 
        error: 'Invalid NIM format',
        message: 'NIM must contain at least 8 digits' 
      });
    }
    
    // Upload KTM
    let ktmPath = null;
    if (req.file) {
      ktmPath = await uploadKtm(req);
    }
    
    // Register user
    const user = await authServices.registerStudent(req.body, ktmPath);
    
    log.info('Register student success', { userId: user.id, email: user.email, nim: user.nim });
    res.status(201).json({
      status: 'success',
      message: 'Registration successful. Please wait for admin verification.',
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        nim: user.nim,
        role: user.role,
        isVerified: user.isVerified,
        ktmPath: user.ktmPath
      }
    });
  } catch (error) {
    log.error('Registration error', { error: error.message, stack: error.stack });
    
    // Handle specific errors
    if (error.message.includes('Unique constraint')) {
      if (error.message.includes('email')) {
        return res.status(400).json({ 
          error: 'Email already exists',
          message: 'An account with this email already exists' 
        });
      }
      if (error.message.includes('nim')) {
        return res.status(400).json({ 
          error: 'NIM already exists',
          message: 'An account with this NIM already exists' 
        });
      }
    }
    
    if (error.message.includes('uploading file')) {
      return res.status(400).json({ 
        error: 'File upload failed',
        message: error.message 
      });
    }
    
    res.status(500).json({ 
      error: 'Registration failed',
      message: 'An error occurred during registration. Please try again.' 
    });
  }
};

exports.login = async (req, res) => {
  try {
    log.info('Login attempt', { email: req.body?.email, ip: req.ip });
    const user = await authServices.login(req.body, req);
    // Set access token in response header
    res.setHeader('Authorization', `Bearer ${user.accessToken}`);

    // Set refresh token in a secure cookie
    res.cookie('refreshToken', user.refreshToken, {
      ...refreshCookieOptions(),
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    log.info('Login success', { userId: user.id, email: user.email, device: user.deviceInfo?.deviceName });
    res.json({
      status: 'success',
      message: 'Login successful',
      tokenType: 'Bearer',
      accessToken: user.accessToken,
      data: {
        id: user.id,
        name: user.name,
        nim: user.nim,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        deviceInfo: user.deviceInfo
    }
    });
  } catch (error) {
    log.warn('Login failed', { email: req.body?.email, reason: error.message });
    res.status(401).json({ error: 'Login failed', message: error.message });
  }
};

exports.logout = async (req, res) => {
  clearRefreshCookie(res);

  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      return res.status(200).json({
        status: 'success',
        message: 'Logout successful'
      });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    await authServices.logout(decoded.userId, refreshToken);

    log.info('Logout success', { userId: decoded.userId });
    return res.status(200).json({
      status: 'success',
      message: 'Logout successful'
    });
  } catch (error) {
    log.warn('Logout with invalid or expired token — cookie cleared', { error: error.message });
    return res.status(200).json({
      status: 'success',
      message: 'Logout successful'
    });
  }
};

exports.refreshToken = async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) return res.sendStatus(401);

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const tokenHash = hashToken(refreshToken);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true, role: true, name: true, email: true, nim: true,
        isVerified: true, tokenVersion: true, deletedAt: true,
      },
    });

    if (!user || user.deletedAt) {
      await prisma.refreshToken.deleteMany({ where: { userId: decoded.userId } });
      clearRefreshCookie(res);
      return res.sendStatus(403);
    }

    const newAccessToken = jwt.sign(
      { userId: user.id, role: user.role, name: user.name, tokenVersion: user.tokenVersion },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    const newRefreshToken = jwt.sign(
      { userId: user.id, deviceId: decoded.deviceId },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );
    const newTokenHash = hashToken(newRefreshToken);
    const newExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const rotation = await prisma.$transaction(async (tx) => {
      const stored = await tx.refreshToken.findFirst({
        where: {
          userId: decoded.userId,
          deviceId: decoded.deviceId,
          tokenHash,
          expiresAt: { gt: new Date() },
        },
      });

      if (!stored) {
        return { ok: false };
      }

      const consumed = await tx.refreshToken.deleteMany({
        where: { id: stored.id, tokenHash },
      });

      if (consumed.count !== 1) {
        return { ok: false };
      }

      await tx.refreshToken.create({
        data: {
          tokenHash: newTokenHash,
          userId: user.id,
          deviceId: decoded.deviceId,
          deviceName: stored.deviceName,
          userAgent: stored.userAgent,
          ipAddress: stored.ipAddress,
          expiresAt: newExpiresAt,
          lastUsedAt: new Date(),
        },
      });

      return { ok: true };
    });

    if (!rotation.ok) {
      log.warn('Refresh token reuse detected — possible token theft', {
        userId: decoded.userId,
        deviceId: decoded.deviceId,
      });
      await prisma.refreshToken.deleteMany({
        where: { userId: decoded.userId, deviceId: decoded.deviceId },
      });
      clearRefreshCookie(res);
      return res.sendStatus(403);
    }

    res.cookie('refreshToken', newRefreshToken, {
      ...refreshCookieOptions(),
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    log.info('Token rotated', { userId: user.id, deviceId: decoded.deviceId });
    res.json({
      accessToken: newAccessToken,
      data: {
        id: user.id,
        name: user.name,
        nim: user.nim,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
      },
    });
  } catch (error) {
    log.warn('Refresh token failed', { error: error.message });
    clearRefreshCookie(res);
    res.sendStatus(403);
  }
};

// Device Management Controllers
exports.getUserDevices = async (req, res) => {
  try {
    const userId = req.user.userId; // From JWT middleware
    
    // Get current device ID from refresh token cookie
    let currentDeviceId = null;
    const refreshToken = req.cookies.refreshToken;
    if (refreshToken) {
      try {
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        currentDeviceId = decoded.deviceId;
      } catch (error) {
        // Ignore token errors for this endpoint
      }
    }
    
    const devices = await authServices.getUserDevices(userId, currentDeviceId);
    
    log.info('Get user devices', { userId, count: devices?.length || 0 });
    res.json({
      status: 'success',
      message: 'Devices retrieved successfully',
      data: devices
    });
  } catch (error) {
    log.error('Get user devices failed', { userId: req.user?.userId, error: error.message });
    res.status(500).json({ error: 'Failed to retrieve devices' });
  }
};

exports.logoutDevice = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    
    await authServices.logoutDeviceById(userId, id);
    
    log.info('Logout device success', { userId, deviceRecordId: id });
    res.json({
      status: 'success',
      message: 'Device logged out successfully'
    });
  } catch (error) {
    log.error('Logout device failed', { userId: req.user?.userId, deviceRecordId: req.params?.id, error: error.message });
    res.status(500).json({ error: 'Failed to logout device' });
  }
};

exports.logoutAllOtherDevices = async (req, res) => {
  try {
    const userId = req.user.userId;
    const refreshToken = req.cookies.refreshToken;
    
    if (!refreshToken) {
      log.warn('Logout other devices: no refresh token');
      return res.status(401).json({ error: 'No refresh token found' });
    }
    
    // Get current device ID from token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const currentDeviceId = decoded.deviceId;
    
    await authServices.logoutAllOtherDevices(userId, currentDeviceId);
    
    log.info('Logout other devices success', { userId, currentDeviceId });
    res.json({
      status: 'success',
      message: 'All other devices logged out successfully'
    });
  } catch (error) {
    log.error('Logout other devices failed', { userId: req.user?.userId, error: error.message });
    res.status(500).json({ error: 'Failed to logout other devices' });
  }
};
