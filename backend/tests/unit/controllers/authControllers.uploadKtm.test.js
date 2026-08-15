/**
 * Unit tests for uploadKtm function in authControllers.
 * Validates: Requirements 10.1, 10.2
 * 
 * Tests that uploadKtm can be called without TypeError and handles
 * file validation correctly.
 */

// Mock dependencies before requiring the module
jest.mock('../../../src/utils/prisma', () => ({}));
jest.mock('jsonwebtoken', () => ({
  verify: jest.fn(),
  sign: jest.fn()
}));
jest.mock('../../../src/utils/logger', () => ({
  getLogger: () => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  })
}));
jest.mock('../../../src/services/authServices', () => ({
  registerStudent: jest.fn()
}));

const authControllers = require('../../../src/controllers/authControllers');

describe('uploadKtm', () => {
  describe('standalone function call (no this binding)', () => {
    it('should be callable as a standalone function without TypeError', async () => {
      const req = {
        file: {
          filename: 'test-ktm.jpeg',
          mimetype: 'image/jpeg',
          size: 1024 * 1024 // 1MB
        }
      };

      // This should NOT throw TypeError: this.uploadKtm is not a function
      const result = await authControllers.uploadKtm(req);
      expect(result).toBe('/uploads/ktm/test-ktm.jpeg');
    });

    it('should work when called directly (simulating internal call)', async () => {
      const req = {
        file: {
          filename: '12345-photo.png',
          mimetype: 'image/png',
          size: 2 * 1024 * 1024
        }
      };

      // Simulate calling without `this` context (as happens in route handlers)
      const uploadFn = authControllers.uploadKtm;
      const result = await uploadFn(req);
      expect(result).toBe('/uploads/ktm/12345-photo.png');
    });
  });

  describe('file validation', () => {
    it('should throw error when no file is uploaded', async () => {
      const req = { file: null };

      await expect(authControllers.uploadKtm(req))
        .rejects.toThrow('Error uploading file: No file uploaded');
    });

    it('should throw error for invalid file type', async () => {
      const req = {
        file: {
          filename: 'malicious.exe',
          mimetype: 'application/x-msdownload',
          size: 1024
        }
      };

      await expect(authControllers.uploadKtm(req))
        .rejects.toThrow('Invalid file type');
    });

    it('should throw error when file exceeds 5MB', async () => {
      const req = {
        file: {
          filename: 'large-image.jpeg',
          mimetype: 'image/jpeg',
          size: 6 * 1024 * 1024 // 6MB
        }
      };

      await expect(authControllers.uploadKtm(req))
        .rejects.toThrow('File size too large');
    });

    it('should accept valid JPEG file', async () => {
      const req = {
        file: {
          filename: 'ktm-valid.jpeg',
          mimetype: 'image/jpeg',
          size: 2 * 1024 * 1024
        }
      };

      const result = await authControllers.uploadKtm(req);
      expect(result).toBe('/uploads/ktm/ktm-valid.jpeg');
    });

    it('should accept valid PNG file', async () => {
      const req = {
        file: {
          filename: 'ktm-valid.png',
          mimetype: 'image/png',
          size: 3 * 1024 * 1024
        }
      };

      const result = await authControllers.uploadKtm(req);
      expect(result).toBe('/uploads/ktm/ktm-valid.png');
    });

    it('should accept valid WebP file', async () => {
      const req = {
        file: {
          filename: 'ktm-valid.webp',
          mimetype: 'image/webp',
          size: 1 * 1024 * 1024
        }
      };

      const result = await authControllers.uploadKtm(req);
      expect(result).toBe('/uploads/ktm/ktm-valid.webp');
    });
  });

  describe('registerStudent integration with uploadKtm', () => {
    it('should not throw TypeError when registerStudent calls uploadKtm internally', async () => {
      const authServices = require('../../../src/services/authServices');
      authServices.registerStudent.mockResolvedValue({
        id: 1,
        name: 'Test Student',
        email: 'test@example.com',
        nim: '12345678',
        role: 'MAHASISWA',
        isVerified: false,
        ktmPath: '/uploads/ktm/test.jpeg'
      });

      const req = {
        body: {
          name: 'Test Student',
          email: 'test@example.com',
          password: 'StrongP@ss1',
          nim: '12345678'
        },
        file: {
          filename: 'test.jpeg',
          mimetype: 'image/jpeg',
          size: 1024 * 1024
        }
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      // This is the key test - previously this would throw:
      // TypeError: this.uploadKtm is not a function
      await authControllers.registerStudent(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'success',
          message: 'Registration successful. Please wait for admin verification.'
        })
      );
    });

    it('should handle uploadKtm error gracefully in registerStudent', async () => {
      const req = {
        body: {
          name: 'Test Student',
          email: 'test@example.com',
          password: 'StrongP@ss1',
          nim: '12345678'
        },
        file: {
          filename: 'bad.exe',
          mimetype: 'application/x-msdownload',
          size: 1024
        }
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await authControllers.registerStudent(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'error',
          message: expect.stringContaining('uploading file')
        })
      );
    });
  });
});
