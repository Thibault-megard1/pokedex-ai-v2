import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { getUserFromRequest } from "@/lib/auth";
import type { GameSave, GameStatsEntry } from "@/lib/game/types";

type ProgressEntry = {
  id: number;
  name: string;
  count: number;
};

type TrainerProgress = {
  totalCaught: number | null;
  battlesWon: number | null;
  battlesLost: number | null;
  favoritePokemon: ProgressEntry | null;
  mostEncountered: ProgressEntry | null;
  playTimeSeconds: number | null;
  lastSaved: string | null;
};

function pickTopEntry(map?: Record<number, GameStatsEntry>): ProgressEntry | null {
  if (!map) return null;
  const entries = Object.values(map);
  if (entries.length === 0) return null;
  return entries.sort((a, b) => b.count - a.count)[0];
}

export async function GET() {
  const user = await getUserFromRequest();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const savePath = path.join(process.cwd(), "data", "game-saves", `${user.username}.json`);
  let save: GameSave | null = null;

  try {
    const raw = await fs.readFile(savePath, "utf-8");
    save = JSON.parse(raw) as GameSave;
  } catch {
    save = null;
  }

  if (!save) {
    const empty: TrainerProgress = {
      totalCaught: null,
      battlesWon: null,
      battlesLost: null,
      favoritePokemon: null,
      mostEncountered: null,
      playTimeSeconds: null,
      lastSaved: null,
    };
    return NextResponse.json(empty);
  }

  const team = save.team ?? [];
  const pcBox = save.pcBox ?? [];
  const totalCaught = new Set([...team, ...pcBox].map(p => p.id)).size;

  const progress: TrainerProgress = {
    totalCaught: Number.isFinite(totalCaught) ? totalCaught : null,
    battlesWon: save.stats?.battlesWon ?? null,
    battlesLost: save.stats?.battlesLost ?? null,
    favoritePokemon: pickTopEntry(save.stats?.pokemonUsed ?? undefined),
    mostEncountered: pickTopEntry(save.stats?.encounters ?? undefined),
    playTimeSeconds: save.playTime ?? null,
    lastSaved: save.lastSaved ?? null,
  };

  return NextResponse.json(progress);
}
