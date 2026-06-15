-- BE-6 SuperAdmin role + per-category admin assignments.
--
-- Schema changes:
--   1. Add SUPERADMIN to UserRole enum.
--   2. Extend AuditEntity / AuditAction enums for the new admin governance flows.
--   3. Create admin_category_assignments table for per-category access control.
--
-- Enum value additions in Postgres are not transactional in older versions and
-- must be issued as separate ALTER TYPE statements.

-- AlterEnum: UserRole
ALTER TYPE "UserRole" ADD VALUE 'SUPERADMIN';

-- AlterEnum: AuditEntity
ALTER TYPE "AuditEntity" ADD VALUE 'CATEGORY';
ALTER TYPE "AuditEntity" ADD VALUE 'ASSIGNMENT';

-- AlterEnum: AuditAction
ALTER TYPE "AuditAction" ADD VALUE 'CREATE';
ALTER TYPE "AuditAction" ADD VALUE 'UPDATE';
ALTER TYPE "AuditAction" ADD VALUE 'PROMOTE_ADMIN';
ALTER TYPE "AuditAction" ADD VALUE 'DEMOTE_ADMIN';
ALTER TYPE "AuditAction" ADD VALUE 'GRANT_CATEGORY';
ALTER TYPE "AuditAction" ADD VALUE 'REVOKE_CATEGORY';

-- CreateTable: admin_category_assignments
CREATE TABLE "admin_category_assignments" (
    "id" SERIAL NOT NULL,
    "adminId" INTEGER NOT NULL,
    "categoryId" INTEGER NOT NULL,
    "assignedById" INTEGER NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_category_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "admin_category_assignments_adminId_categoryId_key"
    ON "admin_category_assignments"("adminId", "categoryId");

-- CreateIndex
CREATE INDEX "admin_category_assignments_adminId_idx"
    ON "admin_category_assignments"("adminId");

-- CreateIndex
CREATE INDEX "admin_category_assignments_categoryId_idx"
    ON "admin_category_assignments"("categoryId");

-- AddForeignKey: admin (User) — cascade so removing user cleans up assignments
ALTER TABLE "admin_category_assignments"
    ADD CONSTRAINT "admin_category_assignments_adminId_fkey"
    FOREIGN KEY ("adminId") REFERENCES "users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: category — cascade so removing category cleans up assignments
ALTER TABLE "admin_category_assignments"
    ADD CONSTRAINT "admin_category_assignments_categoryId_fkey"
    FOREIGN KEY ("categoryId") REFERENCES "categories"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: assignedBy (User) — restrict so we don't lose audit context
ALTER TABLE "admin_category_assignments"
    ADD CONSTRAINT "admin_category_assignments_assignedById_fkey"
    FOREIGN KEY ("assignedById") REFERENCES "users"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
