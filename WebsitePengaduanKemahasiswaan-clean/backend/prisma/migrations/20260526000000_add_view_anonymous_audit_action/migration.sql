-- AlterEnum
-- Add VIEW_ANONYMOUS so admins viewing anonymous reports can be audited
-- without changing the masking policy itself.
ALTER TYPE "AuditAction" ADD VALUE 'VIEW_ANONYMOUS';
