/**
 * Team Builder IA (tournoi) - generation d'equipe adverse.
 * Cette "IA" est rule-based (pas de LLM): elle applique des regles deterministes.
 * Entree: equipe joueur + regles. Sortie: equipe adverse + justification.
 * Liens cours IA: agent heuristique, explicabilite, evaluation de couverture.
 * Limites: strategie simplifiee, depend des heuristiques.
 */

import type { BattleTeam, BattlePokemon, BattlePokemonStats, BattleMove } from "../battle/types";
import { calculateDefensiveMultiplier } from "../typeRelations";
import { initializeStatStages } from "../battle/effects";
import { calculatePokemonStats } from "../battle/statCalculator";

// ============================================================================
// TYPES
// ============================================================================

export interface TournamentRules {
  allowLegendaries: boolean;
  allowMegas: boolean;
  allowGigantamax: boolean;
  targetLevel: number; // 50, 75, or 100
}

export interface TeamGenerationResult {
  team: BattleTeam;
  reasoning: TeamReasoning[];
  analysis: TeamAnalysis;
}

export interface TeamReasoning {
  pokemonName: string;
  role: string; // "Sweeper", "Tank", "Wall", "Pivot", "Counter"
  reason: string;
  counters: string[]; // Which player Pokémon this counters
  coverageTypes: string[]; // Types this Pokémon covers
}

export interface TeamAnalysis {
  playerWeaknesses: string[]; // Types the player team is weak to
  playerResistances: string[]; // Types the player team resists
  playerTypesCovered: string[]; // Types the player team has
  opponentTypesCovered: string[]; // Types the AI team has
  defensiveBalance: number; // 0-100 score
  offensiveBalance: number; // 0-100 score
}

interface PokemonCandidate {
  name: string;
  id: number;
  types: string[];
  stats: BattlePokemonStats;
  moves: BattleMove[];
  evolutionChain: string[];
  score: number;
  reasoning: string;
}

// ============================================================================
// MOVE GENERATION
// ============================================================================

/**
 * Fetches real moves for a Pokemon at a specific level
 */
