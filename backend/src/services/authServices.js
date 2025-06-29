const prisma = require('../utils/prisma');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDeviceInfo } = require('../utils/deviceDetection');
const axios = require('axios');
const dotenv = require('dotenv');
dotenv.config();

class AuthServices {
  async login(data, req) {
    try {
      const user = await prisma.user.findUnique({
        where: { email: data.email }
      });

      if (!user) throw new Error('User not found');
      
      const isPasswordValid = await bcrypt.compare(data.password, user.password);
      if (!isPasswordValid) throw new Error('Invalid password');
      if (!user.isVerified) throw new Error('User is not verified');

      // Get device information
      const deviceInfo = getDeviceInfo(req);

      // Access token 
      const accessToken = jwt.sign(
        { userId: user.id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '15m' } 
      );

      // Refresh token
      const refreshToken = jwt.sign(
        { userId: user.id, deviceId: deviceInfo.deviceId },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: '7d' }
      );

      // Handle device limit (max 3 devices)
      await this.manageDeviceLimit(user.id, deviceInfo);

      // Simpan atau update refresh token untuk device ini
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      
      await prisma.refreshToken.upsert({
        where: {
          userId_deviceId: {
            userId: user.id,
            deviceId: deviceInfo.deviceId
          }
        },
        update: {
          token: refreshToken,
          expiresAt: expiresAt,
          lastUsedAt: new Date(),
          userAgent: deviceInfo.userAgent,
          ipAddress: deviceInfo.ipAddress
        },
        create: {
          token: refreshToken,
          userId: user.id,
          deviceId: deviceInfo.deviceId,
          deviceName: deviceInfo.deviceName,
          userAgent: deviceInfo.userAgent,
          ipAddress: deviceInfo.ipAddress,
          expiresAt: expiresAt,
          lastUsedAt: new Date()
        }
      });

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        accessToken,
        refreshToken,
        deviceInfo: {
          deviceName: deviceInfo.deviceName,
          deviceType: deviceInfo.deviceType
        }
      };
    } catch (error) {
      throw new Error(`Login failed: ${error.message}`);
    }
  }

  /**
   * Manage device limit - keep only 3 most recent devices
   */
  async manageDeviceLimit(userId, currentDeviceInfo) {
    // Get all devices for this user
    const userDevices = await prisma.refreshToken.findMany({
      where: { userId },
      orderBy: { lastUsedAt: 'desc' }
    });

    // If user has 3 or more devices and current device is new
    const existingDevice = userDevices.find(device => device.deviceId === currentDeviceInfo.deviceId);
    
    if (!existingDevice && userDevices.length >= 3) {
      // Remove the oldest device(s) to make room for the new one
      const devicesToRemove = userDevices.slice(2); // Keep only 2 most recent
      
      for (const device of devicesToRemove) {
        await prisma.refreshToken.delete({
          where: { id: device.id }
        });
      }
    }
  }

  /**
   * Get user's active devices
   */
  async getUserDevices(userId, currentDeviceId = null) {
    const devices = await prisma.refreshToken.findMany({
      where: { 
        userId,
        expiresAt: { gt: new Date() }
      },
      orderBy: { lastUsedAt: 'desc' },
      select: {
        id: true,
        deviceId: true,
        deviceName: true,
        lastUsedAt: true,
        createdAt: true,
        ipAddress: true,
        userAgent: true
      }
    });

    // Parse user agent for each device and add extra info including location
    const devicesWithLocation = await Promise.all(devices.map(async (device) => {
      const { parseUserAgent } = require('../utils/deviceDetection');
      const parsedInfo = parseUserAgent(device.userAgent);
      
      // Get location from IP address
      const location = await this.getLocationFromIP(device.ipAddress);
      
      return {
        id: device.id,
        deviceId: device.deviceId,
        deviceName: device.deviceName,
        lastAccess: device.lastUsedAt,
        createdAt: device.createdAt,
        ipAddress: device.ipAddress,
        userAgent: device.userAgent,
        browser: parsedInfo.browser,
        os: parsedInfo.os,
        deviceType: parsedInfo.deviceType,
        location: location,
        isCurrent: currentDeviceId ? device.deviceId === currentDeviceId : false
      };
    }));

    return devicesWithLocation;
  }

  /**
   * Logout from specific device
   */
  async logoutDevice(userId, deviceId) {
    await prisma.refreshToken.deleteMany({
      where: {
        userId: userId,
        deviceId: deviceId
      }
    });
  }

  /**
   * Logout from specific device by ID (primary key)
   */
  async logoutDeviceById(userId, id) {
    await prisma.refreshToken.deleteMany({
      where: {
        userId: userId,
        id: parseInt(id)
      }
    });
  }

  /**
   * Logout from all devices except current
   */
  async logoutAllOtherDevices(userId, currentDeviceId) {
    await prisma.refreshToken.deleteMany({
      where: {
        userId: userId,
        deviceId: { not: currentDeviceId }
      }
    });
  }

  async logout(userId, refreshToken) {
    // Hapus spesifik refresh token
    await prisma.refreshToken.deleteMany({
      where: {
        userId: userId,
        token: refreshToken
      }
    });
  }

  async registerStudent(studentData) {
    const hashedPassword = await bcrypt.hash(studentData.password, 10);
    return prisma.user.create({
      data: {
        ...studentData,
        password: hashedPassword,
        role: 'MAHASISWA'
      }
    });
  }

  async registerAdmin(adminData) {
    const hashedPassword = await bcrypt.hash(adminData.password, 10);
    return prisma.user.create({
      data: {
        ...adminData,
        password: hashedPassword,
        role: 'ADMIN'
      }
    });
  }

  /**
   * Get location from IP address
   */
  async getLocationFromIP(ipAddress) {
    try {
      // Skip localhost and private IPs (kecuali dalam mode testing)
      const isTestingMode = process.env.GEOLOCATION_TEST_MODE === 'true';
      
      if (!isTestingMode && (!ipAddress || ipAddress === 'unknown' || 
          ipAddress.startsWith('127.') || 
          ipAddress.startsWith('192.168.') || 
          ipAddress.startsWith('10.') ||
          ipAddress.includes('::1'))) {
        return 'Lokal';
      }

      // Jika testing mode dan IP lokal, gunakan IP asli user
      let testIP = ipAddress;
      if (isTestingMode && (ipAddress.startsWith('127.') || ipAddress.includes('::1'))) {
        try {
          const ipResponse = await axios.get('https://api.ipify.org?format=json', { timeout: 2000 });
          testIP = ipResponse.data.ip;
        } catch (error) {
          console.log('Cannot get real IP for testing:', error.message);
          return 'Lokal';
        }
      }

      const response = await axios.get(`http://ip-api.com/json/${testIP}?fields=country,regionName,city,status`, {
        timeout: 3000 // 3 second timeout
      });

      if (response.data.status === 'success') {
        const { country, regionName, city } = response.data;
        
        // Format location string
        let location = '';
        if (city && regionName) {
          location = `${city}, ${regionName}`;
        } else if (city) {
          location = city;
        } else if (regionName) {
          location = regionName;
        } else {
          location = country || 'Tidak Diketahui';
        }

        return location;
      }
      
      return 'Tidak Diketahui';
    } catch (error) {
      console.error('Error getting location from IP:', error.message);
      return 'Tidak Diketahui';
    }
  }
}

module.exports = new AuthServices();