/**
 * POST /api/quiz/analyze
 * Analyze quiz answers using deterministic scoring algorithm
 * Maps personality traits to Pokemon attributes (types, stats, habitat)
 */

import { NextRequest, NextResponse } from "next/server";
import { validateAnswers, type QuizAnswers } from "@/lib/quiz";
import {
  calculateScores,
  calculatePokemonCompatibility,
  generateReasons,
  type PokemonScore,
} from "@/lib/quizScoring";
import {
  getRequestIdentifier,
  checkQuizRateLimit,
  createRateLimitResponse,
} from "@/lib/rateLimit";
import fs from "fs/promises";
import path from "path";

// ============================================================================
// POKEMON LOADING & FILTERING
// ============================================================================

interface PokemonData {
  id: number;
  name: string;
  frenchName?: string;
  types: string[];
  stats: {
    hp: number;
    attack: number;
    defense: number;
    specialAttack: number;
    specialDefense: number;
    speed: number;
  };
  forms?: Array<{ name: string; is_mega?: boolean }>;
}

/**
 * Check if a Pokemon is a Mega evolution or Gigantamax form
 */
function isSpecialForm(pokemon: any): boolean {
  const name = pokemon.name?.toLowerCase() || "";
  
  // Check for Mega evolutions
  if (name.includes("mega") || name.includes("-mega-")) {
    return true;
  }
  
  // Check for Gigantamax
  if (pokemon.forms) {
    for (const form of pokemon.forms) {
      if (form.name?.toLowerCase().includes("gmax") || form.name?.toLowerCase().includes("gigantamax")) {
        return true;
      }
    }
  }
  
  // Check for other special forms we want to exclude
  if (name.includes("alola") || name.includes("galar") || name.includes("hisui")) {
    return false; // Regional forms are OK
  }
  
  if (name.includes("-totem") || name.includes("-starter")) {
    return true; // Exclude these
  }
  
  return false;
}

/**
 * Load all Pokemon from cache, excluding special forms
 */
async function loadAllPokemon(): Promise<PokemonData[]> {
  const pokemon: PokemonData[] = [];
  const cacheDir = path.join(process.cwd(), "data", "pokemon-cache");

  try {
    const files = await fs.readdir(cacheDir);
    const jsonFiles = files.filter(f => f.endsWith('.json') && !isNaN(parseInt(f.replace('.json', ''))));
    
    for (const file of jsonFiles) {
      try {
        const filePath = path.join(cacheDir, file);
        const data = await fs.readFile(filePath, "utf-8");
        const pokemonData = JSON.parse(data);
        
        // Skip special forms
        if (isSpecialForm(pokemonData)) {
          continue;
        }
        
        // Extract relevant data
        pokemon.push({
          id: pokemonData.id,
          name: pokemonData.name,
          frenchName: pokemonData.frenchName,
          types: pokemonData.types || [],
          stats: {
            hp: pokemonData.stats?.hp || 0,
            attack: pokemonData.stats?.attack || 0,
            defense: pokemonData.stats?.defense || 0,
            specialAttack: pokemonData.stats?.special_attack || pokemonData.stats?.specialAttack || 0,
            specialDefense: pokemonData.stats?.special_defense || pokemonData.stats?.specialDefense || 0,
            speed: pokemonData.stats?.speed || 0,
          },
          forms: pokemonData.forms,
        });
      } catch (err) {
        continue; // Skip invalid files
      }
    }

    console.log(`[Quiz] Loaded ${pokemon.length} valid Pokemon (excluding special forms)`);
    return pokemon;
  } catch (error) {
    console.error("[Quiz] Error loading Pokemon from cache:", error);
    return [];
  }
}

/**
 * Fetch French name from PokéAPI species endpoint
 */
