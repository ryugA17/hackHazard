const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const PUBLIC_DIR = path.join(__dirname, 'public');
const BUILD_DIR = path.join(__dirname, 'build');

// Ensure build directory exists
if (!fs.existsSync(BUILD_DIR)) {
  fs.mkdirSync(BUILD_DIR, { recursive: true });
}

// Function to optimize images
async function optimizeImages(directory, outputDirectory) {
  // Read all files in the directory
  const files = fs.readdirSync(directory);

  // Create output directory if it doesn't exist
  if (!fs.existsSync(outputDirectory)) {
    fs.mkdirSync(outputDirectory, { recursive: true });
  }

  // Process each file
  for (const file of files) {
    const filePath = path.join(directory, file);
    const outputPath = path.join(outputDirectory, file);
    
    // Check if it's a directory
    if (fs.statSync(filePath).isDirectory()) {
      // Recursively optimize images in subdirectories
      await optimizeImages(filePath, outputPath);
      continue;
    }

    // Only process image files
    const ext = path.extname(file).toLowerCase();
    if (['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg'].includes(ext)) {
      try {
        console.log(`Optimizing: ${filePath}`);
        
        if (ext === '.svg') {
          // Just copy SVG files (no optimization for now)
          fs.copyFileSync(filePath, outputPath);
        } else if (ext === '.gif') {
          // Just copy GIF files (sharp doesn't handle animations well)
          fs.copyFileSync(filePath, outputPath);
        } else {
          // Optimize JPG, PNG, WebP
          const image = sharp(filePath);
          const metadata = await image.metadata();
          
          // Convert to WebP if it's not already a WebP
          if (ext !== '.webp') {
            const webpOutputPath = outputPath.replace(ext, '.webp');
            await image
              .webp({ quality: 80 })
              .toFile(webpOutputPath);
              
            // Also keep original format but optimized
            await image
              .toFormat(metadata.format, { quality: 80 })
              .toFile(outputPath);
          } else {
            // Just optimize the existing WebP
            await image
              .webp({ quality: 80 })
              .toFile(outputPath);
          }
        }
      } catch (error) {
        console.error(`Error optimizing ${filePath}:`, error);
        // Copy the original file as fallback
        fs.copyFileSync(filePath, outputPath);
      }
    } else {
      // Copy non-image files
      fs.copyFileSync(filePath, outputPath);
    }
  }
}

// Start the optimization process
(async () => {
  try {
    await optimizeImages(PUBLIC_DIR, BUILD_DIR);
    console.log('Image optimization completed successfully!');
  } catch (error) {
    console.error('Error during image optimization:', error);
    process.exit(1);
  }
})(); 