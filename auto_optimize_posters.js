/**
 * Script to automatically optimize posters when they are uploaded
 * This is designed to be run as part of the poster upload process
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

/**
 * Optimizes a single image for mobile use
 * @param {string} filename - The filename of the image to optimize
 * @returns {Promise<Object>} - Stats about the optimization
 */
async function optimizeImageForMobile(filename) {
  try {
    // Define paths
    const sourceDir = path.join(__dirname, 'cineposters');
    const targetDir = path.join(sourceDir, 'mobile');
    const sourcePath = path.join(sourceDir, filename);
    const targetPath = path.join(targetDir, filename.replace(/\.(png|jpe?g)$/i, '.jpg'));
    
    // Configuration
    const mobileWidth = 600; // Max width for mobile devices
    const quality = 80; // JPEG quality (0-100)
    
    // Ensure the target directory exists
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    
    // Get the original file size
    const originalStats = fs.statSync(sourcePath);
    const originalSize = originalStats.size;
    
    // Process the image - resize and convert to JPEG
    await sharp(sourcePath)
      .resize(mobileWidth, null, { 
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({ quality })
      .toFile(targetPath);
    
    // Get the new file size
    const newStats = fs.statSync(targetPath);
    const newSize = newStats.size;
    const savingsPercent = ((originalSize - newSize) / originalSize * 100).toFixed(2);
    
    return {
      originalSize,
      optimizedSize: newSize,
      savings: savingsPercent,
      optimizedPath: targetPath
    };
  } catch (err) {
    console.error(`Error optimizing ${filename}:`, err);
    throw err;
  }
}

// Export the function for use in other modules
module.exports = {
  optimizeImageForMobile
};

// If called directly, optimize all images as a batch job
if (require.main === module) {
  const sourceDir = path.join(__dirname, 'cineposters');
  
  // Get all files in the source directory (excluding subdirectories)
  const files = fs.readdirSync(sourceDir)
    .filter(file => {
      // Only include image files and exclude the mobile directory
      const filePath = path.join(sourceDir, file);
      return fs.statSync(filePath).isFile() && 
             (file.endsWith('.png') || file.endsWith('.jpg') || file.endsWith('.jpeg'));
    });
  
  console.log(`Found ${files.length} images to optimize`);
  
  // Process each image
  Promise.all(files.map(async (file) => {
    try {
      const result = await optimizeImageForMobile(file);
      console.log(`Optimized ${file}: ${(result.originalSize / 1024).toFixed(2)}KB → ${(result.optimizedSize / 1024).toFixed(2)}KB (${result.savings}% saved)`);
      return result;
    } catch (err) {
      console.error(`Failed to optimize ${file}:`, err.message);
      return null;
    }
  }))
  .then(results => {
    const successful = results.filter(Boolean);
    console.log(`\nOptimization complete: ${successful.length}/${files.length} images optimized`);
    
    // Calculate total savings
    if (successful.length > 0) {
      const totalOriginal = successful.reduce((sum, result) => sum + result.originalSize, 0);
      const totalOptimized = successful.reduce((sum, result) => sum + result.optimizedSize, 0);
      const totalSavingsPercent = ((totalOriginal - totalOptimized) / totalOriginal * 100).toFixed(2);
      
      console.log(`Total size reduction: ${(totalOriginal / 1024 / 1024).toFixed(2)}MB → ${(totalOptimized / 1024 / 1024).toFixed(2)}MB (${totalSavingsPercent}% saved)`);
    }
  })
  .catch(err => {
    console.error('An error occurred during batch optimization:', err);
  });
}
