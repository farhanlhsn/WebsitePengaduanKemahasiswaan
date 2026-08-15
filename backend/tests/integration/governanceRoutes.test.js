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

describe('user directory restriction (audit C1/B5)', () => {
  const app = buildApp();

  test('regular ADMIN can read a MAHASISWA profile', async () => {
    const admin = await createAdmin();
    const student = await createUser({ email: `dir-mhs${Date.now()}@kampus.ac.id` });

    const res = await request(app)
      .get(`/v1/api/users/${student.id}`)
      .set(authHeader(admin));

    expect(res.status).toBe(200);
  });

  test('regular ADMIN cannot read another ADMIN profile', async () => {
    const admin = await createAdmin();
    const otherAdmin = await createAdmin({ email: `dir-adm${Date.now()}@kampus.ac.id` });

    const res = await request(app)
      .get(`/v1/api/users/${otherAdmin.id}`)
      .set(authHeader(admin));

    expect(res.status).toBe(403);
  });

  test('regular ADMIN cannot read SUPERADMIN profile', async () => {
    const admin = await createAdmin();
    const sa = await createSuperAdmin();

    const res = await request(app)
      .get(`/v1/api/users/${sa.id}`)
      .set(authHeader(admin));

    expect(res.status).toBe(403);
  });

  test('SUPERADMIN can read any profile', async () => {
    const sa = await createSuperAdmin();
    const admin = await createAdmin({ email: `dir-adm2${Date.now()}@kampus.ac.id` });

    const res = await request(app)
      .get(`/v1/api/users/${admin.id}`)
      .set(authHeader(sa));

    expect(res.status).toBe(200);
  });

  test('MAHASISWA cannot read another user profile', async () => {
    const student = await createUser({ email: `dir-s1${Date.now()}@kampus.ac.id` });
    const other = await createUser({ email: `dir-s2${Date.now()}@kampus.ac.id` });

    const res = await request(app)
      .get(`/v1/api/users/${other.id}`)
      .set(authHeader(student));

    expect(res.status).toBe(403);
  });

  test('MAHASISWA can read own profile', async () => {
    const student = await createUser({ email: `dir-self${Date.now()}@kampus.ac.id` });

    const res = await request(app)
      .get(`/v1/api/users/${student.id}`)
      .set(authHeader(student));

    expect(res.status).toBe(200);
  });
});
