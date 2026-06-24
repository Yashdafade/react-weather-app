const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const svg = fs.readFileSync(path.join(__dirname, '..', 'public', 'icon.svg'));
const out = path.join(__dirname, '..', 'public');

async function generate() {
  await sharp(svg).resize(192, 192).png().toFile(path.join(out, 'logo192.png'));
  await sharp(svg).resize(512, 512).png().toFile(path.join(out, 'logo512.png'));
  await sharp(svg).resize(180, 180).png().toFile(path.join(out, 'apple-touch-icon.png'));
  console.log('Icons generated.');
}

generate().catch(console.error);
