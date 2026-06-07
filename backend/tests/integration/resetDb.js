/**
 * Per-test cleanup: truncate all data tables (preserving schema and enum
 * values) so each test starts with a clean state but doesn't pay the cost
 * of re-running migrations.
 *
 * Order matters because of FK constraints; safer to use TRUNCATE ... CASCADE.
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

beforeEach(async () => {
  // Reset data before each test so suites start from a clean slate.
  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE
      "admin_category_assignments",
      "chat_pending_uploads",
      "attachments",
      "messages",
      "refresh_tokens",
      "password_reset_tokens",
      "AuditLog",
      "reports",
      "categories",
      "users"
    RESTART IDENTITY CASCADE;
  `);
});

afterAll(async () => {
  await prisma.$disconnect();
});