async function fetchPokemonMoves(pokemonName: string, targetLevel: number): Promise<BattleMove[]> {
  try {
    // Fetch full Pokemon details with moves
    const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonName}`);
    if (!res.ok) throw new Error(`Failed to fetch ${pokemonName}`);
    
    const data = await res.json();
    
    // Get all moves learnable by level-up up to targetLevel
    const levelUpMoves: Array<{ name: string; level: number; type: string; power: number; damageClass: string; accuracy: number }> = [];
    
    if (data.moves && Array.isArray(data.moves)) {
      for (const moveData of data.moves) {
        const moveName = moveData.move?.name;
        if (!moveName) continue;
        
        // Find level-up details
        const versionDetail = moveData.version_group_details?.find(
          (vd: any) => vd.move_learn_method?.name === "level-up"
        );
        
        if (versionDetail) {
          const learnLevel = versionDetail.level_learned_at || 1;
          
          // Only include moves learnable at or below target level
          if (learnLevel <= targetLevel) {
            // Fetch move details for power/type
            try {
              const moveRes = await fetch(moveData.move.url);
              const moveDetail = await moveRes.json();
              
              levelUpMoves.push({
                name: moveName,
                level: learnLevel,
                type: moveDetail.type?.name || "normal",
                power: moveDetail.power || 60,
                damageClass: moveDetail.damage_class?.name || "physical",
                accuracy: moveDetail.accuracy || 100,
              });
            } catch {
              // Skip this move if we can't fetch details
            }
          }
        }
      }
    }
    
    // Sort by level (highest first) and take the best 4 moves
    levelUpMoves.sort((a, b) => b.level - a.level || b.power - a.power);
    
    const selectedMoves: BattleMove[] = levelUpMoves
      .slice(0, 4)
      .map(m => ({
        name: m.name,
        type: m.type,
        power: m.power,
        damageClass: m.damageClass as "physical" | "special" | "status",
        accuracy: m.accuracy,
      }));
    
    // If we don't have 4 moves, fill with defaults
    if (selectedMoves.length < 4) {
      const fallbackMoves = generateDefaultMoves(data.types?.map((t: any) => t.type?.name) || ["normal"], {
        hp: 70,
        attack: 70,
        defense: 70,
        specialAttack: 70,
        specialDefense: 70,
        speed: 70,
      });
      
      while (selectedMoves.length < 4 && fallbackMoves.length > 0) {
        const move = fallbackMoves.shift();
        if (move && !selectedMoves.some(m => m.name === move.name)) {
          selectedMoves.push(move);
        }
      }
    }
    
    // Validate moves before returning (dev warning)
    if (selectedMoves.length > 0) {
      validateMovepool(pokemonName, data.types?.map((t: any) => t.type?.name) || ["normal"], selectedMoves);
    }
    
    return selectedMoves.slice(0, 4);
    
  } catch (error) {
    console.error(`Error fetching moves for ${pokemonName}:`, error);
    // Return default moves on error
    return generateDefaultMoves(["normal"], {
      hp: 70,
      attack: 70,
      defense: 70,
      specialAttack: 70,
      specialDefense: 70,
      speed: 70,
    });
  }
}

/**
 * Validates that moves are appropriate for the Pokemon's types
 * Logs warnings for potentially invalid moves
 */
function validateMovepool(pokemonName: string, pokemonTypes: string[], moves: BattleMove[]): void {
  const invalidMoves: string[] = [];
  
  // Define type-exclusive moves that should only appear on certain types
  const typeExclusiveMoves: Record<string, string[]> = {
    steel: ["meteor-mash", "iron-head", "flash-cannon", "bullet-punch"],
    fire: ["lava-plume", "flare-blitz", "blue-flare", "sacred-fire"],
    dragon: ["draco-meteor", "dragon-claw", "outrage", "dragon-pulse"],
    psychic: ["psychic", "psystrike", "future-sight"],
  };
  
  for (const move of moves) {
    // Check if move type is completely unrelated to Pokemon types
    for (const [exclusiveType, exclusiveMoves] of Object.entries(typeExclusiveMoves)) {
      if (exclusiveMoves.includes(move.name) && !pokemonTypes.includes(exclusiveType)) {
        invalidMoves.push(`${move.name} (${move.type}-type move on non-${exclusiveType} Pokemon)`);
      }
    }
  }
  
  if (invalidMoves.length > 0) {
    console.warn(`⚠️ Potentially invalid moves on ${pokemonName} [${pokemonTypes.join("/")}]:`, invalidMoves);
  }
}

/**
 * Generates default moves based on Pokemon types
 */
function generateDefaultMoves(types: string[], stats: BattlePokemonStats): BattleMove[] {
  const moves: BattleMove[] = [];
  
  // Physical or Special based on stats
  const isPhysical = stats.attack > stats.specialAttack;
  const damageClass = isPhysical ? "physical" : "special";
  
  // Type-based moves
  const typeMoves: Record<string, BattleMove[]> = {
    fire: [
      { name: "flamethrower", type: "fire", power: 90, damageClass: "special", accuracy: 100 },
      { name: "fire-blast", type: "fire", power: 110, damageClass: "special", accuracy: 85 },
    ],
    water: [
      { name: "surf", type: "water", power: 90, damageClass: "special", accuracy: 100 },
      { name: "hydro-pump", type: "water", power: 110, damageClass: "special", accuracy: 80 },
    ],
    grass: [
      { name: "energy-ball", type: "grass", power: 90, damageClass: "special", accuracy: 100 },
      { name: "solar-beam", type: "grass", power: 120, damageClass: "special", accuracy: 100 },
    ],
    electric: [
      { name: "thunderbolt", type: "electric", power: 90, damageClass: "special", accuracy: 100 },
      { name: "thunder", type: "electric", power: 110, damageClass: "special", accuracy: 70 },
    ],
    psychic: [
      { name: "psychic", type: "psychic", power: 90, damageClass: "special", accuracy: 100 },
      { name: "psyshock", type: "psychic", power: 80, damageClass: "special", accuracy: 100 },
    ],
    dragon: [
      { name: "dragon-claw", type: "dragon", power: 80, damageClass: "physical", accuracy: 100 },
      { name: "draco-meteor", type: "dragon", power: 130, damageClass: "special", accuracy: 90 },
    ],
    dark: [
      { name: "dark-pulse", type: "dark", power: 80, damageClass: "special", accuracy: 100 },
      { name: "crunch", type: "dark", power: 80, damageClass: "physical", accuracy: 100 },
    ],
    steel: [
      { name: "iron-head", type: "steel", power: 80, damageClass: "physical", accuracy: 100 },
      { name: "flash-cannon", type: "steel", power: 80, damageClass: "special", accuracy: 100 },
    ],
    fighting: [
      { name: "close-combat", type: "fighting", power: 120, damageClass: "physical", accuracy: 100 },
      { name: "aura-sphere", type: "fighting", power: 80, damageClass: "special", accuracy: 100 },
    ],
    ghost: [
      { name: "shadow-ball", type: "ghost", power: 80, damageClass: "special", accuracy: 100 },
      { name: "phantom-force", type: "ghost", power: 90, damageClass: "physical", accuracy: 100 },
    ],
    fairy: [
      { name: "moonblast", type: "fairy", power: 95, damageClass: "special", accuracy: 100 },
      { name: "play-rough", type: "fairy", power: 90, damageClass: "physical", accuracy: 90 },
    ],
    ice: [
      { name: "ice-beam", type: "ice", power: 90, damageClass: "special", accuracy: 100 },
      { name: "blizzard", type: "ice", power: 110, damageClass: "special", accuracy: 70 },
    ],
    ground: [
      { name: "earthquake", type: "ground", power: 100, damageClass: "physical", accuracy: 100 },
      { name: "earth-power", type: "ground", power: 90, damageClass: "special", accuracy: 100 },
    ],
    flying: [
      { name: "air-slash", type: "flying", power: 75, damageClass: "special", accuracy: 95 },
      { name: "brave-bird", type: "flying", power: 120, damageClass: "physical", accuracy: 100 },
    ],
    rock: [
      { name: "stone-edge", type: "rock", power: 100, damageClass: "physical", accuracy: 80 },
      { name: "power-gem", type: "rock", power: 80, damageClass: "special", accuracy: 100 },
    ],
    bug: [
      { name: "bug-buzz", type: "bug", power: 90, damageClass: "special", accuracy: 100 },
      { name: "x-scissor", type: "bug", power: 80, damageClass: "physical", accuracy: 100 },
    ],
    poison: [
      { name: "sludge-bomb", type: "poison", power: 90, damageClass: "special", accuracy: 100 },
      { name: "poison-jab", type: "poison", power: 80, damageClass: "physical", accuracy: 100 },
    ],
  };
  
  // Add STAB moves for each type
  for (const type of types) {
    const typeSpecificMoves = typeMoves[type];
    if (typeSpecificMoves) {
      const move = typeSpecificMoves[isPhysical ? 1 : 0] || typeSpecificMoves[0];
      if (move) moves.push(move);
    }
  }
  
  // Fill remaining slots with coverage moves
  const coverageMoves: BattleMove[] = [
    { name: "thunderbolt", type: "electric", power: 90, damageClass: "special", accuracy: 100 },
    { name: "ice-beam", type: "ice", power: 90, damageClass: "special", accuracy: 100 },
    { name: "earthquake", type: "ground", power: 100, damageClass: "physical", accuracy: 100 },
    { name: "flamethrower", type: "fire", power: 90, damageClass: "special", accuracy: 100 },
  ];
  
  for (const move of coverageMoves) {
    if (moves.length >= 4) break;
    if (!moves.some(m => m.type === move.type)) {
      moves.push(move);
    }
  }
  
  // Ensure at least 4 moves
  while (moves.length < 4) {
    moves.push({ name: "tackle", type: "normal", power: 40, damageClass: "physical", accuracy: 100 });
  }
  
  return moves.slice(0, 4);
}

// ============================================================================
// TYPE COVERAGE DATABASE
// ============================================================================

/**
 * Top competitive Pokémon organized by role and type
 * These are deterministically selected based on tier lists and usage stats
 */
const COMPETITIVE_POKEMON_POOL: Record<string, string[]> = {
  // Physical Attackers
  physical_sweeper: ["garchomp", "salamence", "metagross", "tyranitar", "scizor", "lucario"],
  
  // Special Attackers
  special_sweeper: ["gengar", "alakazam", "espeon", "magnezone", "hydreigon", "chandelure"],
  
  // Tanks/Walls
  defensive_tank: ["snorlax", "blissey", "ferrothorn", "skarmory", "hippowdon", "toxapex"],
  
  // Fast Pivots
  fast_pivot: ["jolteon", "aerodactyl", "crobat", "weavile", "starmie", "greninja"],
  
  // Balanced/Versatile
  balanced: ["dragonite", "milotic", "arcanine", "umbreon", "vaporeon", "slowbro"],
  
  // Type Specialists (counters)
  fire_specialist: ["charizard", "arcanine", "heatran", "volcarona", "blaziken"],
  water_specialist: ["blastoise", "gyarados", "milotic", "swampert", "greninja"],
  grass_specialist: ["venusaur", "roserade", "ferrothorn", "celebi", "serperior"],
  electric_specialist: ["pikachu", "raikou", "magnezone", "jolteon", "zapdos"],
  psychic_specialist: ["alakazam", "metagross", "gardevoir", "latios", "mewtwo"],
  dragon_specialist: ["dragonite", "garchomp", "salamence", "hydreigon", "dragapult"],
  dark_specialist: ["umbreon", "tyranitar", "hydreigon", "weavile", "bisharp"],
  steel_specialist: ["metagross", "scizor", "ferrothorn", "skarmory", "lucario"],
  fighting_specialist: ["lucario", "conkeldurr", "machamp", "breloom", "blaziken"],
  ghost_specialist: ["gengar", "chandelure", "aegislash", "dragapult", "mimikyu"],
  fairy_specialist: ["gardevoir", "togekiss", "sylveon", "azumarill", "clefable"],
};

// Legendary Pokémon (only if rules allow)
const LEGENDARY_POKEMON = [
  "mewtwo", "lugia", "ho-oh", "kyogre", "groudon", "rayquaza",
  "dialga", "palkia", "giratina", "reshiram", "zekrom", "kyurem",
];

// ============================================================================
// TEAM ANALYSIS
// ============================================================================

/**
 * Analyzes player team to identify weaknesses, strengths, and patterns
 */
function analyzePlayerTeam(playerTeam: BattlePokemon[]): TeamAnalysis {
  const playerTypes = new Set<string>();
  const typeWeaknesses = new Map<string, number>();
  const typeResistances = new Map<string, number>();

  // Collect all types from player team
  for (const pokemon of playerTeam) {
    pokemon.types.forEach(t => playerTypes.add(t));
  }

  // Analyze type matchups for each player Pokémon
  const allTypes = [
    "normal", "fire", "water", "electric", "grass", "ice",
    "fighting", "poison", "ground", "flying", "psychic", "bug",
    "rock", "ghost", "dragon", "dark", "steel", "fairy"
  ];

  for (const pokemon of playerTeam) {
    for (const attackType of allTypes) {
      const effectiveness = calculateDefensiveMultiplier(attackType, pokemon.types);
      
      if (effectiveness >= 2) {
        // Weakness
        typeWeaknesses.set(attackType, (typeWeaknesses.get(attackType) || 0) + 1);
      } else if (effectiveness <= 0.5) {
        // Resistance
        typeResistances.set(attackType, (typeResistances.get(attackType) || 0) + 1);
      }
    }
  }

  // Calculate balance scores
  const avgPhysicalDef = playerTeam.reduce((sum, p) => sum + p.baseStats.defense, 0) / 6;
  const avgSpecialDef = playerTeam.reduce((sum, p) => sum + p.baseStats.specialDefense, 0) / 6;
  const avgSpeed = playerTeam.reduce((sum, p) => sum + p.baseStats.speed, 0) / 6;

  const defensiveBalance = Math.min(100, ((avgPhysicalDef + avgSpecialDef) / 2) / 1.5);
  const offensiveBalance = Math.min(100, avgSpeed / 1.2);

  return {
    playerWeaknesses: Array.from(typeWeaknesses.entries())
      .filter(([_, count]) => count >= 2)
      .map(([type]) => type)
      .slice(0, 5),
    playerResistances: Array.from(typeResistances.entries())
      .filter(([_, count]) => count >= 2)
      .map(([type]) => type)
      .slice(0, 5),
    playerTypesCovered: Array.from(playerTypes),
    opponentTypesCovered: [],
    defensiveBalance,
    offensiveBalance,
  };
}

/**
 * Scores a Pokémon based on how well it counters the player team
 */
function scorePokemonAgainstTeam(
  candidate: { name: string; types: string[]; stats: BattlePokemonStats },
  analysis: TeamAnalysis,
  existingTeamTypes: Set<string>
): number {
  let score = 50; // Base score

  // +20 points if this Pokémon has a type that exploits player weaknesses
  for (const type of candidate.types) {
    if (analysis.playerWeaknesses.includes(type)) {
      score += 20;
    }
  }

  // +15 points if this Pokémon resists player types
  for (const playerType of analysis.playerTypesCovered) {
    const effectiveness = calculateDefensiveMultiplier(playerType, candidate.types);
    if (effectiveness <= 0.5) {
      score += 15;
    }
  }

  // +10 points for type diversity (don't duplicate types)
  const hasNewType = candidate.types.some(t => !existingTeamTypes.has(t));
  if (hasNewType) {
    score += 10;
  }

  // +5 points per high stat (> 100)
  const statValues = Object.values(candidate.stats);
  const highStats = statValues.filter(s => s > 100).length;
  score += highStats * 5;

  // Bonus for balanced stats
  const avgStat = statValues.reduce((a, b) => a + b, 0) / 6;
  if (avgStat > 80) {
    score += 10;
  }

  return score;
}

/**
 * Determines the role of a Pokémon based on stats
 */
function determinePokemonRole(stats: BattlePokemonStats): string {
  const physicalOffense = stats.attack;
  const specialOffense = stats.specialAttack;
  const physicalDefense = stats.defense;
  const specialDefense = stats.specialDefense;
  const speed = stats.speed;
  const hp = stats.hp;

  // Fast Physical Sweeper
  if (speed > 100 && physicalOffense > 100) {
    return "Fast Physical Sweeper";
  }

  // Fast Special Sweeper
  if (speed > 100 && specialOffense > 100) {
    return "Fast Special Sweeper";
  }

  // Physical Wall
  if (hp > 90 && physicalDefense > 100) {
    return "Physical Wall";
  }

  // Special Wall
  if (hp > 90 && specialDefense > 100) {
    return "Special Wall";
  }

  // Tank (high HP + both defenses)
  if (hp > 100 && physicalDefense > 80 && specialDefense > 80) {
    return "Tank";
  }

  // Mixed Attacker
  if (physicalOffense > 90 && specialOffense > 90) {
    return "Mixed Attacker";
  }

  // Balanced
  return "Balanced Fighter";
}

// ============================================================================
// TEAM GENERATION
// ============================================================================

/**
 * Genere une equipe adverse optimisee pour un tournoi.
 * Cette fonction n'utilise pas d'intelligence artificielle generative.
 * Entree: equipe joueur + regles de tournoi.
 * Processus: analyse faiblesses -> candidats -> scoring -> selection.
 * Sortie: TeamGenerationResult (equipe + raisonnement + analyse).
 */
export async function generateOpponentTeam(
  playerTeam: BattlePokemon[],
  rules: TournamentRules
): Promise<TeamGenerationResult> {
  // Step 1: Analyze player team
  const analysis = analyzePlayerTeam(playerTeam);

  // Step 2: Build candidate pool
  const candidatePool: string[] = [];
  const existingTeamTypes = new Set<string>();
  const reasoning: TeamReasoning[] = [];

  // Prioritize Pokémon that exploit player weaknesses
  for (const weakness of analysis.playerWeaknesses) {
    const specialists = COMPETITIVE_POKEMON_POOL[`${weakness}_specialist`] || [];
    candidatePool.push(...specialists);
  }

  // Add balanced picks
  candidatePool.push(...COMPETITIVE_POKEMON_POOL.balanced);
  candidatePool.push(...COMPETITIVE_POKEMON_POOL.physical_sweeper);
  candidatePool.push(...COMPETITIVE_POKEMON_POOL.special_sweeper);
  candidatePool.push(...COMPETITIVE_POKEMON_POOL.defensive_tank);
  candidatePool.push(...COMPETITIVE_POKEMON_POOL.fast_pivot);

  // Add legendaries if allowed
  if (rules.allowLegendaries) {
    candidatePool.push(...LEGENDARY_POKEMON);
  }

  // Remove duplicates
  const uniqueCandidates = Array.from(new Set(candidatePool));

  // Step 3: Fetch and score candidates
  const scoredCandidates: PokemonCandidate[] = [];

  for (const pokemonName of uniqueCandidates.slice(0, 30)) { // Limit API calls
    try {
      const res = await fetch(`/api/pokemon?name=${encodeURIComponent(pokemonName)}`);
      if (!res.ok) continue;
      
      const data = await res.json();
      const pokemon = data.pokemon;

      // Filter out Mega/Gigantamax if not allowed
      if (!rules.allowMegas && pokemon.name.includes("-mega")) continue;
      if (!rules.allowGigantamax && pokemon.name.includes("-gmax")) continue;

      const stats: BattlePokemonStats = {
        hp: pokemon.stats.find((s: any) => s.name === "hp")?.value || 70,
        attack: pokemon.stats.find((s: any) => s.name === "attack")?.value || 70,
        defense: pokemon.stats.find((s: any) => s.name === "defense")?.value || 70,
        specialAttack: pokemon.stats.find((s: any) => s.name === "special-attack")?.value || 70,
        specialDefense: pokemon.stats.find((s: any) => s.name === "special-defense")?.value || 70,
        speed: pokemon.stats.find((s: any) => s.name === "speed")?.value || 70,
      };

      // Fetch real moves for this Pokemon at target level
      const moves = await fetchPokemonMoves(pokemon.name, rules.targetLevel);

      const candidate: PokemonCandidate = {
        name: pokemon.name,
        id: pokemon.id,
        types: pokemon.types,
        stats,
        moves,
        evolutionChain: pokemon.evolutionChain?.map((e: any) => e.name) || [pokemon.name],
        score: 0,
        reasoning: "",
      };

      candidate.score = scorePokemonAgainstTeam(candidate, analysis, existingTeamTypes);
      scoredCandidates.push(candidate);

    } catch (error) {
      console.error(`Error fetching ${pokemonName}:`, error);
    }
  }

  // Step 4: Select top 6 Pokémon
  scoredCandidates.sort((a, b) => b.score - a.score);
  
  // If we don't have enough Pokémon, use the quick generation fallback
  if (scoredCandidates.length < 6) {
    console.warn(`Only ${scoredCandidates.length} Pokémon found, using fallback generation`);
    return {
      team: generateQuickOpponentTeam(playerTeam, rules.targetLevel),
      reasoning: [],
      analysis: {
        ...analysis,
        opponentTypesCovered: [],
      },
    };
  }
  
  const selectedPokemon = scoredCandidates.slice(0, 6);

  // Build reasoning for each selection
  const opponentTeamTypes = new Set<string>();
  for (const pokemon of selectedPokemon) {
    pokemon.types.forEach(t => opponentTeamTypes.add(t));

    const counters: string[] = [];
    for (const playerPokemon of playerTeam) {
      for (const aiType of pokemon.types) {
        const effectiveness = calculateDefensiveMultiplier(aiType, playerPokemon.types);
        if (effectiveness >= 2) {
          counters.push(playerPokemon.name);
          break;
        }
      }
    }

    reasoning.push({
      pokemonName: pokemon.name,
      role: determinePokemonRole(pokemon.stats),
      reason: `Score: ${pokemon.score}. Exploits player weaknesses: ${analysis.playerWeaknesses.filter(w => pokemon.types.includes(w)).join(", ") || "none"}`,
      counters: Array.from(new Set(counters)),
      coverageTypes: pokemon.types,
    });
  }

  // Step 5: Build BattleTeam with proper level-based stats
  const battlePokemon: BattlePokemon[] = selectedPokemon.map(p => {
    // Calculate actual stats based on level
    const calculatedStats = calculatePokemonStats(p.stats, rules.targetLevel);
    
    return {
      id: p.id,
      name: p.name,
      types: p.types,
      level: rules.targetLevel, // Use tournament level
      baseStats: p.stats, // Store base stats from PokéAPI
      currentStats: calculatedStats, // Use calculated stats
      statStages: initializeStatStages(),
      moves: p.moves,
      currentHp: calculatedStats.hp,
      maxHp: calculatedStats.hp,
      evolutionStage: 0,
      evolutionChain: p.evolutionChain,
      isFainted: false,
      statusCondition: null,
      lastUsedMoves: [],
    };
  });

  // Optimal evolution allocation (simple: prioritize high-stat Pokémon)
  const evolutionAllocations = battlePokemon
    .map((p, i) => ({
      pokemonIndex: i,
      points: i < 3 ? Math.min(2, p.evolutionChain.length - 1) : 0, // First 3 get evolutions
    }))
    .filter(a => a.points > 0);

  const team: BattleTeam = {
    teamId: "ai-opponent",
    name: "AI Tournament Team",
    pokemon: battlePokemon,
    evolutionPoints: evolutionAllocations,
    totalEvolutionPointsUsed: evolutionAllocations.reduce((sum, a) => sum + a.points, 0),
    activeIndex: 0,
  };

  analysis.opponentTypesCovered = Array.from(opponentTeamTypes);

  return {
    team,
    reasoning,
    analysis,
  };
}

/**
 * Genere une equipe adverse rapide sans appels API.
 * Cette fonction n'utilise pas d'intelligence artificielle.
 * Entree: equipe joueur + niveau. Sortie: equipe predefinie.
 * Limites: equipe fixe, pas de personnalisation.
 */
export function generateQuickOpponentTeam(playerTeam: BattlePokemon[], level: number): BattleTeam {
  // Fallback: Use predefined strong team
  const quickTeam = ["garchomp", "metagross", "gengar", "milotic", "tyranitar", "alakazam"];
  
  const battlePokemon: BattlePokemon[] = quickTeam.map((name, i) => {
    // Use default base stats, then calculate with level
    const baseStats = {
      hp: 90,
      attack: 120,
      defense: 90,
      specialAttack: 100,
      specialDefense: 85,
      speed: 100,
    };
    
    const calculatedStats = calculatePokemonStats(baseStats, level);
    
    return {
      id: 100 + i,
      name,
      types: ["dragon", "ground"], // Simplified
      level,
      baseStats,
      currentStats: calculatedStats,
      statStages: initializeStatStages(),
      moves: [
        { name: "earthquake", type: "ground", power: 100, damageClass: "physical", accuracy: 100 },
        { name: "dragon-claw", type: "dragon", power: 80, damageClass: "physical", accuracy: 100 },
        { name: "fire-blast", type: "fire", power: 110, damageClass: "special", accuracy: 85 },
        { name: "thunderbolt", type: "electric", power: 90, damageClass: "special", accuracy: 100 },
      ],
      currentHp: calculatedStats.hp,
      maxHp: calculatedStats.hp,
      evolutionStage: 2,
      evolutionChain: [name],
      isFainted: false,
      statusCondition: null,
      lastUsedMoves: [],
    };
  });

  return {
    teamId: "ai-quick",
    name: "Quick AI Team",
    pokemon: battlePokemon,
    evolutionPoints: [],
    totalEvolutionPointsUsed: 0,
    activeIndex: 0,
  };
}
