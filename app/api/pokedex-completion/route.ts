import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import fs from 'fs/promises';
import path from 'path';

export interface PokedexEntry {
  pokemonId: number;
  seen: boolean;
  caught: boolean;
  seenAt?: string;
  caughtAt?: string;
}

export interface PokedexCompletion {
  userId: string;
  entries: Record<number, PokedexEntry>; // keyed by pokemonId
  lastUpdated: string;
}

export interface PokedexStats {
  totalPokemon: number;
  seenCount: number;
  caughtCount: number;
  seenPercentage: number;
  caughtPercentage: number;
  entries: Record<number, PokedexEntry>;
}

const POKEDEX_PATH = path.join(process.cwd(), 'data', 'pokedex-tracking.json');

async function loadPokedexData(): Promise<Record<string, PokedexCompletion>> {
  try {
    const data = await fs.readFile(POKEDEX_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    return {};
  }
}

async function savePokedexData(data: Record<string, PokedexCompletion>) {
  await fs.writeFile(POKEDEX_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

/**
 * GET /api/pokedex-completion
 * Returns Pokédex completion stats for the current user
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const allData = await loadPokedexData();
    const userCompletion = allData[session.userId] || {
      userId: session.userId,
      entries: {},
      lastUpdated: new Date().toISOString(),
    };

    // Also load from game save to sync caught Pokémon
    const savePath = path.join(
      process.cwd(),
      'data',
      'game-saves',
      `${session.username}.json`
    );

    try {
      const saveData = await fs.readFile(savePath, 'utf-8');
      const gameSave = JSON.parse(saveData);

      // Mark all Pokémon in team and PC as caught
      const allPokemon = [...(gameSave.team || []), ...(gameSave.pcBox || [])];
      for (const pokemon of allPokemon) {
        if (!userCompletion.entries[pokemon.id]) {
          userCompletion.entries[pokemon.id] = {
            pokemonId: pokemon.id,
            seen: true,
            caught: true,
            seenAt: new Date().toISOString(),
            caughtAt: new Date().toISOString(),
          };
        } else {
          userCompletion.entries[pokemon.id].caught = true;
          userCompletion.entries[pokemon.id].seen = true;
          if (!userCompletion.entries[pokemon.id].caughtAt) {
            userCompletion.entries[pokemon.id].caughtAt = new Date().toISOString();
          }
        }
      }
    } catch (err) {
      // No save file yet
    }

    // Calculate stats (Gen 1-9 = 1025 Pokémon as of Jan 2025)
    const TOTAL_POKEMON = 1025;
    const seenCount = Object.values(userCompletion.entries).filter(e => e.seen).length;
    const caughtCount = Object.values(userCompletion.entries).filter(e => e.caught).length;

    const stats: PokedexStats = {
      totalPokemon: TOTAL_POKEMON,
      seenCount,
      caughtCount,
      seenPercentage: (seenCount / TOTAL_POKEMON) * 100,
      caughtPercentage: (caughtCount / TOTAL_POKEMON) * 100,
      entries: userCompletion.entries,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching Pokédex completion:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/pokedex-completion
 * Updates Pokédex entries (mark as seen/caught)
 * Body: { pokemonId: number, action: 'seen' | 'caught' }
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { pokemonId, action } = body;

    if (!pokemonId || !action) {
      return NextResponse.json({ error: 'Missing pokemonId or action' }, { status: 400 });
    }

    const allData = await loadPokedexData();
    if (!allData[session.userId]) {
      allData[session.userId] = {
        userId: session.userId,
        entries: {},
        lastUpdated: new Date().toISOString(),
      };
    }

    const userCompletion = allData[session.userId];

    if (!userCompletion.entries[pokemonId]) {
      userCompletion.entries[pokemonId] = {
        pokemonId,
        seen: false,
        caught: false,
      };
    }

    const entry = userCompletion.entries[pokemonId];
    const now = new Date().toISOString();

    if (action === 'seen') {
      entry.seen = true;
      if (!entry.seenAt) entry.seenAt = now;
    } else if (action === 'caught') {
      entry.seen = true;
      entry.caught = true;
      if (!entry.seenAt) entry.seenAt = now;
      if (!entry.caughtAt) entry.caughtAt = now;
    }

    userCompletion.lastUpdated = now;
    await savePokedexData(allData);

    return NextResponse.json({ success: true, entry });
  } catch (error) {
    console.error('Error updating Pokédex completion:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
