const isSuperAdminMiddleware = require('../../src/middlewares/isSuperAdminMiddleware');

function makeRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('isSuperAdminMiddleware', () => {
  test('rejects when no user is attached (401)', () => {
    const req = {};
    const res = makeRes();
    const next = jest.fn();
    isSuperAdminMiddleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test('rejects MAHASISWA with 403', () => {
    const req = { user: { userId: 1, role: 'MAHASISWA' } };
    const res = makeRes();
    const next = jest.fn();
    isSuperAdminMiddleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  test('rejects ADMIN with 403 (ADMIN is NOT a SUPERADMIN)', () => {
    const req = { user: { userId: 1, role: 'ADMIN' } };
    const res = makeRes();
    const next = jest.fn();
    isSuperAdminMiddleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  test('allows SUPERADMIN through to next()', () => {
    const req = { user: { userId: 1, role: 'SUPERADMIN' } };
    const res = makeRes();
    const next = jest.fn();
    isSuperAdminMiddleware(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });
});
