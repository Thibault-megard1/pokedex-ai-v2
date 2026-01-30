// API route for game save/load
import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { getUserFromRequest } from '@/lib/auth';
import type { GameSave } from '@/lib/game/types';

const SAVES_DIR = path.join(process.cwd(), 'data', 'game-saves');

// Ensure saves directory exists
async function ensureSavesDir() {
  try {
    await fs.access(SAVES_DIR);
  } catch {
    await fs.mkdir(SAVES_DIR, { recursive: true });
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await ensureSavesDir();
    const savePath = path.join(SAVES_DIR, `${user.username}.json`);

    try {
      const data = await fs.readFile(savePath, 'utf-8');
      const save: GameSave = JSON.parse(data);
      return NextResponse.json({ save });
    } catch {
      // No save file exists
      return NextResponse.json({ save: null }, { status: 404 });
    }
  } catch (error) {
    console.error('[Game Save API] GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body;
    try {
      body = await request.json();
    } catch (jsonError) {
      console.error('[Game Save API] Failed to parse JSON body:', jsonError);
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
    }
    
    const { save } = body;
    
    if (!save) {
      console.error('[Game Save API] No save data provided');
      return NextResponse.json({ error: 'No save data provided' }, { status: 400 });
    }
    
    if (!save.username) {
      console.error('[Game Save API] Save missing username');
      return NextResponse.json({ error: 'Save missing username' }, { status: 400 });
    }
    
    if (save.username !== user.username) {
      console.error('[Game Save API] Username mismatch:', save.username, '!==', user.username);
      return NextResponse.json({ error: 'Username mismatch' }, { status: 403 });
    }

    await ensureSavesDir();
    const savePath = path.join(SAVES_DIR, `${user.username}.json`);
    await fs.writeFile(savePath, JSON.stringify(save, null, 2), 'utf-8');

    return NextResponse.json({ success: true, message: 'Game saved' });
  } catch (error) {
    console.error('[Game Save API] POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
