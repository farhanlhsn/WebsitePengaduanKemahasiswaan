-- Add client-generated idempotency key to prevent duplicate messages on retry.
ALTER TABLE "messages" ADD COLUMN "clientMessageId" VARCHAR(64);

CREATE UNIQUE INDEX "messages_reportId_senderId_clientMessageId_key"
  ON "messages"("reportId", "senderId", "clientMessageId")
  WHERE "clientMessageId" IS NOT NULL;
