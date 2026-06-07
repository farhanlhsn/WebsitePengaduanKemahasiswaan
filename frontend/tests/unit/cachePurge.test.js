import { describe, it, expect, vi, beforeEach } from 'vitest';
import { purgeSensitiveCaches } from '../../src/utils/cachePurge.js';

describe('purgeSensitiveCaches', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('deletes dynamic and legacy caches but keeps static shell cache', async () => {
    const deleted = [];
    const mockCaches = {
      keys: vi.fn().mockResolvedValue([
        'static-v2',
        'static-v1',
        'dynamic-v1',
        'dynamic-v2',
        'images-v2',
        'ubh-pengaduan-v1',
      ]),
      delete: vi.fn((name) => {
        deleted.push(name);
        return Promise.resolve(true);
      }),
    };

    vi.stubGlobal('caches', mockCaches);

    await purgeSensitiveCaches();

    expect(deleted).toEqual([
      'dynamic-v1',
      'dynamic-v2',
      'images-v2',
      'ubh-pengaduan-v1',
    ]);
    expect(deleted).not.toContain('static-v2');
    expect(deleted).not.toContain('static-v1');
  });

  it('no-ops when Cache Storage is unavailable', async () => {
    vi.stubGlobal('caches', undefined);
    await expect(purgeSensitiveCaches()).resolves.toBeUndefined();
  });

  it('swallows cache deletion errors', async () => {
    vi.stubGlobal('caches', {
      keys: vi.fn().mockRejectedValue(new Error('denied')),
    });
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    await expect(purgeSensitiveCaches()).resolves.toBeUndefined();
    expect(warnSpy).toHaveBeenCalled();
  });
});
