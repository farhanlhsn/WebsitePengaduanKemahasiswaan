/**
 * reconcileOrphanChatPendingFiles membandingkan berkas di disk dengan baris
 * DB. DB menyimpan path publik, disk mengembalikan path absolut — keduanya
 * harus dicocokkan per nama berkas, bukan string utuh.
 */

const path = require('path');

jest.mock('../../../src/utils/prisma', () => ({
  chatPendingUpload: { findMany: jest.fn() },
}));
jest.mock('../../../src/utils/fileDisk', () => ({
  deleteFileFromDisk: jest.fn(),
  listFilesInDir: jest.fn(),
}));
jest.mock('../../../src/utils/logger', () => ({
  getLogger: () => ({ info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() }),
}));

const fs = require('fs');
const prisma = require('../../../src/utils/prisma');
const { deleteFileFromDisk, listFilesInDir } = require('../../../src/utils/fileDisk');
const { reconcileOrphanChatPendingFiles, CHAT_PENDING_DIR } = require('../../../src/services/chatPendingUploadService');

test('keeps files that still have a pending row; removes old orphans only', async () => {
  const known = path.join(CHAT_PENDING_DIR, 'aaa.png');
  const orphan = path.join(CHAT_PENDING_DIR, 'bbb.png');
  listFilesInDir.mockResolvedValue([known, orphan]);
  prisma.chatPendingUpload.findMany.mockResolvedValue([{ filePath: '/uploads/chat-pending/aaa.png' }]);
  const old = Date.now() - 2 * 60 * 60 * 1000;
  jest.spyOn(fs.promises, 'stat').mockResolvedValue({ mtimeMs: old });

  const removed = await reconcileOrphanChatPendingFiles();

  expect(removed).toBe(1);
  expect(deleteFileFromDisk).toHaveBeenCalledTimes(1);
  expect(deleteFileFromDisk).toHaveBeenCalledWith(orphan);
});
