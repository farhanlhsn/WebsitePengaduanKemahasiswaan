import sharp from 'sharp';
import { readdir, mkdir, stat } from 'fs/promises';
import { join, dirname, basename, extname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration for image optimization
const config = {
  input: {
    directory: join(__dirname, '../src/assets'),
    formats: ['.png', '.jpg', '.jpeg']
  },
  output: {
    directory: join(__dirname, '../public/optimized')
  },
  quality: {
    webp: {
      quality: 85, // Slightly lower quality for better compression
      effort: 6,
      smartSubsample: true
    },
    avif: {
      quality: 80, // Use lossy with high quality for better compression
      effort: 9,
      chromaSubsampling: '4:2:0' // Better compression for logos
    }
  }
};

async function getFileSize(filePath) {
  try {
    const stats = await stat(filePath);
    return stats.size;
  } catch {
    return 0;
  }
}

async function optimizeImage(inputPath, outputDir, fileName) {
  try {
    const fileNameWithoutExt = basename(fileName, extname(fileName));
    
    // Get original file size
    const originalSize = await getFileSize(inputPath);
    console.log(`   📏 Original size: ${(originalSize / 1024).toFixed(1)}KB`);
    
    // Create Sharp instance
    const image = sharp(inputPath);
    
    // Get image metadata
    const metadata = await image.metadata();
    console.log(`   📐 Dimensions: ${metadata.width}x${metadata.height}`);
    
    // Convert to WebP
    const webpPath = join(outputDir, `${fileNameWithoutExt}.webp`);
    await image
      .clone()
      .webp(config.quality.webp)
      .toFile(webpPath);
    
    const webpSize = await getFileSize(webpPath);
    const webpSavings = originalSize > 0 ? ((originalSize - webpSize) / originalSize * 100).toFixed(1) : 0;
    console.log(`   ✅ WebP: ${(webpSize / 1024).toFixed(1)}KB (${webpSavings}% reduction)`);
    
    // Convert to AVIF
    const avifPath = join(outputDir, `${fileNameWithoutExt}.avif`);
    await image
      .clone()
      .avif(config.quality.avif)
      .toFile(avifPath);
    
    const avifSize = await getFileSize(avifPath);
    const avifSavings = originalSize > 0 ? ((originalSize - avifSize) / originalSize * 100).toFixed(1) : 0;
    console.log(`   ✅ AVIF: ${(avifSize / 1024).toFixed(1)}KB (${avifSavings}% reduction)`);
    
    // Optimize original PNG/JPEG
    const originalPath = join(outputDir, fileName);
    const ext = extname(fileName).toLowerCase();
    
    if (ext === '.png') {
      await image
        .clone()
        .png({ 
          quality: 90, 
          compressionLevel: 9,
          adaptiveFiltering: true,
          palette: true // Use palette for logos if possible
        })
        .toFile(originalPath);
    } else if (['.jpg', '.jpeg'].includes(ext)) {
      await image
        .clone()
        .jpeg({ quality: 90, progressive: true })
        .toFile(originalPath);
    } else {
      await image.clone().toFile(originalPath);
    }
    
    const optimizedOriginalSize = await getFileSize(originalPath);
    const originalSavings = originalSize > 0 ? ((originalSize - optimizedOriginalSize) / originalSize * 100).toFixed(1) : 0;
    console.log(`   📋 Optimized original: ${(optimizedOriginalSize / 1024).toFixed(1)}KB (${originalSavings}% reduction)`);
    
    return {
      original: { path: originalPath, size: optimizedOriginalSize },
      webp: { path: webpPath, size: webpSize },
      avif: { path: avifPath, size: avifSize }
    };
    
  } catch (error) {
    console.error(`   ❌ Error processing ${fileName}:`, error.message);
    throw error;
  }
}

async function optimizeImages() {
  console.log('🖼️  Starting image optimization with Sharp...');
  console.log('🎯 Optimized for logos with balanced quality vs size');
  
  try {
    // Create output directory
    await mkdir(config.output.directory, { recursive: true });
    console.log(`📂 Output directory: ${config.output.directory}`);
    
    // Get list of image files
    const files = await readdir(config.input.directory);
    const imageFiles = files.filter(file => 
      config.input.formats.includes(extname(file).toLowerCase())
    );
    
    if (imageFiles.length === 0) {
      console.log('⚠️  No images found to optimize');
      return;
    }
    
    console.log(`📁 Found ${imageFiles.length} images to optimize:`);
    
    let totalOriginalSize = 0;
    let totalOptimizedSize = 0;
    let totalWebpSize = 0;
    let totalAvifSize = 0;
    
    for (const file of imageFiles) {
      const inputPath = join(config.input.directory, file);
      const originalFileSize = await getFileSize(inputPath);
      
      console.log(`\n🔄 Processing: ${file}`);
      
      try {
        const result = await optimizeImage(inputPath, config.output.directory, file);
        
        totalOriginalSize += originalFileSize;
        totalOptimizedSize += result.original.size;
        totalWebpSize += result.webp.size;
        totalAvifSize += result.avif.size;
        
      } catch (error) {
        console.error(`Failed to process ${file}:`, error.message);
      }
    }
    
    // Summary
    console.log('\n📊 Optimization Summary:');
    console.log(`   Original total: ${(totalOriginalSize / 1024).toFixed(1)}KB`);
    console.log(`   Optimized PNG/JPG: ${(totalOptimizedSize / 1024).toFixed(1)}KB`);
    console.log(`   WebP total: ${(totalWebpSize / 1024).toFixed(1)}KB`);
    console.log(`   AVIF total: ${(totalAvifSize / 1024).toFixed(1)}KB`);
    
    if (totalOriginalSize > 0) {
      const optimizedSavings = ((totalOriginalSize - totalOptimizedSize) / totalOriginalSize * 100).toFixed(1);
      const webpSavings = ((totalOriginalSize - totalWebpSize) / totalOriginalSize * 100).toFixed(1);
      const avifSavings = ((totalOriginalSize - totalAvifSize) / totalOriginalSize * 100).toFixed(1);
      console.log(`   📈 Optimized PNG/JPG savings: ${optimizedSavings}%`);
      console.log(`   📈 WebP savings: ${webpSavings}%`);
      console.log(`   📈 AVIF savings: ${avifSavings}%`);
    }
    
    console.log('\n🎉 Image optimization completed successfully!');
    console.log('📂 Optimized images are ready in public/optimized/');
    console.log('💡 Use WebP for best compatibility and AVIF for modern browsers');
    
  } catch (error) {
    console.error('❌ Error during image optimization:', error);
    process.exit(1);
  }
}

// Run the optimization
optimizeImages(); 