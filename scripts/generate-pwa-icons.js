const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = [192, 512];
const inputFile = path.join(__dirname, '../public/Logo.png');

async function generateIcons() {
  console.log('Generating PWA icons...');

  for (const size of sizes) {
    const outputFile = path.join(__dirname, `../public/icon-${size}x${size}.png`);

    try {
      await sharp(inputFile)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 15, g: 23, b: 42, alpha: 1 } // slate-950 background
        })
        .png()
        .toFile(outputFile);

      console.log(`✅ Generated ${size}x${size} icon`);
    } catch (error) {
      console.error(`❌ Error generating ${size}x${size} icon:`, error.message);
    }
  }

  console.log('✨ PWA icons generated successfully!');
}

generateIcons().catch(console.error);
