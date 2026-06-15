-- CreateTable
CREATE TABLE "chat_pending_uploads" (
    "id" SERIAL NOT NULL,
    "token" VARCHAR(64) NOT NULL,
    "reportId" INTEGER NOT NULL,
    "uploaderId" INTEGER NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_pending_uploads_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "chat_pending_uploads_token_key" ON "chat_pending_uploads"("token");

-- CreateIndex
CREATE INDEX "chat_pending_uploads_reportId_uploaderId_idx" ON "chat_pending_uploads"("reportId", "uploaderId");

-- CreateIndex
CREATE INDEX "chat_pending_uploads_expiresAt_idx" ON "chat_pending_uploads"("expiresAt");

-- AddForeignKey
ALTER TABLE "chat_pending_uploads" ADD CONSTRAINT "chat_pending_uploads_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "reports"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_pending_uploads" ADD CONSTRAINT "chat_pending_uploads_uploaderId_fkey" FOREIGN KEY ("uploaderId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
