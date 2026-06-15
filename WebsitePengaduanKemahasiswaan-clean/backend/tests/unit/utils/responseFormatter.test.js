const ResponseFormatter = require('../../../src/utils/responseFormatter');

describe('ResponseFormatter', () => {
  describe('success()', () => {
    test('returns standard envelope with default message', () => {
      const r = ResponseFormatter.success({ id: 1 });
      expect(r).toEqual({
        status: 'success',
        statusCode: 200,
        message: 'Success',
        data: { id: 1 },
        timestamp: expect.any(String),
      });
      expect(new Date(r.timestamp).toString()).not.toBe('Invalid Date');
    });

    test('respects custom message and status code', () => {
      const r = ResponseFormatter.success(null, 'Created', 201);
      expect(r.statusCode).toBe(201);
      expect(r.message).toBe('Created');
      expect(r.data).toBeNull();
    });
  });

  describe('error()', () => {
    test('defaults to 500 with generic message', () => {
      const r = ResponseFormatter.error();
      expect(r).toMatchObject({
        status: 'error',
        statusCode: 500,
        message: 'Internal Server Error',
        errors: null,
      });
    });

    test('passes through custom status, message and errors', () => {
      const r = ResponseFormatter.error('Forbidden', 403, { reason: 'rbac' });
      expect(r.statusCode).toBe(403);
      expect(r.message).toBe('Forbidden');
      expect(r.errors).toEqual({ reason: 'rbac' });
    });
  });

  describe('validation()', () => {
    test('always returns 400 with provided errors', () => {
      const r = ResponseFormatter.validation({ email: 'required' });
      expect(r.statusCode).toBe(400);
      expect(r.message).toBe('Validation Error');
      expect(r.errors).toEqual({ email: 'required' });
    });
  });
});
