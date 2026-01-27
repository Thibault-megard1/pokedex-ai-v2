// Script to generate PWA icons (placeholder SVG-based)
// Run: node scripts/generate-pwa-icons.mjs

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const iconsDir = path.join(__dirname, '..', 'public', 'icons');

// Create icons directory if it doesn't exist
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
  console.log('✓ Created icons directory');
}

// Generate SVG-based icon (Pokéball design)
function generatePokeballSVG(size) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <circle cx="${size/2}" cy="${size/2}" r="${size/2}" fill="#CC0000"/>
  
  <!-- White half -->
  <path d="M 0,${size/2} A ${size/2},${size/2} 0 0,1 ${size},${size/2} L ${size},${size} A ${size/2},${size/2} 0 0,1 0,${size} Z" fill="#FFFFFF"/>
  
  <!-- Center line -->
  <rect x="0" y="${size/2 - size*0.05}" width="${size}" height="${size*0.1}" fill="#000000"/>
  
  <!-- Center button outer -->
  <circle cx="${size/2}" cy="${size/2}" r="${size*0.15}" fill="#FFFFFF" stroke="#000000" stroke-width="${size*0.02}"/>
  
  <!-- Center button inner -->
  <circle cx="${size/2}" cy="${size/2}" r="${size*0.08}" fill="#000000"/>
</svg>`;
}

// Generate icons
for (const size of sizes) {
  const filename = `icon-${size}x${size}.png`;
  const svgFilename = `icon-${size}x${size}.svg`;
  const filepath = path.join(iconsDir, svgFilename);
  
  const svgContent = generatePokeballSVG(size);
  fs.writeFileSync(filepath, svgContent);
  console.log(`✓ Generated ${svgFilename}`);
}

console.log('\n✓ PWA icons generated successfully!');
console.log('Note: SVG files created. For production, consider converting to PNG using a tool like sharp or imagemagick.');
console.log('\nOptional: Install sharp and run a conversion script:');
console.log('  npm install sharp');
console.log('  node scripts/convert-icons-to-png.mjs');
