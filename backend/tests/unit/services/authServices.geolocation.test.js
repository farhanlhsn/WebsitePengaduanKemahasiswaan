/**
 * Geolokasi IP bersifat opt-in: tanpa IP_GEOLOCATION_ENABLED=true, IP pengguna
 * tidak boleh dikirim ke ip-api.com.
 */

jest.mock('../../../src/utils/prisma', () => ({}));
jest.mock('../../../src/utils/logger', () => ({
  getLogger: () => ({ info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() }),
}));
jest.mock('axios');

const axios = require('axios');
const authServices = require('../../../src/services/authServices');

describe('getLocationFromIP', () => {
  const original = process.env.IP_GEOLOCATION_ENABLED;
  afterEach(() => {
    if (original === undefined) delete process.env.IP_GEOLOCATION_ENABLED;
    else process.env.IP_GEOLOCATION_ENABLED = original;
    jest.clearAllMocks();
  });

  test('disabled by default: no request to the third party', async () => {
    delete process.env.IP_GEOLOCATION_ENABLED;
    await expect(authServices.getLocationFromIP('203.0.113.9')).resolves.toBeNull();
    expect(axios.get).not.toHaveBeenCalled();
  });

  test('enabled explicitly: looks up public IPs', async () => {
    process.env.IP_GEOLOCATION_ENABLED = 'true';
    axios.get.mockResolvedValue({ data: { status: 'success', city: 'Padang', regionName: 'Sumatera Barat' } });
    await expect(authServices.getLocationFromIP('203.0.113.9')).resolves.toBe('Padang, Sumatera Barat');
    expect(axios.get).toHaveBeenCalledTimes(1);
  });
});
