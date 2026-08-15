jest.mock('../../src/utils/logger', () => ({
  getLogger: () => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  })
}));

const isAdminMiddleware = require('../../src/middlewares/isAdminMiddleware');

describe('isAdminMiddleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = { user: { userId: 1, role: 'ADMIN' }, originalUrl: '/test' };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
  });

  it('should return 401 if no user in request', () => {
    req.user = null;
    isAdminMiddleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 403 for non-admin users', () => {
    req.user.role = 'MAHASISWA';
    isAdminMiddleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('should call next for admin users', () => {
    req.user.role = 'ADMIN';
    isAdminMiddleware(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('should call next for SUPERADMIN users (BE-6: SUPERADMIN superset of ADMIN)', () => {
    req.user.role = 'SUPERADMIN';
    isAdminMiddleware(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });
});
