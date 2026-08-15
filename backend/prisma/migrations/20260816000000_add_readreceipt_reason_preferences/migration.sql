-- Audit M2: read receipt per-user. Satu baris per (pesan, pembaca) menggantikan
-- ketergantungan pada flag tunggal messages.isRead (yang membuat unread hilang
-- untuk semua admin begitu satu admin membaca).
CREATE TABLE "message_reads" (
    "id" SERIAL NOT NULL,
    "messageId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "readAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "message_reads_pkey" PRIMARY KEY ("id")
);

-- Alasan penutupan laporan (sebelumnya hanya tersimpan di metadata audit log).
ALTER TABLE "reports" ADD COLUMN "rejectedReason" TEXT;
ALTER TABLE "reports" ADD COLUMN "canceledReason" TEXT;

-- Preferensi pengguna per akun (tema, bahasa, notifikasi) — tidak lagi hanya
-- di localStorage browser.
ALTER TABLE "users" ADD COLUMN "preferences" JSONB;

-- Index & constraint untuk message_reads
CREATE UNIQUE INDEX "message_reads_messageId_userId_key" ON "message_reads"("messageId", "userId");
CREATE INDEX "message_reads_userId_idx" ON "message_reads"("userId");

ALTER TABLE "message_reads" ADD CONSTRAINT "message_reads_messageId_fkey"
    FOREIGN KEY ("messageId") REFERENCES "messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "message_reads" ADD CONSTRAINT "message_reads_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
