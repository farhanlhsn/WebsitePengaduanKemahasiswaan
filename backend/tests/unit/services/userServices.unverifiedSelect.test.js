/**
 * Regression: daftar akun belum terverifikasi dulu memakai findMany tanpa
 * `select`, sehingga hash password dan tokenVersion ikut terkirim ke admin.
 */
jest.mock('../../../src/utils/prisma', () => ({ user: {} }));
jest.mock('../../../src/utils/softDelete', () => ({ findMany: jest.fn() }));
jest.mock('../../../src/utils/logger', () => ({
  getLogger: () => ({ info: jest.fn(), warn: jest.fn(), error: jest.fn() }),
}));

const SoftDeleteHelper = require('../../../src/utils/softDelete');
const userServices = require('../../../src/services/userServices');

describe('unverified user lists never select secrets', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    SoftDeleteHelper.findMany.mockResolvedValue([]);
  });

  test.each([
    ['getUnverifiedStudent'],
    ['getUnverifiedAdmin'],
  ])('%s uses an explicit select without password or tokenVersion', async (fn) => {
    await userServices[fn]();
    const query = SoftDeleteHelper.findMany.mock.calls[0][1];
    expect(query.select).toBeDefined();
    expect(query.select.password).toBeUndefined();
    expect(query.select.tokenVersion).toBeUndefined();
    expect(query.select.ktmPath).toBe(true);
  });
});
