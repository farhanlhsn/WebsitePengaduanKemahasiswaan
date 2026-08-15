const fs = require('fs');
const path = require('path');
const { getLogger } = require('./logger');

const log = getLogger('utils:fileDisk');

async function deleteFileFromDisk(filePath) {
  if (!filePath) return;
  const resolved = path.isAbsolute(filePath)
    ? filePath
    : path.join(__dirname, '../..', String(filePath).replace(/^\//, ''));
  try {
    await fs.promises.unlink(resolved);
  } catch (err) {
    if (err.code !== 'ENOENT') {
      log.warn('deleteFileFromDisk failed', { filePath: resolved, error: err.message });
    }
  }
}

async function listFilesInDir(dirPath) {
  try {
    const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });
    const files = [];
    for (const entry of entries) {
      const full = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        files.push(...(await listFilesInDir(full)));
      } else {
        files.push(full);
      }
    }
    return files;
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }
}

module.exports = { deleteFileFromDisk, listFilesInDir };
