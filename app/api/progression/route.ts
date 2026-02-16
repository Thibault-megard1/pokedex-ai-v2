import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import fs from 'fs/promises';
import path from 'path';

export interface ProgressionStats {
  totalPokemonCaught: number;
  totalBattlesWon: number;
  totalBattlesLost: number;
  favoritePokemon: { id: number; name: string; usage: number } | null;
  mostEncounteredPokemon: { id: number; name: string; encounters: number } | null;
  totalPlaytimeSeconds: number;
  totalPlaytimeFormatted: string;
  quizResultPokemon: { id: number; name: string; sprite: string } | null;
  badges: string[];
  teamSize: number;
  pcBoxSize: number;
  startDate: string | null;
}

/**
 * GET /api/progression
 * Returns read-only progression statistics for the current user
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Load game save
    const savePath = path.join(process.cwd(), 'data', 'game-saves', `${session.username}.json`);
    let gameSave: any = null;

    try {
      const saveData = await fs.readFile(savePath, 'utf-8');
      gameSave = JSON.parse(saveData);
    } catch (err) {
      // No save file yet - return empty stats
      return NextResponse.json({
        totalPokemonCaught: 0,
        totalBattlesWon: 0,
        totalBattlesLost: 0,
        favoritePokemon: null,
        mostEncounteredPokemon: null,
        totalPlaytimeSeconds: 0,
        totalPlaytimeFormatted: '0h 0m',
        quizResultPokemon: null,
        badges: [],
        teamSize: 0,
        pcBoxSize: 0,
        startDate: null,
      } as ProgressionStats);
    }

    // Calculate total Pokémon caught
    const teamSize = gameSave.team?.length || 0;
    const pcBoxSize = gameSave.pcBox?.length || 0;
    const totalPokemonCaught = teamSize + pcBoxSize;

    // Extract battle stats from flags (if tracked)
    const battlesWon = gameSave.flags?.battlesWon || 0;
    const battlesLost = gameSave.flags?.battlesLost || 0;

    // Calculate favorite Pokémon (most used - tracked per Pokemon in flags)
    let favoritePokemon: { id: number; name: string; usage: number } | null = null;
    const allPokemon = [...(gameSave.team || []), ...(gameSave.pcBox || [])];

    if (allPokemon.length > 0) {
      // Count usage from flags (pokemonUsage_{id})
      const usageCounts: { [key: string]: { id: number; name: string; count: number } } = {};

      for (const pokemon of allPokemon) {
        const usageKey = `pokemonUsage_${pokemon.id}`;
        const usage = gameSave.flags?.[usageKey] || 0;

        if (!usageCounts[pokemon.id]) {
          usageCounts[pokemon.id] = { id: pokemon.id, name: pokemon.name, count: usage };
        } else {
          usageCounts[pokemon.id].count = Math.max(usageCounts[pokemon.id].count, usage);
        }
      }

      // Find the most used
      const sortedUsage = Object.values(usageCounts).sort((a, b) => b.count - a.count);
      if (sortedUsage.length > 0 && sortedUsage[0].count > 0) {
        favoritePokemon = {
          id: sortedUsage[0].id,
          name: sortedUsage[0].name,
          usage: sortedUsage[0].count,
        };
      } else {
        // Default to highest level Pokémon if no usage tracked
        const highestLevel = allPokemon.reduce((prev, current) =>
          (current.level > prev.level) ? current : prev
        );
        favoritePokemon = {
          id: highestLevel.id,
          name: highestLevel.name,
          usage: 0,
        };
      }
    }

    // Calculate most encountered Pokémon (tracked in flags as encounterCount_{id})
    let mostEncounteredPokemon: { id: number; name: string; encounters: number } | null = null;

    if (gameSave.flags) {
      const encounterCounts: { [key: number]: { id: number; name: string; count: number } } = {};

      for (const [key, value] of Object.entries(gameSave.flags)) {
        if (key.startsWith('encounterCount_') && typeof value === 'number') {
          const pokemonId = parseInt(key.replace('encounterCount_', ''));
          const pokemon = allPokemon.find(p => p.id === pokemonId);

          if (pokemon || value > 0) {
            encounterCounts[pokemonId] = {
              id: pokemonId,
              name: pokemon?.name || `Pokemon #${pokemonId}`,
              count: value,
            };
          }
        }
      }

      const sortedEncounters = Object.values(encounterCounts).sort((a, b) => b.count - a.count);
      if (sortedEncounters.length > 0) {
        mostEncounteredPokemon = {
          id: sortedEncounters[0].id,
          name: sortedEncounters[0].name,
          encounters: sortedEncounters[0].count,
        };
      }
    }

    // Format playtime
    const totalSeconds = gameSave.playTime || 0;
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const totalPlaytimeFormatted = `${hours}h ${minutes}m`;

    // Load quiz result
    let quizResultPokemon: { id: number; name: string; sprite: string } | null = null;
    try {
      const quizResultsPath = path.join(process.cwd(), 'data', 'quiz-results.json');
      const quizData = await fs.readFile(quizResultsPath, 'utf-8');
      const quizResults = JSON.parse(quizData);

      if (quizResults[session.userId]) {
        const result = quizResults[session.userId].result;
        quizResultPokemon = {
          id: result.primary.id,
          name: result.primary.name,
          sprite: result.primary.sprite_url,
        };
      }
    } catch (err) {
      // Quiz not completed yet
    }

    // Get account creation date
    let startDate: string | null = null;
    try {
      const usersPath = path.join(process.cwd(), 'data', 'users.json');
      const usersData = await fs.readFile(usersPath, 'utf-8');
      const users = JSON.parse(usersData);
      const user = users.find((u: any) => u.id === session.userId);
      if (user) {
        startDate = user.createdAt;
      }
    } catch (err) {
      // Ignore
    }

    const stats: ProgressionStats = {
      totalPokemonCaught,
      totalBattlesWon: battlesWon,
      totalBattlesLost: battlesLost,
      favoritePokemon,
      mostEncounteredPokemon,
      totalPlaytimeSeconds: totalSeconds,
      totalPlaytimeFormatted,
      quizResultPokemon,
      badges: gameSave.badges || [],
      teamSize,
      pcBoxSize,
      startDate,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching progression stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
