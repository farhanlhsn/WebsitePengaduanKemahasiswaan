const prisma = require('../utils/prisma');
const SoftDeleteHelper = require('../utils/softDelete');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const {
  REPORT_CHAT_MIMES,
  sanitizeOriginalName,
  createMulterFilename,
  createMulterFileFilter,
} = require('../utils/fileValidation');

// Ensure attachments directory exists
const attachmentsDir = path.join(__dirname, '../../uploads/reports/attachments');
if (!fs.existsSync(attachmentsDir)) {
  fs.mkdirSync(attachmentsDir, { recursive: true });
}

const ktmDir = path.join(__dirname, '../../uploads/ktm');
if (!fs.existsSync(ktmDir)) {
  fs.mkdirSync(ktmDir, { recursive: true });
}

// Configure multer to store in uploads/reports/attachments
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, attachmentsDir);
  },
  filename: function (req, file, cb) {
    createMulterFilename(req, file, cb, REPORT_CHAT_MIMES);
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: createMulterFileFilter(REPORT_CHAT_MIMES),
});

class AttachmentServices {
  // Middleware untuk multiple file (max 10 file)
  uploadMiddleware = upload.array('files', 10);

  // Simpan file ke database
  async uploadAttachments(files, reportId) {
    try {
      if (!Array.isArray(files)) files = [files];
      const attachments = [];
      for (const file of files) {
        // Construct public path
        const relativePath = `/uploads/reports/attachments/${file.filename}`;
        const attachment = await prisma.attachment.create({
          data: {
            filePath: relativePath,
            fileName: sanitizeOriginalName(file.originalname),
            fileType: file.mimetype,
            reportId: parseInt(reportId)
          }
        });
        attachments.push(attachment);
      }
      return attachments;
    } catch (error) {
      throw new Error('Error uploading attachments: ' + error.message);
    }
  }

  async uploadKtm(userId, file) {
    const relativePath = `/uploads/ktm/${file.filename}`;
    return prisma.user.update({
      where: { id: userId },
      data: {
        ktmPath: relativePath,
      }
    });
  }
}

module.exports = new AttachmentServices();