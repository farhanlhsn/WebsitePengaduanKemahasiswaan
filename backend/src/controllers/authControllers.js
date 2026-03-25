const authServices = require('../services/authServices');
const prisma = require('../utils/prisma');
const jwt = require('jsonwebtoken');
const { getLogger } = require('../utils/logger');
const log = getLogger('auth:controller');

exports.uploadKtm = async (req, res) => {
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
    
    // Validasi password strength
    if (password.length < 6) {
      return res.status(400).json({ 
        error: 'Password too short',
        message: 'Password must be at least 6 characters long' 
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
      ktmPath = await this.uploadKtm(req, res);
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

exports.registerAdmin = async (req, res) => {
  try {
    log.info('Register admin attempt', { email: req.body?.email });
    const user = await authServices.registerAdmin(req.body);
    log.info('Register admin success', { userId: user.id, email: user.email });
    res.status(201).json({
        status: 'success',
        message: 'Admin registration successful',
        data: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        }
    });
  } catch (error) {
    log.error('Admin registration failed', { error: error.message, stack: error.stack });
    res.status(400).json({ error: 'Admin registration failed' });
  }
}

exports.login = async (req, res) => {
  try {
    log.info('Login attempt', { email: req.body?.email, ip: req.ip });
    const user = await authServices.login(req.body, req);
    // Set access token in response header
    res.setHeader('Authorization', `Bearer ${user.accessToken}`);

    // Set refresh token in a secure cookie
    res.cookie('refreshToken', user.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
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
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) return res.status(204).send();

    // Verifikasi token untuk mendapatkan user ID
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const userId = decoded.userId;

    // Panggil service logout
    await authServices.logout(userId, refreshToken);

    // Hapus cookie
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });

    log.info('Logout success', { userId });
    res.status(200).json({
      status: 'success',
      message: 'Logout successful'
    });
  } catch (error) {
    // Handle token expired/invalid
    if (error instanceof jwt.TokenExpiredError) {
      log.warn('Logout token expired');
      res.clearCookie('refreshToken');
      return res.status(401).json({ error: 'Token expired' });
    }
    if (error instanceof jwt.JsonWebTokenError) {
      log.warn('Logout invalid token');
      res.clearCookie('refreshToken');
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    log.error('Logout failed', { error: error.message });
    res.status(400).json({ error: 'Logout failed' });
  }
};

exports.refreshToken = async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) return res.sendStatus(401);

  try {
    // Verifikasi token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    
    // Cek di database
    const storedToken = await prisma.refreshToken.findFirst({
      where: {
        token: refreshToken,
        userId: decoded.userId,
        deviceId: decoded.deviceId
      }
    });

    if (!storedToken || storedToken.expiresAt < new Date()) {
      log.warn('Refresh token invalid or expired');
      return res.sendStatus(403);
    }

    // Update last used time
    await prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { lastUsedAt: new Date() }
    });

    // Buat access token baru
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    const newAccessToken = jwt.sign(
      { userId: user.id, role: user.role, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    log.info('Access token refreshed', { userId: user.id });
    res.json({ accessToken: newAccessToken });
  } catch (error) {
    log.warn('Refresh token failed', { error: error.message });
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