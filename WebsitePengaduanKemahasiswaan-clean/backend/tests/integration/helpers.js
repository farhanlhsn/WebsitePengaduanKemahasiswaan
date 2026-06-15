/**
 * Test helpers shared across integration suites.
 *
 * Provides:
 *   - app(): a configured Express instance ready for supertest. We mount the
 *     same routes as src/app.js but skip the global rate limiters / Socket.IO
 *     wiring that aren't relevant to these tests.
 *   - createUser(): create a user with sane defaults (verified MAHASISWA).
 *   - createAdmin(), createSuperAdmin().
 *   - issueToken(): sign an access token compatible with authMiddleware.
 *   - createCategory().
 */

const express = require('express');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

function buildApp() {
  // Lightweight app: only the body parser and the routes we want to exercise.
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use('/v1/api/auth', require('../../src/routes/authRoutes'));
  app.use('/v1/api/categories', require('../../src/routes/categoryRoutes'));
  app.use('/v1/api/reports', require('../../src/routes/reportRoutes'));
  app.use('/v1/api/chat', require('../../src/routes/chatRoutes'));
  app.use('/v1/api/audit-logs', require('../../src/routes/auditLogRoutes'));
  app.use('/v1/api/admin', require('../../src/routes/adminRoutes'));
  app.use('/v1/api/admin-governance', require('../../src/routes/adminGovernanceRoutes'));
  return app;
}

async function createUser({
  name = 'Test Mahasiswa',
  email = `m${Date.now()}@kampus.ac.id`,
  password = 'Password123!',
  role = 'MAHASISWA',
  isVerified = true,
  nim = null,
} = {}) {
  const hash = await bcrypt.hash(password, 10);
  return prisma.user.create({
    data: {
      name,
      email,
      password: hash,
      role,
      isVerified,
      nim,
    },
  });
}

async function createAdmin(overrides = {}) {
  return createUser({
    name: 'Test Admin',
    email: `admin${Date.now()}${Math.random().toString(16).slice(2, 6)}@kampus.ac.id`,
    role: 'ADMIN',
    ...overrides,
  });
}

async function createSuperAdmin(overrides = {}) {
  return createUser({
    name: 'Test SuperAdmin',
    email: `sa${Date.now()}${Math.random().toString(16).slice(2, 6)}@kampus.ac.id`,
    role: 'SUPERADMIN',
    ...overrides,
  });
}

function issueToken(user) {
  return jwt.sign(
    { userId: user.id, role: user.role, name: user.name, tokenVersion: user.tokenVersion ?? 0 },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );
}

function authHeader(user) {
  return { Authorization: `Bearer ${issueToken(user)}` };
}

async function createCategory({
  name,
  slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
  defaultPriority = 'MEDIUM',
  allowAnonymous = false,
} = {}) {
  return prisma.category.create({
    data: { name, slug, defaultPriority, allowAnonymous },
  });
}

async function grantCategory(adminId, categoryId, grantorId) {
  return prisma.adminCategoryAssignment.create({
    data: { adminId, categoryId, assignedById: grantorId },
  });
}

module.exports = {
  prisma,
  buildApp,
  createUser,
  createAdmin,
  createSuperAdmin,
  issueToken,
  authHeader,
  createCategory,
  grantCategory,
};