async function fetchFrenchName(idOrName: string | number): Promise<string | null> {
  try {
    const response = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${idOrName}`);
    if (!response.ok) return null;
    
    const data = await response.json();
    const frenchName = data.names?.find((n: any) => n.language.name === "fr");
    return frenchName?.name || null;
  } catch (error) {
    console.error(`Failed to fetch French name for ${idOrName}:`, error);
    return null;
  }
}

/**
 * Get sprite URL for a Pokemon
 */
function getSpriteUrl(id: number): string {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
}

// ============================================================================
// API ROUTE HANDLER
// ============================================================================

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // 1. Rate limiting
    const identifier = getRequestIdentifier(request);
    const rateLimit = checkQuizRateLimit(identifier);

    if (!rateLimit.allowed) {
      console.log(`[Quiz] Rate limit exceeded for ${identifier}`);
      return createRateLimitResponse(rateLimit.resetAt);
    }

    console.log(`[Quiz] Request from ${identifier} (${rateLimit.remaining} remaining)`);

    // 2. Parse request body
    const body = await request.json();
    const { answers } = body as { answers: QuizAnswers };

    if (!answers || typeof answers !== "object") {
      return NextResponse.json(
        { error: "Invalid request: answers required", error_fr: "Requête invalide: réponses requises" },
        { status: 400 }
      );
    }

    // 3. Validate answers
    if (!validateAnswers(answers)) {
      return NextResponse.json(
        {
          error: "Incomplete answers: please answer all required questions",
          error_fr: "Réponses incomplètes: réponds à toutes les questions",
        },
        { status: 400 }
      );
    }

    console.log("[Quiz] Loading Pokemon from cache...");

    // 4. Load all valid Pokemon (excluding special forms)
    const allPokemon = await loadAllPokemon();

    if (allPokemon.length === 0) {
      return NextResponse.json(
        {
          error: "No Pokemon data available",
          error_fr: "Aucune donnée Pokémon disponible",
        },
        { status: 500 }
      );
    }

    console.log(`[Quiz] Calculating personality scores from ${Object.keys(answers).length} answers...`);

    // 5. Calculate personality scores from answers
    const quizScores = calculateScores(answers);

    console.log("[Quiz] Top type affinities:", Object.entries(quizScores.typeScores)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([type, score]) => `${type}:${score}`)
      .join(", "));

    // 6. Calculate compatibility score for each Pokemon
    const scoredPokemon: PokemonScore[] = allPokemon.map((pokemon) => {
      const score = calculatePokemonCompatibility(quizScores, pokemon);
      const reasons = generateReasons(quizScores, pokemon, answers);

      return {
        id: pokemon.id,
        name: pokemon.name,
        nameFr: pokemon.frenchName,
        score,
        reasons,
        types: pokemon.types,
        stats: pokemon.stats,
      };
    });

    // 7. Sort by score and get top matches
    scoredPokemon.sort((a, b) => b.score - a.score);

    const topMatch = scoredPokemon[0];
    const alternatives = scoredPokemon.slice(1, 4); // Next 3 best matches

    console.log(`[Quiz] Top match: ${topMatch.nameFr || topMatch.name} (score: ${topMatch.score.toFixed(1)})`);

    // 8. Prepare result in the expected format
    const result = {
      primary: {
        id: topMatch.id,
        name: topMatch.name,
        name_fr: topMatch.nameFr || topMatch.name,
        sprite_url: getSpriteUrl(topMatch.id),
        confidence: Math.min(topMatch.score / 100, 1), // Normalize to 0-1
        reasons: topMatch.reasons,
      },
      alternatives: alternatives.map((alt) => ({
        id: alt.id,
        name: alt.name,
        name_fr: alt.nameFr || alt.name,
        sprite_url: getSpriteUrl(alt.id),
        confidence: Math.min(alt.score / 100, 1),
        reasons: alt.reasons.slice(0, 2), // Fewer reasons for alternatives
      })),
      traits_inferred: quizScores.personalityTraits,
    };

    const totalTime = Date.now() - startTime;
    console.log(`[Quiz] Analysis complete in ${totalTime}ms`);

    // 9. Return result
    return NextResponse.json({
      success: true,
      result,
      metadata: {
        provider: "algorithmic",
        method: "deterministic_scoring",
        response_time_ms: totalTime,
        pokemon_evaluated: scoredPokemon.length,
      },
    });

  } catch (error: any) {
    console.error("[Quiz] Unexpected error:", error);
    
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    
    return NextResponse.json(
      { 
        error: "Failed to analyze quiz",
        error_fr: "Échec de l'analyse du quiz",
        details: errorMessage 
      },
      { status: 500 }
    );
  }
}

// Only allow POST
export async function GET() {
  return NextResponse.json(
    { error: "Method not allowed", error_fr: "Méthode non autorisée" },
    { status: 405 }
  );
}
