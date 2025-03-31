/**
 * Script to generate placeholder icons for our PWA
 * For a production app, you would use custom designed icons
 */

const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');

// Define icon sizes
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

// Create icons directory if it doesn't exist
const iconsDir = path.join(__dirname);
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Function to generate a simple icon with text
function generateIcon(size) {
  // Create canvas with the specified size
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Fill background with Netflix-inspired color
  ctx.fillStyle = '#e50914';
  ctx.fillRect(0, 0, size, size);

  // Add a film strip design
  ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
  const stripHeight = size / 10;
  for (let i = 0; i < 10; i += 2) {
    ctx.fillRect(0, i * stripHeight, size, stripHeight);
  }

  // Add text
  const fontSize = Math.max(size / 5, 10);
  ctx.font = `bold ${fontSize}px Arial`;
  ctx.fillStyle = 'white';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('CM', size / 2, size / 2);

  // Save the icon
  const iconPath = path.join(iconsDir, `icon-${size}x${size}.png`);
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(iconPath, buffer);
  console.log(`Generated icon: ${iconPath}`);
}

// Generate icons for all sizes
sizes.forEach(size => generateIcon(size));

console.log('All icons generated successfully!');
