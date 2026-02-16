/**
 * Battle System - Move Effects Pipeline
 * 
 * Handles secondary effects: stat changes, recoil, drain, status conditions
 */

import type { BattlePokemon, BattleMove, MoveEffect, StatStages, StatusCondition } from "./types";

/**
 * Initializes default stat stages (neutral)
 */
export function initializeStatStages(): StatStages {
  return {
    attack: 0,
    defense: 0,
    specialAttack: 0,
    specialDefense: 0,
    speed: 0,
    accuracy: 0,
    evasion: 0,
  };
}

/**
 * Clamps stat stage to [-6, +6] range
 */
function clampStatStage(stage: number): number {
  return Math.max(-6, Math.min(6, stage));
}

/**
 * Applies stat stage multiplier to a base stat value
 * 
 * Multipliers by stage:
 * -6: 2/8, -5: 2/7, -4: 2/6, -3: 2/5, -2: 2/4, -1: 2/3
 *  0: 1.0
 * +1: 3/2, +2: 4/2, +3: 5/2, +4: 6/2, +5: 7/2, +6: 8/2
 */
export function applyStatStageMultiplier(baseStat: number, stage: number): number {
  if (stage === 0) return baseStat;
  
  if (stage > 0) {
    return Math.floor(baseStat * (2 + stage) / 2);
  } else {
    return Math.floor(baseStat * 2 / (2 - stage));
  }
}

/**
 * Applies a stat change to a Pokémon
 * Returns true if successful, false if stage couldn't change (already at limit)
 */
export function applyStatChange(
  pokemon: BattlePokemon,
  stat: "attack" | "defense" | "special-attack" | "special-defense" | "speed" | "accuracy" | "evasion",
  stages: number
): boolean {
  const statKey = stat === "special-attack" ? "specialAttack" 
                : stat === "special-defense" ? "specialDefense"
                : stat as keyof StatStages;
  
  const oldStage = pokemon.statStages[statKey];
  const newStage = clampStatStage(oldStage + stages);
  
  if (oldStage === newStage) {
    return false; // Already at limit
  }
  
  pokemon.statStages[statKey] = newStage;
  
  // Recalculate current stats with new stage
  updateStatsWithStages(pokemon);
  
  return true;
}

/**
 * Updates current stats based on stat stages
 */
export function updateStatsWithStages(pokemon: BattlePokemon): void {
  pokemon.currentStats.attack = applyStatStageMultiplier(pokemon.baseStats.attack, pokemon.statStages.attack);
  pokemon.currentStats.defense = applyStatStageMultiplier(pokemon.baseStats.defense, pokemon.statStages.defense);
  pokemon.currentStats.specialAttack = applyStatStageMultiplier(pokemon.baseStats.specialAttack, pokemon.statStages.specialAttack);
  pokemon.currentStats.specialDefense = applyStatStageMultiplier(pokemon.baseStats.specialDefense, pokemon.statStages.specialDefense);
  pokemon.currentStats.speed = applyStatStageMultiplier(pokemon.baseStats.speed, pokemon.statStages.speed);
}

/**
 * Applies status condition to a Pokémon
 * Returns true if successful, false if already has a status
 */
export function applyStatusCondition(
  pokemon: BattlePokemon,
  status: StatusCondition
): boolean {
  if (pokemon.statusCondition !== null || status === null) {
    return false; // Already has a status
  }
  
  pokemon.statusCondition = status;
  return true;
}

/**
 * Applies recoil damage to attacker (percentage of damage dealt)
 */
export function applyRecoilDamage(
  attacker: BattlePokemon,
  damageDealt: number,
  recoilPercent: number
): number {
  const recoilDamage = Math.max(1, Math.floor(damageDealt * recoilPercent / 100));
  const actualRecoil = Math.min(recoilDamage, attacker.currentHp);
  
  attacker.currentHp = Math.max(0, attacker.currentHp - actualRecoil);
  
  if (attacker.currentHp === 0) {
    attacker.isFainted = true;
  }
  
  return actualRecoil;
}

/**
 * Applies drain effect (heal attacker based on damage dealt)
 */
