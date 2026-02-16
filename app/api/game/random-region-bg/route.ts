// API route for random region background selection
import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const REGIONS_DIR = path.join(process.cwd(), 'public', 'backgrounds', 'regions');

export async function GET() {
  try {
    // Read all files in the regions directory
    const files = await fs.readdir(REGIONS_DIR);
    
    // Filter for JPG files only
    const jpgFiles = files.filter(file => file.toLowerCase().endsWith('.jpg'));
    
    if (jpgFiles.length === 0) {
      // Fallback to a deterministic default
      return NextResponse.json({ 
        url: '/backgrounds/regions/kanto.jpg',
        region: 'kanto',
        fallback: true 
      });
    }
    
    // Select a random JPG
    const randomFile = jpgFiles[Math.floor(Math.random() * jpgFiles.length)];
    const region = path.basename(randomFile, '.jpg');
    
    return NextResponse.json({ 
      url: `/backgrounds/regions/${randomFile}`,
      region,
      fallback: false
    });
  } catch (error) {
    console.error('[Random Region BG API] Error:', error);
    
    // Fallback to default kanto background
    return NextResponse.json({ 
      url: '/backgrounds/regions/kanto.jpg',
      region: 'kanto',
      fallback: true,
      error: 'Failed to read directory'
    });
  }
}
