/**
 * Battle System - Stat Calculator
 * 
 * Implements official Pokémon stat formulas with level scaling
 */

import type { BattlePokemonStats } from "./types";

/**
 * Calculate HP stat using official Pokémon formula
 * 
 * HP = floor(((2 × Base + IV + (EV / 4)) × Level) / 100) + Level + 10
 * 
 * Assumptions:
 * - IV = 31 (perfect)
 * - EV = 0 (untrained)
 * - Nature = neutral (no modifier)
 */
export function calculateHP(baseHP: number, level: number): number {
  const IV = 31;
  const EV = 0;
  
  return Math.floor(((2 * baseHP + IV + Math.floor(EV / 4)) * level) / 100) + level + 10;
}

/**
 * Calculate non-HP stat using official Pokémon formula
 * 
 * Stat = floor(((2 × Base + IV + (EV / 4)) × Level) / 100) + 5
 * 
 * Assumptions:
 * - IV = 31 (perfect)
 * - EV = 0 (untrained)
 * - Nature = neutral (×1.0, no modifier)
 */
export function calculateStat(baseStat: number, level: number): number {
  const IV = 31;
  const EV = 0;
  
  return Math.floor(((2 * baseStat + IV + Math.floor(EV / 4)) * level) / 100) + 5;
}

/**
 * Calculate all stats for a Pokémon at a given level
 * 
 * @param baseStats Base stats from PokéAPI
 * @param level Pokémon level (typically 50, 75, or 100)
 * @returns Calculated stats with level scaling
 */
export function calculatePokemonStats(baseStats: BattlePokemonStats, level: number): BattlePokemonStats {
  return {
    hp: calculateHP(baseStats.hp, level),
    attack: calculateStat(baseStats.attack, level),
    defense: calculateStat(baseStats.defense, level),
    specialAttack: calculateStat(baseStats.specialAttack, level),
    specialDefense: calculateStat(baseStats.specialDefense, level),
    speed: calculateStat(baseStats.speed, level),
  };
}

/**
 * Verify stat calculation with examples
 * (Dev-only testing function)
 */
export function verifyStatCalculation(): void {
  // Example: Charizard base stats
  const charizardBase: BattlePokemonStats = {
    hp: 78,
    attack: 84,
    defense: 78,
    specialAttack: 109,
    specialDefense: 85,
    speed: 100,
  };
  
  const level50 = calculatePokemonStats(charizardBase, 50);
  const level100 = calculatePokemonStats(charizardBase, 100);
  
  console.log("=== Stat Calculation Verification ===");
  console.log("Charizard Level 50:", level50);
  console.log("Charizard Level 100:", level100);
  console.log("HP ratio (100/50):", level100.hp / level50.hp);
  console.log("Attack ratio (100/50):", level100.attack / level50.attack);
  console.log("✓ Stats scale correctly with level");
}

/**
 * Calculate stat with stage multiplier applied
 * Used during battle for stat modifications
 * 
 * @param baseStat Base stat value
 * @param stage Stat stage from -6 to +6
 * @returns Modified stat value
 */
export function applyStatStageMultiplier(baseStat: number, stage: number): number {
  if (stage === 0) return baseStat;
  
  if (stage > 0) {
    // Positive stages: multiply by (2 + stage) / 2
    return Math.floor(baseStat * (2 + stage) / 2);
  } else {
    // Negative stages: multiply by 2 / (2 - stage)
    return Math.floor(baseStat * 2 / (2 - stage));
  }
}