export function applyDrainEffect(
  attacker: BattlePokemon,
  damageDealt: number,
  drainPercent: number
): number {
  const healAmount = Math.floor(damageDealt * drainPercent / 100);
  const actualHeal = Math.min(healAmount, attacker.maxHp - attacker.currentHp);
  
  attacker.currentHp = Math.min(attacker.maxHp, attacker.currentHp + actualHeal);
  
  return actualHeal;
}

/**
 * Applies self-damage effect (attacker damages itself)
 */
export function applySelfDamage(
  attacker: BattlePokemon,
  damage: number
): number {
  const actualDamage = Math.min(damage, attacker.currentHp);
  
  attacker.currentHp = Math.max(0, attacker.currentHp - actualDamage);
  
  if (attacker.currentHp === 0) {
    attacker.isFainted = true;
  }
  
  return actualDamage;
}

/**
 * Effect log entry for tracking what happened
 */
export interface EffectLog {
  type: "stat-change" | "recoil" | "drain" | "self-damage" | "status" | "heal";
  pokemonName: string;
  description: string;
  value?: number;
}

/**
 * Main effects pipeline - applies all effects from a move
 * Call this AFTER damage is calculated
 */
export function applyMoveEffects(
  attacker: BattlePokemon,
  defender: BattlePokemon,
  move: BattleMove,
  damageDealt: number
): EffectLog[] {
  const logs: EffectLog[] = [];
  
  if (!move.effects || move.effects.length === 0) {
    return logs;
  }
  
  for (const effect of move.effects) {
    // Check effect probability
    if (effect.chance && Math.random() * 100 > effect.chance) {
      continue; // Effect didn't trigger
    }
    
    const targetPokemon = effect.target === "self" ? attacker : defender;
    
    switch (effect.type) {
      case "stat-change":
        if (effect.stat && effect.stages) {
          const success = applyStatChange(targetPokemon, effect.stat, effect.stages);
          if (success) {
            const direction = effect.stages > 0 ? "rose" : "fell";
            const statName = effect.stat.replace("-", " ");
            logs.push({
              type: "stat-change",
              pokemonName: targetPokemon.name,
              description: `${targetPokemon.name}'s ${statName} ${direction}!`,
              value: effect.stages,
            });
          }
        }
        break;
      
      case "recoil":
        if (effect.percent && damageDealt > 0) {
          const recoilDamage = applyRecoilDamage(attacker, damageDealt, effect.percent);
          logs.push({
            type: "recoil",
            pokemonName: attacker.name,
            description: `${attacker.name} took ${recoilDamage} recoil damage!`,
            value: recoilDamage,
          });
        }
        break;
      
      case "drain":
        if (effect.percent && damageDealt > 0) {
          const healAmount = applyDrainEffect(attacker, damageDealt, effect.percent);
          if (healAmount > 0) {
            logs.push({
              type: "drain",
              pokemonName: attacker.name,
              description: `${attacker.name} restored ${healAmount} HP!`,
              value: healAmount,
            });
          }
        }
        break;
      
      case "self-damage":
        if (effect.percent) {
          const selfDamage = applySelfDamage(attacker, Math.floor(attacker.maxHp * effect.percent / 100));
          logs.push({
            type: "self-damage",
            pokemonName: attacker.name,
            description: `${attacker.name} hurt itself for ${selfDamage} damage!`,
            value: selfDamage,
          });
        }
        break;
      
      case "status":
        if (effect.status) {
          const success = applyStatusCondition(targetPokemon, effect.status);
          if (success) {
            logs.push({
              type: "status",
              pokemonName: targetPokemon.name,
              description: `${targetPokemon.name} was ${effect.status}ed!`,
            });
          }
        }
        break;
      
      case "heal":
        if (effect.percent) {
          const healAmount = Math.floor(attacker.maxHp * effect.percent / 100);
          const actualHeal = Math.min(healAmount, attacker.maxHp - attacker.currentHp);
          if (actualHeal > 0) {
            attacker.currentHp += actualHeal;
            logs.push({
              type: "heal",
              pokemonName: attacker.name,
              description: `${attacker.name} restored ${actualHeal} HP!`,
              value: actualHeal,
            });
          }
        }
        break;
    }
  }
  
  return logs;
}

/**
 * Known move effects database (common competitive moves)
 */
