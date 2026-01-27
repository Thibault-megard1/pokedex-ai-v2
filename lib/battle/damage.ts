/**
 * Battle System - Damage Calculation
 * 
 * Computes damage using Pokémon-style formula
 */

import type { BattlePokemon, BattleMove } from "./types";
import { calculateDefensiveMultiplier } from "../typeRelations";

/**
 * Pokémon damage formula (Generation V+)
 * 
 * Damage = ((((2 * Level / 5 + 2) * Power * A/D) / 50) + 2) * Modifiers
 * 
 * Modifiers include:
 * - Type effectiveness (0, 0.25, 0.5, 1, 2, 4)
 * - STAB (Same Type Attack Bonus): 1.5 if attacker has move type
 * - Random factor: 0.85 to 1.0
 * - Critical hit: 1.5x (5% chance)
 */

interface DamageResult {
  damage: number;
  effectiveness: number;
  isCritical: boolean;
}

/**
 * Calculates type effectiveness multiplier
 */
function getTypeEffectiveness(moveType: string, defenderTypes: string[]): number {
  let multiplier = 1;

  for (const defenderType of defenderTypes) {
    const effectivenessValue = calculateDefensiveMultiplier(moveType, [defenderType]);
    multiplier *= effectivenessValue;
  }

  return multiplier;
}

/**
 * Checks if attacker has STAB (Same Type Attack Bonus)
 */
function hasStab(attacker: BattlePokemon, moveType: string): boolean {
  return attacker.types.includes(moveType);
}

/**
 * Generates random factor between 0.85 and 1.0
 */
function getRandomFactor(): number {
  return 0.85 + Math.random() * 0.15;
}

/**
 * Determines if attack is critical (5% chance)
 */
function isCriticalHit(): boolean {
  return Math.random() < 0.05;
}

/**
 * Main damage calculation function
 */
export function calculateDamage(
  attacker: BattlePokemon,
  defender: BattlePokemon,
  move: BattleMove
): DamageResult {
  // Status moves don't deal damage
  if (move.damageClass === "status") {
    return {
      damage: 0,
      effectiveness: 1,
      isCritical: false
    };
  }

  // Check accuracy (simplified: no evasion stats)
  const hitRoll = Math.random() * 100;
  if (hitRoll > move.accuracy) {
    // Miss
    return {
      damage: 0,
      effectiveness: 1,
      isCritical: false
    };
  }

  // Determine attack and defense stats
  const attackStat = move.damageClass === "physical" 
    ? attacker.currentStats.attack 
    : attacker.currentStats.specialAttack;

  const defenseStat = move.damageClass === "physical"
    ? defender.currentStats.defense
    : defender.currentStats.specialDefense;

  // Level (assume all Pokémon are level 50 for simplicity)
  const level = 50;

  // Base damage calculation
  const baseDamage = Math.floor(
    (((2 * level / 5 + 2) * move.power * attackStat / defenseStat) / 50) + 2
  );

  // Calculate modifiers
  const typeEffectiveness = getTypeEffectiveness(move.type, defender.types);
  const stabMultiplier = hasStab(attacker, move.type) ? 1.5 : 1;
  const isCritical = isCriticalHit();
  const criticalMultiplier = isCritical ? 1.5 : 1;
  const randomFactor = getRandomFactor();

  // Final damage
  const finalDamage = Math.floor(
    baseDamage * stabMultiplier * typeEffectiveness * criticalMultiplier * randomFactor
  );

  return {
    damage: Math.max(1, finalDamage), // Minimum 1 damage if hit lands
    effectiveness: typeEffectiveness,
    isCritical
  };
}

/**
 * Applies damage to a Pokémon and updates HP
 * Returns the actual damage dealt (considering remaining HP)
 */
export function applyDamage(pokemon: BattlePokemon, damage: number): number {
  const actualDamage = Math.min(damage, pokemon.currentHp);
  pokemon.currentHp = Math.max(0, pokemon.currentHp - actualDamage);
  
  if (pokemon.currentHp === 0) {
    pokemon.isFainted = true;
  }

  return actualDamage;
}
