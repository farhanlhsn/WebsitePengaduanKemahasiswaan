/**
 * Tests for deviceTrackingMiddleware IP handling (audit finding S1).
 *
 * The middleware must NOT override req.ip from the raw X-Forwarded-For header,
 * because the first element of that header is client-controllable and would let
 * an attacker bypass IP-keyed rate limiters by rotating the header.
 */

const deviceTrackingMiddleware = require('../../../src/middlewares/deviceTrackingMiddleware');

function makeReq(overrides = {}) {
  return {
    headers: { 'user-agent': 'Mozilla/5.0', 'accept-language': 'id-ID', ...overrides.headers },
    ip: '203.0.113.7', // nilai yang sudah dihitung Express (trust-proxy-aware)
    socket: { remoteAddress: '203.0.113.7' },
    ...overrides,
  };
}

describe('deviceTrackingMiddleware (audit S1)', () => {
  test('does NOT override req.ip even when X-Forwarded-For is present', () => {
    const req = makeReq({ headers: { 'x-forwarded-for': '1.2.3.4, 10.0.0.1' } });
    const next = jest.fn();

    deviceTrackingMiddleware(req, {}, next);

    // req.ip harus tetap nilai dari Express, bukan elemen pertama XFF.
    expect(req.ip).toBe('203.0.113.7');
    expect(req.ip).not.toBe('1.2.3.4');
    expect(next).toHaveBeenCalled();
  });

  test('deviceInfo.ipAddress uses req.ip, not the raw header', () => {
    const req = makeReq({ headers: { 'x-forwarded-for': '9.9.9.9' } });
    deviceTrackingMiddleware(req, {}, jest.fn());

    expect(req.deviceInfo.ipAddress).toBe('203.0.113.7');
    expect(req.deviceInfo.ipAddress).not.toBe('9.9.9.9');
  });

  test('still populates deviceInfo fields', () => {
    const req = makeReq();
    deviceTrackingMiddleware(req, {}, jest.fn());

    expect(req.deviceInfo.deviceId).toEqual(expect.any(String));
    expect(req.deviceInfo.deviceId).toHaveLength(32);
    expect(req.deviceInfo.userAgent).toContain('Mozilla');
  });
});
