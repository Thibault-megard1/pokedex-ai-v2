import { NextRequest, NextResponse } from "next/server";
import { getPokemonFromCache } from "@/lib/server/pokemonCache";

/**
 * API Route: GET /api/pokemon/cache
 * 
 * Query params:
 *   - id: Pokemon ID (e.g., ?id=1)
 *   - name: Pokemon name (e.g., ?name=bulbasaur)
 * 
 * Returns cached Pokemon data from server-side cache.
 * Falls back to PokeAPI if not cached.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const name = searchParams.get("name");

    // Validate input
    if (!id && !name) {
      return NextResponse.json(
        { error: "Missing required parameter: id or name" },
        { status: 400 }
      );
    }

    // Use id if provided, otherwise name
    const identifier = id || name;
    if (!identifier) {
      return NextResponse.json(
        { error: "Invalid identifier" },
        { status: 400 }
      );
    }

    // Get Pokemon from server-side cache (or fetch from API)
    const pokemon = await getPokemonFromCache(identifier);

    // Return minimal data needed for autocomplete/lists
    return NextResponse.json({
      id: pokemon.id,
      name: pokemon.name,
      frenchName: pokemon.frenchName,
      sprite: pokemon.sprite,
      types: pokemon.types,
      // Include any other fields needed by client components
    });
  } catch (error: any) {
    console.error("Error fetching Pokemon cache:", error);
    return NextResponse.json(
      { 
        error: error?.message ?? "Failed to fetch pokemon from cache",
        identifier: error?.identifier 
      },
      { status: error?.status ?? 500 }
    );
  }
}
