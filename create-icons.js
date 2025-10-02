const sharp = require('sharp');
const fs = require('fs');

const svgBuffer = fs.readFileSync('public/icon.svg');

async function createIcons() {
  // Create 192x192 icon
  await sharp(svgBuffer)
    .resize(192, 192)
    .png()
    .toFile('public/icon-192.png');
  
  // Create 512x512 icon
  await sharp(svgBuffer)
    .resize(512, 512)
    .png()
    .toFile('public/icon-512.png');
  
  console.log('✅ Icons created successfully: icon-192.png, icon-512.png');
}

createIcons().catch(console.error);
