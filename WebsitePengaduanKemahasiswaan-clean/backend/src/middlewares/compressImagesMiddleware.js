const sharp = require('sharp');
const fs = require('fs');

module.exports = async function compressImagesMiddleware(req, res, next) {
  if (!req.files) return next();

  const compressPromises = req.files.map(async (file) => {
    if (file.mimetype.startsWith('image/')) {
      try {
        let pipeline = sharp(file.path);
        const metadata = await pipeline.metadata();

        // Smart resize: limit max dimension to 1200px while maintaining aspect ratio
        if (metadata.width > 1200 || metadata.height > 1200) {
          pipeline = pipeline.resize({
            width: 1200,
            height: 1200,
            fit: 'inside',
            withoutEnlargement: true
          });
        }

        // Apply format-specific optimizations
        if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/jpg') {
          pipeline = pipeline.jpeg({ quality: 80, mozjpeg: true });
        } else if (file.mimetype === 'image/png') {
          pipeline = pipeline.png({ quality: 80, compressionLevel: 8, palette: true });
        } else if (file.mimetype === 'image/webp') {
          pipeline = pipeline.webp({ quality: 80 });
        }

        const data = await pipeline.toBuffer();
        await fs.promises.writeFile(file.path, data);
        file.size = data.length;
      } catch (err) {
        console.error('Error compressing image:', file.originalname, err);
        // Fallback: keep the original file if sharp fails
      }
    }
  });

  await Promise.all(compressPromises);
  next();
};