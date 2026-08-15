const prisma = require('../utils/prisma');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDeviceInfo } = require('../utils/deviceDetection');
const { hashToken } = require('../utils/tokenHash');
const axios = require('axios');
const { getLogger } = require('../utils/logger');
const log = getLogger('auth:service');

class AuthServices {
  async login(data, req) {
    try {
      log.info('Service login invoked', { email: data?.email });
      const user = await prisma.user.findUnique({
        where: { email: data.email }
      });

      // Security (audit B4): user yang sudah soft-delete tidak boleh login.
      // Gunakan pesan generik yang sama dengan user-tidak-ditemukan agar
      // status deleted tidak bocor (mencegah enumerasi status akun).
      if (!user || user.deletedAt) throw new Error('email/password salah');
      
      const isPasswordValid = await bcrypt.compare(data.password, user.password);
      if (!isPasswordValid) throw new Error('email/password salah');
      if (!user.isVerified) throw new Error('User is not verified');

      // Get device information
      const deviceInfo = getDeviceInfo(req);

      // Access token 
      const accessToken = jwt.sign(
        { userId: user.id, role: user.role, name: user.name, tokenVersion: user.tokenVersion },
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
      
      const tokenHash = hashToken(refreshToken);

      await prisma.refreshToken.upsert({
        where: {
          userId_deviceId: {
            userId: user.id,
            deviceId: deviceInfo.deviceId
          }
        },
        update: {
          tokenHash,
          expiresAt: expiresAt,
          lastUsedAt: new Date(),
          userAgent: deviceInfo.userAgent,
          ipAddress: deviceInfo.ipAddress
        },
        create: {
          tokenHash,
          userId: user.id,
          deviceId: deviceInfo.deviceId,
          deviceName: deviceInfo.deviceName,
          userAgent: deviceInfo.userAgent,
          ipAddress: deviceInfo.ipAddress,
          expiresAt: expiresAt,
          lastUsedAt: new Date()
        }
      });

      const result = {
        id: user.id,
        name: user.name,
        email: user.email,
        nim : user.nim,
        role: user.role,
        isVerified: user.isVerified,
        accessToken,
        refreshToken,
        deviceInfo: {
          deviceName: deviceInfo.deviceName,
          deviceType: deviceInfo.deviceType
        }
      };
      log.info('Service login success', { userId: user.id });
      return result;
    } catch (error) {
      log.warn('Service login failed', { email: data?.email, error: error.message });
      throw new Error(`${error.message}`);
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
      log.info('Device limit enforced', { userId, removed: devicesToRemove.map(d => d.deviceId) });
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

    log.info('Service getUserDevices', { userId, count: devicesWithLocation.length });
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
    log.info('Service logoutDevice', { userId, deviceId });
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
    log.info('Service logoutDeviceById', { userId, id });
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
    log.info('Service logoutAllOtherDevices', { userId, currentDeviceId });
  }

  async logout(userId, refreshToken) {
    await prisma.refreshToken.deleteMany({
      where: {
        userId: userId,
        tokenHash: hashToken(refreshToken)
      }
    });
    log.info('Service logout', { userId });
  }

  async registerStudent(studentData, ktmPath) {
    try {
      // Validasi data
      const { name, email, password, nim } = studentData;
      
      if (!name || !email || !password || !nim) {
        throw new Error('Missing required fields');
      }
      
      // Cek email sudah ada atau belum
      const existingUserByEmail = await prisma.user.findUnique({
        where: { email: email }
      });
      
      if (existingUserByEmail && !existingUserByEmail.deletedAt) {
        throw new Error('Email already exists');
      }
      
      // Cek NIM sudah ada atau belum
      const existingUserByNim = await prisma.user.findUnique({
        where: { nim: nim }
      });
      
      if (existingUserByNim && !existingUserByNim.deletedAt) {
        throw new Error('NIM already exists');
      }
      
      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Audit M8: akun lama yang soft-deleted (ditolak/dihapus) boleh mendaftar
      // ulang. Alih-alih menolak karena email/NIM "sudah ada", reset baris lama
      // menjadi akun mahasiswa baru yang belum diverifikasi — menjaga FK/referensi
      // tetap utuh tanpa hard delete.
      if (existingUserByEmail || existingUserByNim) {
        // Jika email dan NIM milik dua baris soft-deleted berbeda, buang baris
        // NIM agar tidak melanggar unique constraint saat reset.
        if (existingUserByEmail && existingUserByNim && existingUserByEmail.id !== existingUserByNim.id) {
          await prisma.user.delete({ where: { id: existingUserByNim.id } });
        }
        const target = existingUserByEmail || existingUserByNim;
        if (target.role !== 'MAHASISWA') {
          throw new Error('Email already exists');
        }
        const reactivated = await prisma.user.update({
          where: { id: target.id },
          data: {
            name,
            email,
            password: hashedPassword,
            nim,
            role: 'MAHASISWA',
            ktmPath,
            isVerified: false,
            deletedAt: null,
            tokenVersion: { increment: 1 },
          },
        });
        log.info('Service registerStudent success (re-registered)', { userId: reactivated.id });
        return reactivated;
      }

      // Create user
      const user = await prisma.user.create({
        data: {
          name: name,
          email: email,
          password: hashedPassword,
          nim: nim,
          role: 'MAHASISWA',
          ktmPath: ktmPath,
          isVerified: false // Default false, perlu verifikasi admin
        }
      });
      
      log.info('Service registerStudent success', { userId: user.id, email: user.email });
      return user;
    } catch (error) {
      // Re-throw error untuk handling di controller
      log.warn('Service registerStudent failed', { email: studentData?.email, error: error.message });
      throw error;
    }
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

      // Security (audit S1/M13): validasi bentuk IP sebelum dimasukkan ke URL
      // pihak ketiga — mencegah injeksi path/SSRF dari nilai IP yang dipalsukan.
      const IPV4_RE = /^(\d{1,3}\.){3}\d{1,3}$/;
      const IPV6_RE = /^[0-9a-fA-F:]+$/;
      if (!IPV4_RE.test(testIP) && !IPV6_RE.test(testIP)) {
        return 'Tidak Diketahui';
      }

      const response = await axios.get(`http://ip-api.com/json/${encodeURIComponent(testIP)}?fields=country,regionName,city,status`, {
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