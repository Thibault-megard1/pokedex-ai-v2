/**
 * API Route: /api/pokemon-species/[id]
 * Returns cached species data for a Pokémon
 */

import { NextResponse } from "next/server";
import path from "path";
import { promises as fs } from "fs";
import { DATA_DIR, ensureDir } from "@/lib/utils";

const SPECIES_CACHE_DIR = path.join(DATA_DIR, "pokemon-cache", "species");

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  try {
    await ensureDir(SPECIES_CACHE_DIR);
    const cachePath = path.join(SPECIES_CACHE_DIR, `${id}.json`);

    // Try to read from cache
    try {
      const cached = await fs.readFile(cachePath, "utf-8");
      return NextResponse.json(JSON.parse(cached));
    } catch (err) {
      // Cache miss, fetch from PokéAPI
    }

    // Fetch from PokéAPI
    const response = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${id}`);
    if (!response.ok) {
      return NextResponse.json(
        { error: "Pokémon not found" },
        { status: 404 }
      );
    }

    const data = await response.json();

    // Cache the result
    await fs.writeFile(cachePath, JSON.stringify(data, null, 2));

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching species data:", error);
    return NextResponse.json(
      { error: "Failed to fetch species data" },
      { status: 500 }
    );
  }
}
