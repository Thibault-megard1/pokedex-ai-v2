import { NextRequest, NextResponse } from 'next/server';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { isAdmin } from '@/lib/auth';
import type { KnowledgePatches } from '@/lib/assistantAdmin';

const PATCHES_PATH = join(process.cwd(), 'data', 'admin', 'assistant-patches.json');

const DEFAULT_PATCHES: KnowledgePatches = {
  patches: [
    {
      id: 'patch-1',
      enabled: true,
      trigger: 'super efficaces.*contre.*dragon|types forts.*dragon|efficace.*dragon',
      triggerType: 'regex',
      scope: 'type-chart',
      correctedAnswer: 'Contre le type Dragon, les types super efficaces sont :\n• Glace\n• Dragon\n• Fée',
      behavior: 'replace',
      notes: 'Fix pour éviter les classements non demandés',
    },
  ],
};

function ensureDataDir() {
  const dir = join(process.cwd(), 'data', 'admin');
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

function loadPatches(): KnowledgePatches {
  try {
    ensureDataDir();
    if (!existsSync(PATCHES_PATH)) {
      writeFileSync(PATCHES_PATH, JSON.stringify(DEFAULT_PATCHES, null, 2));
      return DEFAULT_PATCHES;
    }
    const data = readFileSync(PATCHES_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading patches:', error);
    return DEFAULT_PATCHES;
  }
}

function savePatches(patches: KnowledgePatches): void {
  ensureDataDir();
  writeFileSync(PATCHES_PATH, JSON.stringify(patches, null, 2));
}

export async function GET(req: NextRequest) {
  // Admin check
  if (!isAdmin()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const patches = loadPatches();
    return NextResponse.json(patches);
  } catch (error) {
    console.error('Error reading patches:', error);
    return NextResponse.json({ error: 'Failed to load patches' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  // Admin check
  if (!isAdmin()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const patches: KnowledgePatches = await req.json();
    savePatches(patches);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving patches:', error);
    return NextResponse.json({ error: 'Failed to save patches' }, { status: 500 });
  }
}
