const prisma = require('../utils/prisma');
const SoftDeleteHelper = require('../utils/softDelete');
const multer = require('multer');
const path = require('path');

// Konfigurasi multer di luar class
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Simpan ke /uploads di root project
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: function (req, file, cb) {
    // Gunakan timestamp + originalname agar unik
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB per file
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
        // Ambil path relative
        const relPath = file.path.split('uploads').pop();
        const relativePath = '/uploads/reports/attachments' + relPath.replace(/\\/g, '/');
        const attachment = await prisma.attachment.create({
          filePath: relativePath,
          reportId: reportId
        });
        attachments.push(attachment);
      }
      return attachments;
    } catch (error) {
      throw new Error('Error uploading attachments: ' + error.message);
    }
  }
}

module.exports = new AttachmentServices();