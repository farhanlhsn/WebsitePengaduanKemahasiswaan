-- Maintenance migration: invalidate all sessions and switch to hashed token storage.
TRUNCATE TABLE "refresh_tokens", "password_reset_tokens" RESTART IDENTITY CASCADE;

ALTER TABLE "refresh_tokens" DROP COLUMN "token";
ALTER TABLE "refresh_tokens" ADD COLUMN "tokenHash" VARCHAR(64) NOT NULL;
CREATE UNIQUE INDEX "refresh_tokens_tokenHash_key" ON "refresh_tokens"("tokenHash");

ALTER TABLE "password_reset_tokens" DROP COLUMN "token";
ALTER TABLE "password_reset_tokens" ADD COLUMN "tokenHash" VARCHAR(64) NOT NULL;
CREATE UNIQUE INDEX "password_reset_tokens_tokenHash_key" ON "password_reset_tokens"("tokenHash");
