/**
 * POST /api/quiz/analyze
 * Analyze quiz answers using unified LLM system (Ollama or Mistral)
 * Updated to support local LLM via Ollama
 */

import { NextRequest, NextResponse } from "next/server";
import { callLLM, type LLMMessage, type LLMError } from "@/lib/llm";
import { formatAnswersForAI, validateAnswers, type QuizAnswers } from "@/lib/quiz";
import {
  getRequestIdentifier,
  checkQuizRateLimit,
  createRateLimitResponse,
} from "@/lib/rateLimit";
import fs from "fs/promises";
import path from "path";

// ============================================================================
// POKEMON CANDIDATE LIST (ALL Pokémon from cache)
// ============================================================================

interface PokemonCandidate {
  id: number;
  name: string;
  types: string[];
  tags?: string[];
}

/**
 * Load ALL Pokémon from cache as candidates
 */
async function loadPokemonCandidates(): Promise<PokemonCandidate[]> {
  const candidates: PokemonCandidate[] = [];
  const cacheDir = path.join(process.cwd(), "data", "pokemon-cache");

  try {
    // Read all files from cache directory
    const files = await fs.readdir(cacheDir);
    const jsonFiles = files.filter(f => f.endsWith('.json') && !isNaN(parseInt(f.replace('.json', ''))));
    
    for (const file of jsonFiles) {
      try {
        const filePath = path.join(cacheDir, file);
        const data = await fs.readFile(filePath, "utf-8");
        const pokemon = JSON.parse(data);
        
        candidates.push({
          id: pokemon.id,
          name: pokemon.name,
          types: pokemon.types || [],
          tags: inferTags(pokemon)
        });
      } catch (err) {
        // Skip invalid files
        continue;
      }
    }

    if (candidates.length > 0) {
      console.log(`Loaded ${candidates.length} Pokémon candidates from cache`);
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

  // Type-based tags (French)
  if (types.includes("fire")) tags.push("passionné", "énergique");
  if (types.includes("water")) tags.push("calme", "adaptable");
  if (types.includes("grass")) tags.push("paisible", "bienveillant");
  if (types.includes("electric")) tags.push("rapide", "dynamique");
  if (types.includes("psychic")) tags.push("intelligent", "réfléchi");
  if (types.includes("dark")) tags.push("mystérieux", "stratégique");
  if (types.includes("fighting")) tags.push("fort", "déterminé");
  if (types.includes("dragon")) tags.push("puissant", "ambitieux");
  if (types.includes("fairy")) tags.push("doux", "protecteur");
  if (types.includes("ghost")) tags.push("mystérieux", "indépendant");

  // Legendary/starter tags
  const starters = ["bulbasaur", "charmander", "squirtle", "pikachu"];
  if (starters.includes(name)) tags.push("leader", "populaire");

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
 * Get sprite URL for a Pokémon
 */
function getSpriteUrl(id: number): string {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
}

/**
 * Validate quiz result structure
 */
function validateQuizResult(result: any): boolean {
  if (!result || typeof result !== "object") return false;
  if (!result.primary || typeof result.primary !== "object") return false;
  if (typeof result.primary.id !== "number") return false;
  if (typeof result.primary.name !== "string") return false;
  if (typeof result.primary.confidence !== "number") return false;
  if (!Array.isArray(result.primary.reasons)) return false;
  if (!Array.isArray(result.alternatives)) return false;
  if (!Array.isArray(result.traits_inferred)) return false;
  return true;
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

    // 4. Load Pokémon candidates
    const candidates = await loadPokemonCandidates();
    const candidatesText = formatCandidates(candidates);

    // 5. Format answers for AI
    const answersText = formatAnswersForAI(answers);

    // 6. Build AI prompt
    const systemPrompt = `Tu es un analyste de personnalité Pokémon expert. Ta tâche est d'associer une personne à un Pokémon basé sur ses réponses au quiz de personnalité.

RÈGLES STRICTES:
1. Tu DOIS produire du JSON valide suivant exactement le schéma fourni
2. Tu DOIS uniquement choisir des IDs Pokémon de la liste de candidats fournie
3. Tu NE DOIS PAS inventer des IDs ou noms qui n'existent pas dans la liste
4. Le score de confiance doit être entre 0 et 1
5. Fournis des raisons claires et spécifiques pour chaque correspondance EN FRANÇAIS
6. Déduis 3-8 traits de personnalité des réponses EN FRANÇAIS
7. TOUTES les raisons et traits doivent être rédigés en français

FORMAT DE SORTIE (JSON):
{
  "primary": {
    "id": <numéro de la liste de candidats>,
    "name": "<nom exact de la liste de candidats>",
    "confidence": <0-1>,
    "reasons": ["raison 1 en français", "raison 2 en français", ...]
  },
  "alternatives": [
    {
      "id": <numéro>,
      "name": "<nom>",
      "confidence": <0-1>,
      "reasons": ["raison en français", ...]
    }
  ],
  "traits_inferred": ["trait1 en français", "trait2 en français", ...]
}

LISTE DES POKÉMON CANDIDATS:
${candidatesText}`;

    const userPrompt = `Basé sur ces réponses au quiz, détermine quel Pokémon correspond le mieux à la personnalité de cette personne:

${answersText}

Analyse les réponses et sélectionne le Pokémon qui représente le mieux cette personnalité. Considère:
- Son énergie sociale et ses préférences
- Ses valeurs et motivations
- Son approche face aux défis
- Son style émotionnel
- Son environnement idéal

Retourne ton analyse en JSON suivant le schéma. Toutes les raisons et traits doivent être en français.`;

    const messages: LLMMessage[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ];

    // 7. Call unified LLM
    let llmResponse;
    try {
      llmResponse = await callLLM({
        messages,
        temperature: 0.3,
        max_tokens: 2000,
        response_format: { type: "json_object" },
      });

      console.log(
        `[Quiz] LLM response from ${llmResponse.provider} (${llmResponse.response_time_ms}ms, ${llmResponse.usage?.total_tokens || "?"} tokens)`
      );
    } catch (error: any) {
      // Handle LLM errors gracefully
      const llmError = error as LLMError;

      console.error(`[Quiz] LLM error:`, llmError);

      return NextResponse.json(
        {
          error: llmError.message,
          error_fr: llmError.message_fr,
          code: llmError.code,
          provider: llmError.provider,
        },
        { status: 503 }
      );
    }

    // 8. Parse and validate result
    let result: any;
    try {
      result = JSON.parse(llmResponse.content);

      if (!validateQuizResult(result)) {
        throw new Error("Invalid result structure");
      }
    } catch (parseError) {
      console.error("[Quiz] Failed to parse LLM response:", llmResponse.content);

      return NextResponse.json(
        {
          error: "Failed to parse AI response",
          error_fr: "Échec du parsing de la réponse IA",
          details: llmResponse.content.substring(0, 200),
        },
        { status: 500 }
      );
    }

    // 9. Enrich with French names and sprites
    const enrichedResult = { ...result };
    
    // Enrich primary match
    const primaryFrenchName = await fetchFrenchName(result.primary.id);
    enrichedResult.primary = {
      ...result.primary,
      name_fr: primaryFrenchName || result.primary.name,
      sprite_url: getSpriteUrl(result.primary.id)
    };
    
    // Enrich alternatives
    enrichedResult.alternatives = await Promise.all(
      result.alternatives.map(async (alt: any) => {
        const frenchName = await fetchFrenchName(alt.id);
        return {
          ...alt,
          name_fr: frenchName || alt.name,
          sprite_url: getSpriteUrl(alt.id)
        };
      })
    );

    const totalTime = Date.now() - startTime;
    console.log(`[Quiz] Total processing time: ${totalTime}ms`);

    // 10. Return enriched result with metadata
    return NextResponse.json({
      success: true,
      result: enrichedResult,
      metadata: {
        provider: llmResponse.provider,
        model: llmResponse.model,
        response_time_ms: llmResponse.response_time_ms,
        total_tokens: llmResponse.usage?.total_tokens,
      },
    });

  } catch (error: any) {
    console.error("[Quiz] Unexpected error:", error);
    
    // Return user-friendly error
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
