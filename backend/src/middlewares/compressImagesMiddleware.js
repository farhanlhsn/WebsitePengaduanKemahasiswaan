const sharp = require('sharp');
const fs = require('fs');

module.exports = async function compressImagesMiddleware(req, res, next) {
  if (!req.files) return next();

  const compressPromises = req.files.map(async (file) => {
    if (file.mimetype.startsWith('image/')) {
      let quality = 70;
      let data = await sharp(file.path)
        .jpeg({ quality })
        .toBuffer();
      // Jika masih > 1MB, turunkan quality
      while (data.length > 1024 * 1024 && quality > 40) {
        quality -= 10;
        data = await sharp(file.path)
          .jpeg({ quality })
          .toBuffer();
      }
      await fs.promises.writeFile(file.path, data);
      file.size = data.length;
    }
  });

  await Promise.all(compressPromises);
  next();
};