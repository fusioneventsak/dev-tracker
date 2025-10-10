const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const inputFile = process.argv[2] || path.join(__dirname, '..', 'public', 'Logo 2.png');
const publicDir = path.join(__dirname, '..', 'public');

// Sizes for various uses
const sizes = [
  { size: 16, name: 'favicon-16x16.png' },
  { size: 32, name: 'favicon-32x32.png' },
  { size: 96, name: 'favicon-96x96.png' },
  { size: 180, name: 'apple-touch-icon.png' }
];

async function generateFavicons() {
  console.log('Generating favicon files...');

  if (!fs.existsSync(inputFile)) {
    console.error(`❌ Input file not found: ${inputFile}`);
    process.exit(1);
  }

  // Generate PNG favicons
  for (const { size, name } of sizes) {
    const outputFile = path.join(publicDir, name);

    await sharp(inputFile)
      .resize(size, size, {
        fit: 'contain',
        background: { r: 15, g: 23, b: 42, alpha: 1 }
      })
      .png()
      .toFile(outputFile);

    console.log(`✅ Generated ${name}`);
  }

  // Generate ICO file (32x32 is standard)
  const icoBuffer = await sharp(inputFile)
    .resize(32, 32, {
      fit: 'contain',
      background: { r: 15, g: 23, b: 42, alpha: 1 }
    })
    .png()
    .toBuffer();

  const icoFile = path.join(publicDir, 'favicon.ico');
  fs.writeFileSync(icoFile, icoBuffer);
  console.log('✅ Generated favicon.ico');

  console.log('✨ All favicon files generated successfully!');
}

generateFavicons().catch(err => {
  console.error('Error generating favicons:', err);
  process.exit(1);
});
