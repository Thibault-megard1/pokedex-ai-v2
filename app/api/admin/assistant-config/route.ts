import { NextRequest, NextResponse } from 'next/server';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { isAdmin } from '@/lib/auth';
import { DEFAULT_CONFIG, type AssistantConfig } from '@/lib/assistantAdmin';

const CONFIG_PATH = join(process.cwd(), 'data', 'admin', 'assistant-config.json');

function ensureDataDir() {
  const dir = join(process.cwd(), 'data', 'admin');
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

function loadConfig(): AssistantConfig {
  try {
    ensureDataDir();
    if (!existsSync(CONFIG_PATH)) {
      // Create default config
      writeFileSync(CONFIG_PATH, JSON.stringify(DEFAULT_CONFIG, null, 2));
      return DEFAULT_CONFIG;
    }
    const data = readFileSync(CONFIG_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading assistant config:', error);
    return DEFAULT_CONFIG;
  }
}

function saveConfig(config: AssistantConfig): void {
  ensureDataDir();
  writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
}

export async function GET(req: NextRequest) {
  // Admin check
  if (!isAdmin()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const config = loadConfig();
    return NextResponse.json(config);
  } catch (error) {
    console.error('Error reading config:', error);
    return NextResponse.json({ error: 'Failed to load config' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  // Admin check
  if (!isAdmin()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const config: AssistantConfig = await req.json();
    saveConfig(config);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving config:', error);
    return NextResponse.json({ error: 'Failed to save config' }, { status: 500 });
  }
}
