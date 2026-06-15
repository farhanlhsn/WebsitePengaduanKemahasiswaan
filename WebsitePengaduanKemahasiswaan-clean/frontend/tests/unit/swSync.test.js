import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it, expect } from 'vitest';
import {
  isApiRequest,
  isStaticAsset,
  isImageRequest,
  getFetchStrategy,
} from '../../src/utils/swRequestPolicy.js';

const swSource = readFileSync(resolve(process.cwd(), 'public/sw.js'), 'utf8');

function mockRequest(url) {
  return { url };
}

describe('sw.js ↔ swRequestPolicy.js sync', () => {
  it('sw.js contains the same API path prefixes', () => {
    expect(swSource).toContain("path.startsWith('/api/')");
    expect(swSource).toContain("path.startsWith('/v1/api/')");
  });

  it('sw.js mirrors static and image extension checks', () => {
    expect(swSource).toContain('(js|css|woff2?|ttf|eot)');
    expect(swSource).toContain('(png|jpg|jpeg|gif|webp|avif|svg)');
  });

  it('policy module classifies representative URLs consistently with sw.js intent', () => {
    const samples = [
      ['http://localhost:6060/v1/api/reports', 'network-only'],
      ['http://localhost:6060/api/health', 'network-only'],
      ['http://localhost:5173/js/app.js', 'cache-first'],
      ['http://localhost:5173/logo.webp', 'cache-first'],
      ['http://localhost:5173/dashboard', 'network-only'],
    ];

    for (const [url, strategy] of samples) {
      expect(getFetchStrategy(mockRequest(url))).toBe(strategy);
    }

    expect(isApiRequest(mockRequest('http://localhost:6060/v1/api/auth/login'))).toBe(true);
    expect(isStaticAsset(mockRequest('http://localhost:5173/app.css'))).toBe(true);
    expect(isImageRequest(mockRequest('http://localhost:5173/x.png'))).toBe(true);
  });

  it('sw.js never caches API or uploads via respondWith cache strategy', () => {
    expect(swSource).toContain('isApiRequest(request) || isUploadRequest(request)');
    expect(swSource).toContain('event.respondWith(fetch(request))');
    expect(swSource).not.toMatch(/isApiRequest[\s\S]{0,120}cacheFirstStrategy/);
    expect(swSource).toContain("path.startsWith('/uploads/')");
  });
});
