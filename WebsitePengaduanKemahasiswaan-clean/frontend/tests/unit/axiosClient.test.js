import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';

vi.mock('../../src/utils/fingerprint', () => ({
  getOrCreateDeviceFingerprint: () => 'test-fingerprint',
}));

vi.mock('../../src/services/authToken', () => ({
  getAccessToken: vi.fn(() => 'stale-token'),
  setAccessToken: vi.fn(),
  clearAccessToken: vi.fn(),
}));

describe('axiosClient single-flight refresh', () => {
  let mock;
  let refreshCallCount;

  beforeEach(async () => {
    vi.resetModules();
    refreshCallCount = 0;

    const { refreshClient } = await import('../../src/services/axiosClient');
    mock = new MockAdapter(refreshClient);

    mock.onPost('/auth/refresh-token').reply(() => {
      refreshCallCount += 1;
      return [200, { accessToken: 'new-token' }];
    });
  });

  afterEach(() => {
    mock?.restore();
    vi.restoreAllMocks();
  });

  it('deduplicates concurrent 401 refresh attempts', async () => {
    const { apiClient } = await import('../../src/services/axiosClient');
    const apiMock = new MockAdapter(apiClient);

    apiMock.onGet('/reports').replyOnce(401).onGet('/reports').reply(200, { data: [] });
    apiMock.onGet('/users').replyOnce(401).onGet('/users').reply(200, { data: [] });

    const [r1, r2] = await Promise.all([
      apiClient.get('/reports'),
      apiClient.get('/users'),
    ]);

    expect(refreshCallCount).toBe(1);
    expect(r1.status).toBe(200);
    expect(r2.status).toBe(200);

    apiMock.restore();
  });
});
