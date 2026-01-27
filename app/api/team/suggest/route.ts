import { NextRequest, NextResponse } from "next/server";

// Types de Pokémon et leur efficacité
const typeEffectiveness: Record<string, { weakTo: string[], resistantTo: string[], strongAgainst: string[] }> = {
  normal: { weakTo: ['fighting'], resistantTo: [], strongAgainst: [] },
  fire: { weakTo: ['water', 'ground', 'rock'], resistantTo: ['fire', 'grass', 'ice', 'bug', 'steel', 'fairy'], strongAgainst: ['grass', 'ice', 'bug', 'steel'] },
  water: { weakTo: ['electric', 'grass'], resistantTo: ['fire', 'water', 'ice', 'steel'], strongAgainst: ['fire', 'ground', 'rock'] },
  electric: { weakTo: ['ground'], resistantTo: ['electric', 'flying', 'steel'], strongAgainst: ['water', 'flying'] },
  grass: { weakTo: ['fire', 'ice', 'poison', 'flying', 'bug'], resistantTo: ['water', 'electric', 'grass', 'ground'], strongAgainst: ['water', 'ground', 'rock'] },
  ice: { weakTo: ['fire', 'fighting', 'rock', 'steel'], resistantTo: ['ice'], strongAgainst: ['grass', 'ground', 'flying', 'dragon'] },
  fighting: { weakTo: ['flying', 'psychic', 'fairy'], resistantTo: ['bug', 'rock', 'dark'], strongAgainst: ['normal', 'ice', 'rock', 'dark', 'steel'] },
  poison: { weakTo: ['ground', 'psychic'], resistantTo: ['grass', 'fighting', 'poison', 'bug', 'fairy'], strongAgainst: ['grass', 'fairy'] },
  ground: { weakTo: ['water', 'grass', 'ice'], resistantTo: ['poison', 'rock'], strongAgainst: ['fire', 'electric', 'poison', 'rock', 'steel'] },
  flying: { weakTo: ['electric', 'ice', 'rock'], resistantTo: ['grass', 'fighting', 'bug'], strongAgainst: ['grass', 'fighting', 'bug'] },
  psychic: { weakTo: ['bug', 'ghost', 'dark'], resistantTo: ['fighting', 'psychic'], strongAgainst: ['fighting', 'poison'] },
  bug: { weakTo: ['fire', 'flying', 'rock'], resistantTo: ['grass', 'fighting', 'ground'], strongAgainst: ['grass', 'psychic', 'dark'] },
  rock: { weakTo: ['water', 'grass', 'fighting', 'ground', 'steel'], resistantTo: ['normal', 'fire', 'poison', 'flying'], strongAgainst: ['fire', 'ice', 'flying', 'bug'] },
  ghost: { weakTo: ['ghost', 'dark'], resistantTo: ['poison', 'bug'], strongAgainst: ['psychic', 'ghost'] },
  dragon: { weakTo: ['ice', 'dragon', 'fairy'], resistantTo: ['fire', 'water', 'electric', 'grass'], strongAgainst: ['dragon'] },
  dark: { weakTo: ['fighting', 'bug', 'fairy'], resistantTo: ['ghost', 'dark'], strongAgainst: ['psychic', 'ghost'] },
  steel: { weakTo: ['fire', 'fighting', 'ground'], resistantTo: ['normal', 'grass', 'ice', 'flying', 'psychic', 'bug', 'rock', 'dragon', 'steel', 'fairy'], strongAgainst: ['ice', 'rock', 'fairy'] },
  fairy: { weakTo: ['poison', 'steel'], resistantTo: ['fighting', 'bug', 'dark'], strongAgainst: ['fighting', 'dragon', 'dark'] }
};

interface Pokemon {
  id: number;
  name: string;
  types: string[];
  stats: { name: string; value: number }[];
}

interface TeamMember {
  pokemonId: number;
  pokemonName: string;
  types?: string[];
  stats?: { name: string; value: number }[];
}

function analyzeTeamWeaknesses(team: TeamMember[]): { weaknesses: Set<string>, resistances: Set<string>, coverage: Set<string> } {
  const weaknesses = new Set<string>();
  const resistances = new Set<string>();
  const coverage = new Set<string>();

  team.forEach(member => {
    if (!member.types) return;
    
    member.types.forEach(type => {
      const typeData = typeEffectiveness[type.toLowerCase()];
      if (typeData) {
        typeData.weakTo.forEach(w => weaknesses.add(w));
        typeData.resistantTo.forEach(r => resistances.add(r));
        typeData.strongAgainst.forEach(s => coverage.add(s));
      }
    });
  });

  // Remove weaknesses that are also resistances
  resistances.forEach(r => weaknesses.delete(r));

  return { weaknesses, resistances, coverage };
}

