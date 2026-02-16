/**
 * Calcul des degats (formule Pokemon).
 * Cette section n'utilise pas d'intelligence artificielle.
 * Entree: attaquant, defenseur, move. Sortie: degats + effet.
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
 * Calcule le multiplicateur d'efficacite de type.
 * Cette fonction n'utilise pas d'intelligence artificielle.
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
 * Verifie le STAB (bonus meme type).
 * Cette fonction n'utilise pas d'intelligence artificielle.
 */
function hasStab(attacker: BattlePokemon, moveType: string): boolean {
  return attacker.types.includes(moveType);
}

/**
 * Genere le facteur aleatoire de degats.
 * Cette fonction n'utilise pas d'intelligence artificielle.
 */
function getRandomFactor(): number {
  return 0.85 + Math.random() * 0.15;
}

/**
 * Determine un coup critique.
 * Cette fonction n'utilise pas d'intelligence artificielle.
 */
function isCriticalHit(): boolean {
  return Math.random() < 0.05;
}

/**
 * Calcule les degats d'un move.
 * Cette fonction n'utilise pas d'intelligence artificielle.
 * Processus: precision -> stats -> multiplicateurs.
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

  // Use actual Pokémon level (from attacker)
  const level = attacker.level || 50; // Fallback to 50 if not set

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
 * Applique les degats et met a jour les PV.
 * Cette fonction n'utilise pas d'intelligence artificielle.
 */
export function applyDamage(pokemon: BattlePokemon, damage: number): number {
  const actualDamage = Math.min(damage, pokemon.currentHp);
  pokemon.currentHp = Math.max(0, pokemon.currentHp - actualDamage);
  
  if (pokemon.currentHp === 0) {
    pokemon.isFainted = true;
  }

  return actualDamage;
}
