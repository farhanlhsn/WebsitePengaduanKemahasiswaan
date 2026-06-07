const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const REPORT_CHAT_MIMES = Object.freeze({
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
  'application/pdf': ['.pdf'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
});

const KTM_MIMES = Object.freeze({
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
});

const MAGIC = Object.freeze({
  'image/jpeg': [[0xff, 0xd8, 0xff]],
  'image/png': [[0x89, 0x50, 0x4e, 0x47]],
  'image/webp': [[0x52, 0x49, 0x46, 0x46]], // RIFF....WEBP checked below
  'application/pdf': [[0x25, 0x50, 0x44, 0x46]],
  'application/msword': [[0xd0, 0xcf, 0x11, 0xe0]],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [
    [0x50, 0x4b, 0x03, 0x04],
    [0x50, 0x4b, 0x05, 0x06],
    [0x50, 0x4b, 0x07, 0x08],
  ],
});

function sanitizeOriginalName(name) {
  if (!name || typeof name !== 'string') return 'file';
  const base = path.basename(name).replace(/[^\w.\-() ]+/g, '_').slice(0, 200);
  return base || 'file';
}

function extensionForMime(mime, allowedMap) {
  const exts = allowedMap[mime];
  return exts?.[0] || '';
}

function matchesMagic(buffer, mime) {
  const signatures = MAGIC[mime];
  if (!signatures) return false;

  if (mime === 'image/webp') {
    if (buffer.length < 12) return false;
    const riff = signatures[0].every((b, i) => buffer[i] === b);
    const webp = buffer.slice(8, 12).toString('ascii') === 'WEBP';
    return riff && webp;
  }

  return signatures.some((sig) => sig.every((byte, index) => buffer[index] === byte));
}

function validateFileDescriptor(file, allowedMap) {
  if (!file) return { ok: false, error: 'No file uploaded' };

  const mime = file.mimetype;
  const allowedExts = allowedMap[mime];
  if (!allowedExts) {
    return { ok: false, error: 'File type not allowed' };
  }

  const ext = path.extname(file.originalname || '').toLowerCase();
  if (!allowedExts.includes(ext)) {
    return { ok: false, error: 'File extension does not match MIME type' };
  }

  return { ok: true, mime, ext };
}

async function validateFileOnDisk(filePath, mime) {
  const handle = await fs.promises.open(filePath, 'r');
  try {
    const buffer = Buffer.alloc(16);
    await handle.read(buffer, 0, 16, 0);
    if (!matchesMagic(buffer, mime)) {
      return { ok: false, error: 'File content does not match declared type' };
    }
    return { ok: true };
  } finally {
    await handle.close();
  }
}

function randomStoredFilename(ext) {
  return `${crypto.randomBytes(16).toString('hex')}${ext}`;
}

function createMulterFilename(_req, file, cb, allowedMap) {
  const check = validateFileDescriptor(file, allowedMap);
  if (!check.ok) {
    return cb(new Error(check.error));
  }
  cb(null, randomStoredFilename(check.ext));
}

function createMulterFileFilter(allowedMap) {
  return (_req, file, cb) => {
    const check = validateFileDescriptor(file, allowedMap);
    if (!check.ok) {
      return cb(new Error(check.error));
    }
    cb(null, true);
  };
}

async function validateUploadedFiles(files, allowedMap) {
  const list = Array.isArray(files) ? files : files ? [files] : [];
  for (const file of list) {
    const check = validateFileDescriptor(file, allowedMap);
    if (!check.ok) {
      throw new Error(check.error);
    }
    const diskPath = file.path;
    if (!diskPath) continue;
    const magic = await validateFileOnDisk(diskPath, check.mime);
    if (!magic.ok) {
      throw new Error(magic.error);
    }
  }
}

function createValidateUploadedMiddleware(allowedMap) {
  return async (req, res, next) => {
    try {
      const files = req.files || (req.file ? [req.file] : []);
      await validateUploadedFiles(files, allowedMap);
      next();
    } catch (error) {
      const { deleteFileFromDisk } = require('./fileDisk');
      const files = req.files || (req.file ? [req.file] : []);
      await Promise.allSettled(files.map((f) => deleteFileFromDisk(f.path)));
      next(error);
    }
  };
}

module.exports = {
  REPORT_CHAT_MIMES,
  KTM_MIMES,
  sanitizeOriginalName,
  randomStoredFilename,
  createMulterFilename,
  createMulterFileFilter,
  createValidateUploadedMiddleware,
  validateFileDescriptor,
  validateFileOnDisk,
  validateUploadedFiles,
};