function scorePokemon(pokemon: Pokemon, teamAnalysis: { weaknesses: Set<string>, resistances: Set<string>, coverage: Set<string> }): number {
  let score = 0;

  // Check how well this Pokemon covers team weaknesses
  pokemon.types.forEach(type => {
    const typeData = typeEffectiveness[type.toLowerCase()];
    if (!typeData) return;

    // +30 points for each team weakness this Pokemon resists
    typeData.resistantTo.forEach(resist => {
      if (teamAnalysis.weaknesses.has(resist)) {
        score += 30;
      }
    });

    // +20 points for each uncovered type this Pokemon is strong against
    typeData.strongAgainst.forEach(strong => {
      if (!teamAnalysis.coverage.has(strong)) {
        score += 20;
      }
    });

    // -15 points for each weakness shared with the team
    typeData.weakTo.forEach(weak => {
      if (teamAnalysis.weaknesses.has(weak)) {
        score -= 15;
      }
    });
  });

  // Bonus for good stats distribution
  if (pokemon.stats && pokemon.stats.length > 0) {
    const totalStats = pokemon.stats.reduce((sum, s) => sum + s.value, 0);
    score += Math.floor(totalStats / 100); // +1 point per 100 total stats
  }

  return score;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { team } = body as { team: TeamMember[] };

    if (!team || team.length === 0) {
      return NextResponse.json({ error: "Équipe vide" }, { status: 400 });
    }

    if (team.length >= 6) {
      return NextResponse.json({ error: "L'équipe est déjà complète" }, { status: 400 });
    }

    // Analyze current team
    const teamAnalysis = analyzeTeamWeaknesses(team);

    // Fetch a pool of Pokemon to analyze (top 200 by ID)
    const pokemonPool: Pokemon[] = [];
    const existingIds = new Set(team.map(t => t.pokemonId));
    
    // Get popular/strong Pokemon (Gen 1-3 for simplicity)
    const popularPokemon = [
      // Gen 1 starters and evolutions
      1, 2, 3, 4, 5, 6, 7, 8, 9,
      // Strong Gen 1
      25, 26, 65, 68, 94, 130, 131, 143, 149, 150, 151,
      // Gen 2 starters and legendaries
      152, 153, 154, 155, 156, 157, 158, 159, 160, 243, 244, 245, 249, 250, 251,
      // Gen 3 starters and legendaries
      252, 253, 254, 255, 256, 257, 258, 259, 260, 376, 377, 378, 379, 380, 381, 382, 383, 384, 385,
      // Pseudo-legendaries
      147, 148, 149, 246, 247, 248, 371, 372, 373,
      // Popular competitive
      59, 71, 89, 115, 121, 127, 128, 129, 134, 135, 136, 142, 144, 145, 146,
      196, 197, 212, 213, 214, 229, 230, 233, 242,
      254, 260, 262, 271, 282, 286, 289, 295, 302, 306, 310, 319, 321, 330, 334, 342, 350, 359, 362, 365, 369, 373
    ];

    // Fetch Pokemon data
    for (const id of popularPokemon) {
      if (existingIds.has(id)) continue;
      
      try {
        const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
        if (!res.ok) continue;
        
        const data = await res.json();
        const pokemon: Pokemon = {
          id: data.id,
          name: data.name,
          types: data.types.map((t: any) => t.type.name),
          stats: data.stats.map((s: any) => ({
            name: s.stat.name,
            value: s.base_stat
          }))
        };
        
        pokemonPool.push(pokemon);
      } catch (error) {
        console.error(`Error fetching Pokemon ${id}:`, error);
      }
    }

    // Score each Pokemon
    const scoredPokemon = pokemonPool.map(pokemon => ({
      pokemon,
      score: scorePokemon(pokemon, teamAnalysis)
    }));

    // Sort by score and get top 3
    scoredPokemon.sort((a, b) => b.score - a.score);
    const topSuggestions = scoredPokemon.slice(0, 3).map(s => s.pokemon);

    // Build explanation
    const weaknessArray = Array.from(teamAnalysis.weaknesses);
    const uncoveredTypes = ['normal', 'fire', 'water', 'electric', 'grass', 'ice', 'fighting', 'poison', 'ground', 'flying', 'psychic', 'bug', 'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy']
      .filter(t => !teamAnalysis.coverage.has(t));

    return NextResponse.json({
      suggestions: topSuggestions,
      analysis: {
        weaknesses: weaknessArray,
        missingCoverage: uncoveredTypes.slice(0, 5),
        message: weaknessArray.length > 0 
          ? `Votre équipe est faible contre: ${weaknessArray.join(', ')}. Ces suggestions couvrent ces faiblesses.`
          : "Votre équipe est bien équilibrée ! Ces suggestions ajoutent une couverture offensive."
      }
    });

  } catch (error) {
    console.error("Team suggest error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la génération de suggestions" },
      { status: 500 }
    );
  }
}
