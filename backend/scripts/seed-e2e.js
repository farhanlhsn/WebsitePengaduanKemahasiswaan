/**
 * Idempotent seed for Playwright E2E tests.
 * Creates known test users and ensures at least one category exists.
 *
 * Usage:
 *   DATABASE_URL=... node scripts/seed-e2e.js
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const E2E_STUDENT = {
  email: 'e2e.student@mahasiswa.bunghatta.ac.id',
  name: 'E2E Mahasiswa',
  nim: '2021999901',
  password: 'E2eTest123!',
  role: 'MAHASISWA',
};

const E2E_ADMIN = {
  email: 'e2e.admin@kampus.ac.id',
  name: 'E2E Super Admin',
  password: 'E2eTest123!',
  role: 'SUPERADMIN',
};

async function ensureCategory() {
  const existing = await prisma.category.findFirst({
    where: { slug: 'akademik' },
  });
  if (existing) return existing;

  return prisma.category.create({
    data: {
      name: 'Akademik',
      slug: 'akademik',
      defaultPriority: 'MEDIUM',
      allowAnonymous: false,
    },
  });
}

async function upsertUser({ email, name, password, role, nim = null, isVerified = true }) {
  const hash = await bcrypt.hash(password, 10);
  const user = await prisma.user.upsert({
    where: { email },
    update: {
      name,
      password: hash,
      role,
      nim,
      isVerified,
      deletedAt: null,
      tokenVersion: 0,
    },
    create: {
      email,
      name,
      password: hash,
      role,
      nim,
      isVerified,
    },
  });

  await prisma.refreshToken.deleteMany({ where: { userId: user.id } });
  await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });

  return user;
}

async function main() {
  console.log('[seed-e2e] Ensuring E2E fixtures...');

  const category = await ensureCategory();
  const student = await upsertUser(E2E_STUDENT);
  const admin = await upsertUser(E2E_ADMIN);

  console.log('[seed-e2e] Ready:', {
    categoryId: category.id,
    studentId: student.id,
    adminId: admin.id,
    studentEmail: E2E_STUDENT.email,
    adminEmail: E2E_ADMIN.email,
  });
}

main()
  .catch((err) => {
    console.error('[seed-e2e] Failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
