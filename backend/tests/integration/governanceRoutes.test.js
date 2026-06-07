/**
 * Governance route regression — legacy registerAdmin must be removed.
 */

const request = require('supertest');
const {
  buildApp,
  createAdmin,
  createSuperAdmin,
  createUser,
  authHeader,
} = require('./helpers');

describe('governance route regression', () => {
  const app = buildApp();

  test('POST /auth/registerAdmin returns 404', async () => {
    const admin = await createAdmin({ isVerified: true });

    const res = await request(app)
      .post('/v1/api/auth/registerAdmin')
      .set(authHeader(admin))
      .send({
        name: 'New Admin',
        email: `newadmin${Date.now()}@kampus.ac.id`,
        password: 'Password123!',
      });

    expect(res.status).toBe(404);
  });

  test('governance promote-admin still works for SUPERADMIN', async () => {
    const sa = await createSuperAdmin();
    const student = await createUser({
      isVerified: true,
      email: `promote${Date.now()}@kampus.ac.id`,
    });

    const res = await request(app)
      .post(`/v1/api/admin-governance/users/${student.id}/promote-admin`)
      .set(authHeader(sa));

    expect(res.status).toBe(200);
  });
});
