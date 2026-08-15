/**
 * Tests for mass-assignment protection on PUT /users/:id (audit finding C2).
 *
 * An ADMIN managing a MAHASISWA target must only be able to change
 * name/email/nim. Privileged fields (role, password, isVerified,
 * tokenVersion, deletedAt, ktmPath) must never reach the data layer.
 */

jest.mock('../../../src/services/userServices');
jest.mock('../../../src/services/auditLogServices', () => ({
  createAuditLog: jest.fn().mockResolvedValue({}),
}));
jest.mock('../../../src/services/emailService', () => ({}));
jest.mock('../../../src/utils/userGovernancePolicy', () => {
  class UserGovernanceError extends Error {
    constructor(message, statusCode = 403, code = 'GOVERNANCE') {
      super(message);
      this.statusCode = statusCode;
      this.code = code;
    }
  }
  return {
    UserGovernanceError,
    assertCanManageUser: jest.fn().mockResolvedValue(undefined),
    getTargetUserOrThrow: jest.fn(),
    filterUsersForActor: jest.fn((actor, users) => users),
  };
});
jest.mock('../../../src/utils/accessPolicy', () => ({
  canAccessUser: jest.fn(() => true),
}));
jest.mock('../../../src/utils/logger', () => ({
  getLogger: () => ({ info: jest.fn(), warn: jest.fn(), error: jest.fn() }),
}));

const userControllers = require('../../../src/controllers/userControllers');
const userServices = require('../../../src/services/userServices');
const auditLogServices = require('../../../src/services/auditLogServices');
const { getTargetUserOrThrow } = require('../../../src/utils/userGovernancePolicy');

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

const MAHASISWA_TARGET = {
  id: 42,
  name: 'Mahasiswa',
  email: 'mhs@mahasiswa.ac.id',
  role: 'MAHASISWA',
  isVerified: true,
  deletedAt: null,
};

const ADMIN_ACTOR = { userId: 1, role: 'ADMIN', name: 'Admin' };

describe('updateUser mass-assignment protection (controller)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getTargetUserOrThrow.mockResolvedValue(MAHASISWA_TARGET);
    userServices.updateUser.mockResolvedValue({ ...MAHASISWA_TARGET, password: 'hash' });
  });

  test('privileged fields are stripped — only whitelisted fields reach service', async () => {
    const req = {
      params: { id: '42' },
      user: ADMIN_ACTOR,
      ip: '127.0.0.1',
      headers: {},
      body: {
        name: 'Nama Baru',
        email: 'baru@mahasiswa.ac.id',
        nim: '12345678',
        // Injection attempts:
        role: 'SUPERADMIN',
        password: '$2a$10$attacker-controlled-hash',
        isVerified: true,
        tokenVersion: 999,
        deletedAt: null,
        ktmPath: '/uploads/ktm/fake.jpg',
      },
    };
    const res = mockRes();

    await userControllers.updateUser(req, res);

    expect(userServices.updateUser).toHaveBeenCalledTimes(1);
    const [calledId, calledData] = userServices.updateUser.mock.calls[0];
    expect(calledId).toBe(42);
    expect(calledData).toEqual({
      name: 'Nama Baru',
      email: 'baru@mahasiswa.ac.id',
      nim: '12345678',
    });
    expect(calledData.role).toBeUndefined();
    expect(calledData.password).toBeUndefined();
    expect(calledData.isVerified).toBeUndefined();
    expect(calledData.tokenVersion).toBeUndefined();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('body containing ONLY privileged fields is rejected with 400', async () => {
    const req = {
      params: { id: '42' },
      user: ADMIN_ACTOR,
      ip: '127.0.0.1',
      headers: {},
      body: { role: 'SUPERADMIN', password: 'x', isVerified: true },
    };
    const res = mockRes();

    await userControllers.updateUser(req, res);

    expect(userServices.updateUser).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('successful update writes an audit log with updated fields', async () => {
    const req = {
      params: { id: '42' },
      user: ADMIN_ACTOR,
      ip: '127.0.0.1',
      headers: { 'user-agent': 'jest' },
      body: { name: 'Nama Baru' },
    };
    const res = mockRes();

    await userControllers.updateUser(req, res);

    expect(auditLogServices.createAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        entityType: 'USER',
        action: 'UPDATE',
        entityId: 42,
        actorId: 1,
        metadata: expect.objectContaining({ updatedFields: ['name'] }),
      })
    );
  });

  test('password is never returned in the response body', async () => {
    const req = {
      params: { id: '42' },
      user: ADMIN_ACTOR,
      ip: '127.0.0.1',
      headers: {},
      body: { name: 'Nama Baru' },
    };
    const res = mockRes();

    await userControllers.updateUser(req, res);

    const payload = res.json.mock.calls[0][0];
    expect(payload.data.password).toBeUndefined();
  });
});
