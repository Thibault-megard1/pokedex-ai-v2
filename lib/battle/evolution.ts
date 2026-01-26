/**
 * Battle System - Evolution Point Application
 * 
 * Applies evolution points to Pokémon and updates their stats
 */

import type { BattlePokemon, BattlePokemonStats, EvolutionAllocation } from "./types";

/**
 * Stat multipliers when evolving (approximate canonical values)
 * These are average multipliers based on actual Pokémon evolution patterns
 */
const EVOLUTION_STAT_MULTIPLIERS = {
  stage1: {
    hp: 1.25,
    attack: 1.30,
    defense: 1.30,
    specialAttack: 1.30,
    specialDefense: 1.30,
    speed: 1.20
  },
  stage2: {
    hp: 1.55,
    attack: 1.70,
    defense: 1.70,
    specialAttack: 1.70,
    specialDefense: 1.70,
    speed: 1.50
  }
};

/**
 * Calculates evolved stats based on evolution stage
 */
function calculateEvolvedStats(baseStats: BattlePokemonStats, evolutionStage: number): BattlePokemonStats {
  if (evolutionStage === 0) {
    return { ...baseStats };
  }

  const multipliers = evolutionStage === 1 
    ? EVOLUTION_STAT_MULTIPLIERS.stage1 
    : EVOLUTION_STAT_MULTIPLIERS.stage2;

  return {
    hp: Math.floor(baseStats.hp * multipliers.hp),
    attack: Math.floor(baseStats.attack * multipliers.attack),
    defense: Math.floor(baseStats.defense * multipliers.defense),
    specialAttack: Math.floor(baseStats.specialAttack * multipliers.specialAttack),
    specialDefense: Math.floor(baseStats.specialDefense * multipliers.specialDefense),
    speed: Math.floor(baseStats.speed * multipliers.speed)
  };
}

/**
 * Applies evolution points to a Pokémon
 * Returns the evolved Pokémon with updated stats
 */
export function applyEvolution(pokemon: BattlePokemon, points: number): BattlePokemon {
  // Clamp points to valid range
  const maxEvolutions = pokemon.evolutionChain.length - 1;
  const actualPoints = Math.min(Math.max(0, points), maxEvolutions);
  
  if (actualPoints === 0) {
    // No evolution, return as-is
    return { ...pokemon };
  }

  // Calculate new evolution stage
  const newStage = Math.min(actualPoints, maxEvolutions);
  
  // Get evolved form name
  const evolvedName = pokemon.evolutionChain[newStage];
  
  // Calculate evolved stats
  const evolvedStats = calculateEvolvedStats(pokemon.baseStats, newStage);
  
  return {
    ...pokemon,
    name: evolvedName,
    evolutionStage: newStage,
    currentStats: evolvedStats,
    maxHp: evolvedStats.hp,
    currentHp: evolvedStats.hp // Start with full HP
  };
}

/**
 * Applies all evolution point allocations to a team's Pokémon
 * Mutates the team's Pokémon in place
 */
export function applyEvolutionPoints(pokemon: BattlePokemon[], allocations: EvolutionAllocation[]): void {
  allocations.forEach(allocation => {
    const poke = pokemon[allocation.pokemonIndex];
    if (!poke) return;
    
    const evolved = applyEvolution(poke, allocation.points);
    
    // Update the Pokémon in the array
    pokemon[allocation.pokemonIndex] = evolved;
  });
}

/**
 * Creates an optimal AI evolution point distribution
 * Strategy: Prioritize fully evolving strongest Pokémon
 */
export function createOptimalEvolutionAllocation(pokemon: BattlePokemon[]): EvolutionAllocation[] {
  const allocations: EvolutionAllocation[] = [];
  let remainingPoints = 6;

  // Calculate "power score" for each Pokémon (total base stats)
  const pokemonWithScores = pokemon.map((p, index) => ({
    index,
    pokemon: p,
    score: p.baseStats.attack + p.baseStats.specialAttack + p.baseStats.speed,
    maxEvolutions: p.evolutionChain.length - 1
  }));

  // Sort by power score descending
  pokemonWithScores.sort((a, b) => b.score - a.score);

  // Allocate points: Fully evolve top Pokémon first
  for (const entry of pokemonWithScores) {
    if (remainingPoints <= 0) break;
    if (entry.maxEvolutions === 0) continue;

    const pointsToAllocate = Math.min(entry.maxEvolutions, remainingPoints);
    
    allocations.push({
      pokemonIndex: entry.index,
      points: pointsToAllocate
    });

    remainingPoints -= pointsToAllocate;
  }

  return allocations;
}
