const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const prisma = require('../utils/prisma');
const { sanitizeOriginalName } = require('../utils/fileValidation');

const CHAT_ATTACHMENTS_DIR = path.join(__dirname, '../../uploads/chat/attachments');
fs.mkdirSync(CHAT_ATTACHMENTS_DIR, { recursive: true });

function resolveUploadDiskPath(relativePath) {
  return path.join(__dirname, '../..', String(relativePath).replace(/^\//, ''));
}

async function promotePendingToAttachment(pending) {
  const filename = path.basename(pending.filePath);
  const src = resolveUploadDiskPath(pending.filePath);
  const dest = path.join(CHAT_ATTACHMENTS_DIR, filename);
  await fs.promises.rename(src, dest);
  return `/uploads/chat/attachments/${filename}`;
}
const { deleteFileFromDisk, listFilesInDir } = require('../utils/fileDisk');
const { chatError } = require('../utils/chatErrors');
const { getLogger } = require('../utils/logger');

const log = getLogger('chat:pendingUpload');

const MAX_PENDING_PER_USER_REPORT = 10;
const MAX_FILES_PER_MESSAGE = 5;
const MAX_TOTAL_ATTACHMENT_SIZE = 25 * 1024 * 1024;
const PENDING_TTL_MS = 24 * 60 * 60 * 1000;
const CHAT_PENDING_DIR = path.join(__dirname, '../../uploads/chat-pending');

function generateUploadToken() {
  return crypto.randomBytes(32).toString('hex');
}

function toPublicDto(record) {
  return {
    token: record.token,
    fileName: record.fileName,
    fileType: record.fileType,
    fileSize: record.fileSize,
    expiresAt: record.expiresAt,
  };
}

function validateAttachmentTokens(tokens) {
  if (!Array.isArray(tokens)) {
    throw chatError('INVALID_ATTACHMENT', 400);
  }
  if (tokens.length > MAX_FILES_PER_MESSAGE) {
    throw chatError('TOO_MANY_ATTACHMENTS', 400);
  }
  for (const t of tokens) {
    if (typeof t !== 'string' || t.length !== 64 || !/^[a-f0-9]+$/.test(t)) {
      throw chatError('INVALID_ATTACHMENT', 400);
    }
  }
  if (new Set(tokens).size !== tokens.length) {
    throw chatError('INVALID_ATTACHMENT', 400);
  }
}

async function assertPendingLimit(reportId, uploaderId) {
  const count = await prisma.chatPendingUpload.count({
    where: {
      reportId,
      uploaderId,
      expiresAt: { gt: new Date() },
    },
  });
  if (count >= MAX_PENDING_PER_USER_REPORT) {
    throw chatError('PENDING_UPLOAD_LIMIT', 429);
  }
}

fs.mkdirSync(CHAT_ATTACHMENTS_DIR, { recursive: true });

async function createPendingUploadRecords(files, reportId, uploaderId) {
  await assertPendingLimit(reportId, uploaderId);

  const expiresAt = new Date(Date.now() + PENDING_TTL_MS);

  return prisma.$transaction(
    files.map((file) =>
      prisma.chatPendingUpload.create({
        data: {
          token: generateUploadToken(),
          reportId,
          uploaderId,
          filePath: `/uploads/chat-pending/${file.filename}`,
          fileName: sanitizeOriginalName(file.originalname),
          fileType: file.mimetype,
          fileSize: file.size,
          expiresAt,
        },
      })
    )
  );
}

async function deletePendingRecords(where) {
  const pendings = await prisma.chatPendingUpload.findMany({ where });
  for (const p of pendings) {
    try {
      await prisma.chatPendingUpload.delete({ where: { id: p.id } });
      await deleteFileFromDisk(p.filePath);
    } catch (err) {
      log.warn('deletePendingRecords failed', { id: p.id, error: err.message });
    }
  }
}

async function deletePendingUploadsByReport(reportId) {
  return deletePendingRecords({ reportId });
}

async function deletePendingUploadsByUploader(uploaderId) {
  return deletePendingRecords({ uploaderId });
}

async function cleanupExpiredChatPendingUploads() {
  // Audit L1: proses sampai habis per run (batch 500), jangan berhenti di 100
  // pertama — backlog akan menumpuk bila traffic upload tinggi.
  const BATCH = 500;
  const MAX_BATCHES = 20;
  let deleted = 0;

  for (let i = 0; i < MAX_BATCHES; i++) {
    const expired = await prisma.chatPendingUpload.findMany({
      where: { expiresAt: { lt: new Date() } },
      take: BATCH,
    });
    if (expired.length === 0) break;

    for (const pending of expired) {
      try {
        await prisma.chatPendingUpload.delete({ where: { id: pending.id } });
        await deleteFileFromDisk(pending.filePath);
        deleted++;
      } catch (err) {
        if (err.code === 'P2025') continue;
        log.warn('cleanup expired pending failed', { id: pending.id, error: err.message });
      }
    }

    if (expired.length < BATCH) break;
  }
  return deleted;
}

async function reconcileOrphanChatPendingFiles() {
  const filesOnDisk = await listFilesInDir(CHAT_PENDING_DIR);
  const known = await prisma.chatPendingUpload.findMany({ select: { filePath: true } });
  const knownSet = new Set(known.map((p) => p.filePath));

  // Audit L1: grace period — file yang baru dibuat (< 1 jam) bisa saja belum
  // punya baris DB karena transaksi upload belum commit saat job berjalan.
  const GRACE_MS = 60 * 60 * 1000;
  const now = Date.now();

  let removed = 0;
  for (const filePath of filesOnDisk) {
    if (knownSet.has(filePath)) continue;
    try {
      const stat = await fs.promises.stat(filePath);
      if (now - stat.mtimeMs < GRACE_MS) continue;
    } catch (err) {
      continue; // file hilang duluan / tidak terbaca — lewati
    }
    await deleteFileFromDisk(filePath);
    removed++;
  }
  return removed;
}

module.exports = {
  MAX_FILES_PER_MESSAGE,
  MAX_TOTAL_ATTACHMENT_SIZE,
  CHAT_PENDING_DIR,
  generateUploadToken,
  toPublicDto,
  validateAttachmentTokens,
  createPendingUploadRecords,
  deletePendingUploadsByReport,
  deletePendingUploadsByUploader,
  cleanupExpiredChatPendingUploads,
  reconcileOrphanChatPendingFiles,
  promotePendingToAttachment,
};
