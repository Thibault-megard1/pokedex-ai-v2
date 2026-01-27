import { NextRequest, NextResponse } from "next/server";
import { getPokemonDetail, getPokemonEvolutionChain } from "@/lib/pokeapi";

export async function GET(req: NextRequest, { params }: { params: { name: string } }) {
  try {
    const name = params.name;

    if (!name) {
      return NextResponse.json({ error: "Missing name parameter" }, { status: 400 });
    }

    // Get Pokemon details
    const pokemon = await getPokemonDetail(name);

    // Get evolution chain
    const evolutionChain = await getPokemonEvolutionChain(pokemon.id);

    // Find current position in evolution chain
    const currentIndex = evolutionChain.findIndex(evo => evo.id === pokemon.id);

    // Get next evolutions (stages after current)
    const evolutions = currentIndex !== -1 
      ? evolutionChain.slice(currentIndex + 1).map(e => ({ name: e.name, id: e.id }))
      : [];

    return NextResponse.json({
      name: pokemon.name,
      sprite: pokemon.sprite,
      types: pokemon.types,
      stats: pokemon.stats,
      evolutions
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message ?? "Failed to fetch pokemon" },
      { status: 404 }
    );
  }
}
