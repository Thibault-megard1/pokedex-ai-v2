/**
 * POST /api/quiz/analyze
 * Analyze quiz answers using Mistral AI and return Pokémon match
 */

import { NextRequest, NextResponse } from "next/server";
import { MistralClient, validateQuizResult } from "@/lib/mistral";
import { formatAnswersForAI, validateAnswers, type QuizAnswers } from "@/lib/quiz";
import fs from "fs/promises";
import path from "path";

// ============================================================================
// POKEMON CANDIDATE LIST (First 151 for cost efficiency)
// ============================================================================

interface PokemonCandidate {
  id: number;
  name: string;
  types: string[];
  tags?: string[];
}

/**
 * Load first 151 Pokémon as candidates
 */
async function loadPokemonCandidates(): Promise<PokemonCandidate[]> {
  const candidates: PokemonCandidate[] = [];
  const cacheDir = path.join(process.cwd(), "data", "pokemon-cache");

  try {
    // Try to load from cache files (1-151)
    for (let id = 1; id <= 151; id++) {
      try {
        const filePath = path.join(cacheDir, `${id}.json`);
        const data = await fs.readFile(filePath, "utf-8");
        const pokemon = JSON.parse(data);
        
        candidates.push({
          id: pokemon.id,
          name: pokemon.name,
          types: pokemon.types || [],
          tags: inferTags(pokemon)
        });
      } catch (err) {
        // File doesn't exist, skip
        continue;
      }
    }

    if (candidates.length > 0) {
      return candidates;
    }
  } catch (error) {
    console.error("Error loading from cache:", error);
  }

  // Fallback: hardcoded list of popular Pokémon
  return getDefaultCandidates();
}

/**
 * Infer personality tags from Pokémon data
 */
function inferTags(pokemon: any): string[] {
  const tags: string[] = [];
  const name = pokemon.name?.toLowerCase() || "";
  const types = pokemon.types || [];

  // Type-based tags
  if (types.includes("fire")) tags.push("passionate", "energetic");
  if (types.includes("water")) tags.push("calm", "adaptable");
  if (types.includes("grass")) tags.push("peaceful", "nurturing");
  if (types.includes("electric")) tags.push("quick", "energetic");
  if (types.includes("psychic")) tags.push("intelligent", "thoughtful");
  if (types.includes("dark")) tags.push("mysterious", "strategic");
  if (types.includes("fighting")) tags.push("strong", "determined");
  if (types.includes("dragon")) tags.push("powerful", "ambitious");
  if (types.includes("fairy")) tags.push("gentle", "protective");
  if (types.includes("ghost")) tags.push("mysterious", "independent");

  // Legendary/starter tags
  const starters = ["bulbasaur", "charmander", "squirtle", "pikachu"];
  if (starters.includes(name)) tags.push("leader", "popular");

  return tags;
}

/**
 * Fallback list of curated Pokémon
 */
function getDefaultCandidates(): PokemonCandidate[] {
  return [
    { id: 1, name: "bulbasaur", types: ["grass", "poison"], tags: ["calm", "nurturing", "starter"] },
    { id: 4, name: "charmander", types: ["fire"], tags: ["passionate", "determined", "starter"] },
    { id: 7, name: "squirtle", types: ["water"], tags: ["adaptable", "loyal", "starter"] },
    { id: 25, name: "pikachu", types: ["electric"], tags: ["energetic", "friendly", "popular"] },
    { id: 6, name: "charizard", types: ["fire", "flying"], tags: ["powerful", "ambitious"] },
    { id: 9, name: "blastoise", types: ["water"], tags: ["strong", "protective"] },
    { id: 3, name: "venusaur", types: ["grass", "poison"], tags: ["wise", "balanced"] },
    { id: 133, name: "eevee", types: ["normal"], tags: ["adaptable", "versatile"] },
    { id: 143, name: "snorlax", types: ["normal"], tags: ["calm", "peaceful"] },
    { id: 150, name: "mewtwo", types: ["psychic"], tags: ["intelligent", "powerful"] },
    { id: 151, name: "mew", types: ["psychic"], tags: ["curious", "playful"] },
    { id: 68, name: "machamp", types: ["fighting"], tags: ["strong", "disciplined"] },
    { id: 65, name: "alakazam", types: ["psychic"], tags: ["intelligent", "strategic"] },
    { id: 94, name: "gengar", types: ["ghost", "poison"], tags: ["mischievous", "mysterious"] },
    { id: 130, name: "gyarados", types: ["water", "flying"], tags: ["fierce", "determined"] },
    { id: 131, name: "lapras", types: ["water", "ice"], tags: ["gentle", "wise"] },
    { id: 149, name: "dragonite", types: ["dragon", "flying"], tags: ["kind", "powerful"] },
  ];
}

/**
 * Format candidates for AI context
 */
function formatCandidates(candidates: PokemonCandidate[]): string {
  return candidates
    .map(p => `ID ${p.id}: ${p.name} [${p.types.join(", ")}]${p.tags ? ` - ${p.tags.join(", ")}` : ""}`)
    .join("\n");
}

// ============================================================================
// API ROUTE HANDLER
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    // 1. Parse request body
    const body = await request.json();
    const { answers } = body as { answers: QuizAnswers };

    if (!answers || typeof answers !== "object") {
      return NextResponse.json(
        { error: "Invalid request: answers required" },
        { status: 400 }
      );
    }

    // 2. Validate answers
    if (!validateAnswers(answers)) {
      return NextResponse.json(
        { error: "Incomplete answers: please answer all required questions" },
        { status: 400 }
      );
    }

    // 3. Check API key
    const apiKey = process.env.MISTRAL_API_KEY;
    if (!apiKey) {
      console.error("MISTRAL_API_KEY not configured");
      return NextResponse.json(
        { error: "AI service not configured" },
        { status: 500 }
      );
    }

    // 4. Load Pokémon candidates
    const candidates = await loadPokemonCandidates();
    const candidatesText = formatCandidates(candidates);

    // 5. Format answers for AI
    const answersText = formatAnswersForAI(answers);

    // 6. Call Mistral API
    const client = new MistralClient(apiKey);
    const result = await client.analyzeQuiz(answersText, candidatesText);

    // 7. Validate result
    if (!validateQuizResult(result)) {
      console.error("Invalid AI response structure");
      return NextResponse.json(
        { error: "Invalid AI response" },
        { status: 500 }
      );
    }

    // 8. Return result
    return NextResponse.json({
      success: true,
      result
    });

  } catch (error) {
    console.error("Quiz analysis error:", error);
    
    // Return user-friendly error
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    
    return NextResponse.json(
      { 
        error: "Failed to analyze quiz",
        details: errorMessage 
      },
      { status: 500 }
    );
  }
}

// Only allow POST
export async function GET() {
  return NextResponse.json(
    { error: "Method not allowed" },
    { status: 405 }
  );
}
