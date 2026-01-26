import { NextRequest, NextResponse } from "next/server";
import { getPokemonDetail, getPokemonEvolutionChain } from "@/lib/pokeapi";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const name = searchParams.get("name");

    if (!name) {
      return NextResponse.json({ error: "Missing name parameter" }, { status: 400 });
    }

    // Récupérer les détails du Pokémon
    const pokemon = await getPokemonDetail(name);

    // Récupérer la chaîne d'évolution complète
    const evolutionChain = await getPokemonEvolutionChain(pokemon.id);

    // Trouver le stade actuel du Pokémon dans la chaîne
    const currentIndex = evolutionChain.findIndex(evo => evo.id === pokemon.id);
    const currentStage = currentIndex !== -1 ? currentIndex + 1 : null;

    // Récupérer les évolutions suivantes (stages après le stage actuel)
    const nextEvolutions = currentIndex !== -1 
      ? evolutionChain.slice(currentIndex + 1)
      : [];

    return NextResponse.json({
      pokemon: {
        id: pokemon.id,
        name: pokemon.name,
        sprite: pokemon.sprite,
        types: pokemon.types,
        stats: pokemon.stats,
        evolutionStage: currentStage,
        evolutionChain: evolutionChain,
        nextEvolutions: nextEvolutions
      }
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message ?? "Failed to fetch pokemon" },
      { status: 500 }
    );
  }
}