export const MOVE_EFFECTS_DATABASE: Record<string, MoveEffect[]> = {
  // Stat boosting moves
  "swords-dance": [{ type: "stat-change", target: "self", stat: "attack", stages: 2 }],
  "dragon-dance": [
    { type: "stat-change", target: "self", stat: "attack", stages: 1 },
    { type: "stat-change", target: "self", stat: "speed", stages: 1 },
  ],
  "calm-mind": [
    { type: "stat-change", target: "self", stat: "special-attack", stages: 1 },
    { type: "stat-change", target: "self", stat: "special-defense", stages: 1 },
  ],
  "nasty-plot": [{ type: "stat-change", target: "self", stat: "special-attack", stages: 2 }],
  
  // Stat lowering moves
  "growl": [{ type: "stat-change", target: "opponent", stat: "attack", stages: -1 }],
  "leer": [{ type: "stat-change", target: "opponent", stat: "defense", stages: -1 }],
  "scary-face": [{ type: "stat-change", target: "opponent", stat: "speed", stages: -2 }],
  
  // Recoil moves
  "double-edge": [{ type: "recoil", target: "self", percent: 33 }],
  "brave-bird": [{ type: "recoil", target: "self", percent: 33 }],
  "flare-blitz": [{ type: "recoil", target: "self", percent: 33 }],
  "take-down": [{ type: "recoil", target: "self", percent: 25 }],
  "submission": [{ type: "recoil", target: "self", percent: 25 }],
  "volt-tackle": [{ type: "recoil", target: "self", percent: 33 }],
  "wood-hammer": [{ type: "recoil", target: "self", percent: 33 }],
  "head-smash": [{ type: "recoil", target: "self", percent: 50 }],
  
  // Drain moves
  "giga-drain": [{ type: "drain", target: "self", percent: 50 }],
  "mega-drain": [{ type: "drain", target: "self", percent: 50 }],
  "drain-punch": [{ type: "drain", target: "self", percent: 50 }],
  "leech-life": [{ type: "drain", target: "self", percent: 50 }],
  "absorb": [{ type: "drain", target: "self", percent: 50 }],
  "parabolic-charge": [{ type: "drain", target: "self", percent: 50 }],
  
  // Stat-change + damage moves
  "close-combat": [
    { type: "stat-change", target: "self", stat: "defense", stages: -1 },
    { type: "stat-change", target: "self", stat: "special-defense", stages: -1 },
  ],
  "overheat": [{ type: "stat-change", target: "self", stat: "special-attack", stages: -2 }],
  "draco-meteor": [{ type: "stat-change", target: "self", stat: "special-attack", stages: -2 }],
  "superpower": [
    { type: "stat-change", target: "self", stat: "attack", stages: -1 },
    { type: "stat-change", target: "self", stat: "defense", stages: -1 },
  ],
  
  // Status-inflicting moves (with chance)
  "thunderbolt": [{ type: "status", target: "opponent", status: "paralysis", chance: 10 }],
  "ice-beam": [{ type: "status", target: "opponent", status: "freeze", chance: 10 }],
  "flamethrower": [{ type: "status", target: "opponent", status: "burn", chance: 10 }],
  "fire-blast": [{ type: "status", target: "opponent", status: "burn", chance: 10 }],
  "thunder": [{ type: "status", target: "opponent", status: "paralysis", chance: 30 }],
  "blizzard": [{ type: "status", target: "opponent", status: "freeze", chance: 10 }],
  "sludge-bomb": [{ type: "status", target: "opponent", status: "poison", chance: 30 }],
  "poison-jab": [{ type: "status", target: "opponent", status: "poison", chance: 30 }],
  
  // Healing moves
  "recover": [{ type: "heal", target: "self", percent: 50 }],
  "roost": [{ type: "heal", target: "self", percent: 50 }],
  "rest": [{ type: "heal", target: "self", percent: 100 }],
  "soft-boiled": [{ type: "heal", target: "self", percent: 50 }],
  "moonlight": [{ type: "heal", target: "self", percent: 50 }],
  "synthesis": [{ type: "heal", target: "self", percent: 50 }],
  "morning-sun": [{ type: "heal", target: "self", percent: 50 }],
  "wish": [{ type: "heal", target: "self", percent: 50 }],
  "slack-off": [{ type: "heal", target: "self", percent: 50 }],
};
