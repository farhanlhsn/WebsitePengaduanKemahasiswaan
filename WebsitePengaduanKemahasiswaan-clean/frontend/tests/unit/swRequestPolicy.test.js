import { describe, it, expect } from 'vitest';
import {
  isApiRequest,
  isUploadRequest,
  isStaticAsset,
  isImageRequest,
  shouldBypassCache,
  getFetchStrategy,
} from '../../src/utils/swRequestPolicy.js';

function mockRequest(url) {
  return { url };
}

describe('swRequestPolicy', () => {
  describe('isApiRequest', () => {
    it('matches /v1/api/ paths', () => {
      expect(isApiRequest(mockRequest('http://localhost:6060/v1/api/reports'))).toBe(true);
      expect(isApiRequest(mockRequest('https://api.example.com/v1/api/auth/login'))).toBe(true);
    });

    it('matches legacy /api/ paths', () => {
      expect(isApiRequest(mockRequest('http://localhost:6060/api/users'))).toBe(true);
    });

    it('does not match static assets or pages', () => {
      expect(isApiRequest(mockRequest('http://localhost:5173/dashboard'))).toBe(false);
      expect(isApiRequest(mockRequest('http://localhost:5173/js/main-abc.js'))).toBe(false);
    });
  });

  describe('getFetchStrategy', () => {
    it('uses network-only for uploads and API paths', () => {
      expect(getFetchStrategy(mockRequest('http://localhost:6060/v1/api/reports'))).toBe('network-only');
      expect(getFetchStrategy(mockRequest('http://localhost:6060/uploads/ktm/file.jpg'))).toBe('network-only');
    });

    it('uses cache-first for static assets and images', () => {
      expect(getFetchStrategy(mockRequest('http://localhost:5173/js/app.js'))).toBe('cache-first');
      expect(getFetchStrategy(mockRequest('http://localhost:5173/logo.png'))).toBe('cache-first');
    });

    it('uses network-only for navigation and other requests', () => {
      expect(getFetchStrategy(mockRequest('http://localhost:5173/dashboard'))).toBe('network-only');
    });
  });

  describe('shouldBypassCache', () => {
    it('returns true for API and upload requests', () => {
      expect(shouldBypassCache(mockRequest('http://localhost:6060/v1/api/reports'))).toBe(true);
      expect(shouldBypassCache(mockRequest('http://localhost:6060/uploads/chat/attachments/x.pdf'))).toBe(true);
      expect(shouldBypassCache(mockRequest('http://localhost:5173/logo.png'))).toBe(false);
    });
  });

  describe('isUploadRequest', () => {
    it('detects /uploads/ paths', () => {
      expect(isUploadRequest(mockRequest('http://localhost:6060/uploads/ktm/a.jpg'))).toBe(true);
      expect(isUploadRequest(mockRequest('http://localhost:5173/js/app.js'))).toBe(false);
    });
  });

  describe('isStaticAsset / isImageRequest', () => {
    it('classifies file extensions correctly', () => {
      expect(isStaticAsset(mockRequest('http://localhost:5173/js/app.js'))).toBe(true);
      expect(isImageRequest(mockRequest('http://localhost:5173/logo.webp'))).toBe(true);
      expect(isStaticAsset(mockRequest('http://localhost:5173/logo.webp'))).toBe(false);
      expect(isImageRequest(mockRequest('http://localhost:5173/js/app.js'))).toBe(false);
    });
  });
});
