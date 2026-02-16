// API route to serve a random region background image for the game.
import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const REGIONS_DIR = path.join(
  process.cwd(),
  'public',
  'backgrounds',
  'regions'
);

export async function GET() {
  try {
    // Read directory contents
    const files = await fs.readdir(REGIONS_DIR);

    // Keep only .jpg files
    const jpgFiles = files.filter(
      (file) => file.toLowerCase().endsWith('.jpg')
    );

    // Safety fallback
    if (jpgFiles.length === 0) {
      return NextResponse.json({
        url: '/backgrounds/regions/kanto.jpg',
        region: 'kanto',
        fallback: true,
      });
    }

    // Random selection
    const randomFile =
      jpgFiles[Math.floor(Math.random() * jpgFiles.length)];

    const region = path.parse(randomFile).name;

    return NextResponse.json({
      url: `/backgrounds/regions/${randomFile}`,
      region,
      fallback: false,
    });
  } catch (error) {
    console.error('[Random Region BG API]', error);

    return NextResponse.json({
      url: '/backgrounds/regions/kanto.jpg',
      region: 'kanto',
      fallback: true,
      error: 'filesystem_error',
    });
  }
}
