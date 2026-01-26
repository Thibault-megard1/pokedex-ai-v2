#!/usr/bin/env node
/**
 * Asset Download Script
 * Downloads and verifies Pokémon-themed assets for the UI redesign
 */

import { writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = join(__dirname, '..', 'public', 'assets');
const MANIFEST_PATH = join(PUBLIC_DIR, 'manifest.json');

// Asset definitions with fallbacks
const ASSETS = [
  {
    name: 'logo',
    type: 'svg',
    description: 'Pokédex logo',
    urls: [
      'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png',
    ],
    fallback: 'generate-svg'
  },
  {
    name: 'metal-texture',
    type: 'png',
    description: 'Pokédex metal texture background',
    urls: [
      'https://www.transparenttextures.com/patterns/asfalt-dark.png',
    ],
    fallback: 'generate-svg'
  },
  {
    name: 'arena-background',
    type: 'jpg',
    description: 'Battle arena background',
    urls: [
      'https://images.unsplash.com/photo-1579547944212-c4f4d6fa6e61?w=1920&h=1080&fit=crop',
    ],
    fallback: 'generate-svg'
  }
];

// SVG fallbacks for when downloads fail
const SVG_FALLBACKS = {
  'logo': `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="60" viewBox="0 0 200 60">
    <defs>
      <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#DC0A2D;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#FF1A1A;stop-opacity:1" />
      </linearGradient>
    </defs>
    <rect width="200" height="60" rx="10" fill="url(#grad)"/>
    <circle cx="30" cy="30" r="15" fill="white"/>
    <circle cx="30" cy="30" r="12" fill="#DC0A2D"/>
    <circle cx="30" cy="30" r="8" fill="white"/>
    <text x="55" y="38" font-family="Arial Black, sans-serif" font-size="24" font-weight="bold" fill="white">POKÉDEX</text>
  </svg>`,
  
  'metal-texture': `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400">
    <defs>
      <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
        <rect width="20" height="20" fill="#2a2a2a"/>
        <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1a1a1a" stroke-width="0.5"/>
      </pattern>
    </defs>
    <rect width="400" height="400" fill="url(#grid)"/>
  </svg>`,
  
  'arena-background': `<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080">
    <defs>
      <linearGradient id="sky" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" style="stop-color:#87CEEB;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#98D8E8;stop-opacity:1" />
      </linearGradient>
      <linearGradient id="ground" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" style="stop-color:#8B7355;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#6B5345;stop-opacity:1" />
      </linearGradient>
    </defs>
    <rect width="1920" height="600" fill="url(#sky)"/>
    <ellipse cx="960" cy="600" rx="800" ry="100" fill="#7A5F48" opacity="0.5"/>
    <rect y="600" width="1920" height="480" fill="url(#ground)"/>
    <line x1="0" y1="600" x2="1920" y2="600" stroke="#5A4335" stroke-width="3"/>
  </svg>`
};

/**
 * Check if URL is accessible
 */
async function checkUrl(url) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal
    });
    
    clearTimeout(timeout);
    return response.ok;
  } catch (error) {
    return false;
  }
}

/**
 * Download file from URL
 */
async function downloadFile(url, outputPath) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    
    if (!response.ok) return false;
    
    const buffer = Buffer.from(await response.arrayBuffer());
    await writeFile(outputPath, buffer);
    return true;
  } catch (error) {
    console.error(`Failed to download ${url}:`, error.message);
    return false;
  }
}

/**
 * Generate SVG fallback
 */
async function generateSvgFallback(assetName, outputPath) {
  const svg = SVG_FALLBACKS[assetName];
  if (!svg) {
    console.error(`No SVG fallback defined for ${assetName}`);
    return false;
  }
  
  try {
    await writeFile(outputPath, svg);
    return true;
  } catch (error) {
    console.error(`Failed to write SVG fallback:`, error.message);
    return false;
  }
}

/**
 * Process single asset
 */
async function processAsset(asset) {
  console.log(`\nProcessing: ${asset.name} (${asset.description})`);
  
  const ext = asset.fallback === 'generate-svg' ? 'svg' : asset.type;
  const filename = `${asset.name}.${ext}`;
  const outputPath = join(PUBLIC_DIR, filename);
  
  // Try each URL
  for (const url of asset.urls) {
    console.log(`  Checking: ${url}`);
    const accessible = await checkUrl(url);
    
    if (accessible) {
      console.log(`  ✓ URL accessible, downloading...`);
      const success = await downloadFile(url, outputPath);
      
      if (success) {
        console.log(`  ✓ Downloaded successfully`);
        return {
          ...asset,
          filename,
          source: url,
          status: 'downloaded'
        };
      }
    }
    
    console.log(`  ✗ Failed, trying next URL...`);
  }
  
  // All URLs failed, use fallback
  if (asset.fallback === 'generate-svg') {
    console.log(`  ⚠ All URLs failed, generating SVG fallback...`);
    const success = await generateSvgFallback(asset.name, outputPath);
    
    if (success) {
      console.log(`  ✓ SVG fallback generated`);
      return {
        ...asset,
        filename,
        source: 'generated-svg',
        status: 'fallback'
      };
    }
  }
  
  console.log(`  ✗ Failed to generate fallback`);
  return {
    ...asset,
    filename,
    source: 'none',
    status: 'failed'
  };
}

/**
 * Main execution
 */
async function main() {
  console.log('==========================================');
  console.log('  Pokémon UI Asset Downloader');
  console.log('==========================================\n');
  
  // Ensure output directory exists
  if (!existsSync(PUBLIC_DIR)) {
    await mkdir(PUBLIC_DIR, { recursive: true });
    console.log(`Created directory: ${PUBLIC_DIR}\n`);
  }
  
  // Process all assets
  const results = [];
  for (const asset of ASSETS) {
    const result = await processAsset(asset);
    results.push(result);
  }
  
  // Generate manifest
  const manifest = {
    generated: new Date().toISOString(),
    assets: results
  };
  
  await writeFile(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
  console.log(`\n✓ Manifest saved to: ${MANIFEST_PATH}`);
  
  // Summary
  console.log('\n==========================================');
  console.log('  Summary');
  console.log('==========================================');
  
  const downloaded = results.filter(r => r.status === 'downloaded').length;
  const fallbacks = results.filter(r => r.status === 'fallback').length;
  const failed = results.filter(r => r.status === 'failed').length;
  
  console.log(`  Downloaded: ${downloaded}`);
  console.log(`  Fallbacks:  ${fallbacks}`);
  console.log(`  Failed:     ${failed}`);
  console.log(`  Total:      ${results.length}`);
  console.log('==========================================\n');
  
  if (failed > 0) {
    console.log('⚠ Some assets failed to download. The app will use fallbacks.');
  } else {
    console.log('✓ All assets ready!');
  }
}

main().catch(console.error);
