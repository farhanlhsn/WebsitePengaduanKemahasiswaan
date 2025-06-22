const authServices = require('../services/authServices');
const prisma = require('../utils/prisma');
const jwt = require('jsonwebtoken');

exports.registerStudent = async (req, res) => {
  try {
    const user = await authServices.registerStudent(req.body);
    res.status(201).json({
        status: 'success',
        message: 'Registration successful',
        data: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        }
    });
  } catch (error) {
    res.status(400).json({ error: 'Registration failed' });
  }
};

exports.registerAdmin = async (req, res) => {
  try {
    const user = await authServices.registerAdmin(req.body);
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
    res.status(400).json({ error: 'Admin registration failed' });
  }
}

exports.login = async (req, res) => {
  try {
    const user = await authServices.login(req.body, req);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    // Set access token in response header
    res.setHeader('Authorization', `Bearer ${user.accessToken}`);

    // Set refresh token in a secure cookie
    res.cookie('refreshToken', user.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({
      status: 'success',
      message: 'Login successful',
      tokenType: 'Bearer',
      accessToken: user.accessToken,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        deviceInfo: user.deviceInfo
    }
    });
  } catch (error) {
    res.status(401).json({ error: 'Login failed', message: 'Invalid email or password' });
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

    res.status(200).json({
      status: 'success',
      message: 'Logout successful'
    });
  } catch (error) {
    // Handle token expired/invalid
    if (error instanceof jwt.TokenExpiredError) {
      res.clearCookie('refreshToken');
      return res.status(401).json({ error: 'Token expired' });
    }
    if (error instanceof jwt.JsonWebTokenError) {
      res.clearCookie('refreshToken');
      return res.status(401).json({ error: 'Invalid token' });
    }
    
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
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    res.json({ accessToken: newAccessToken });
  } catch (error) {
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
    
    res.json({
      status: 'success',
      message: 'Devices retrieved successfully',
      data: devices
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve devices' });
  }
};

exports.logoutDevice = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    
    await authServices.logoutDeviceById(userId, id);
    
    res.json({
      status: 'success',
      message: 'Device logged out successfully'
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to logout device' });
  }
};

exports.  logoutAllOtherDevices = async (req, res) => {
  try {
    const userId = req.user.userId;
    const refreshToken = req.cookies.refreshToken;
    
    if (!refreshToken) {
      return res.status(401).json({ error: 'No refresh token found' });
    }
    
    // Get current device ID from token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const currentDeviceId = decoded.deviceId;
    
    await authServices.logoutAllOtherDevices(userId, currentDeviceId);
    
    res.json({
      status: 'success',
      message: 'All other devices logged out successfully'
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to logout other devices' });
  }
};