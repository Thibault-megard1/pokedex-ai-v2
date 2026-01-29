// Pokémon Leveling System
// Handles XP gain, level-up, stat recalculation, and move learning

import type { PlayerPokemon } from './types';
import type { BattleMove } from './moveSystem';
import { fetchPokemonLearnset, selectMovesForLevel } from './moveSystem';

/**
 * XP Curve: Medium Fast (L^3)
 * This is the simplest and most common curve in Pokémon games
 */
export function getTotalXPForLevel(level: number): number {
  return Math.floor(Math.pow(level, 3));
}

/**
 * Get XP needed to reach next level
 */
export function getXPToNextLevel(currentLevel: number): number {
  return getTotalXPForLevel(currentLevel + 1) - getTotalXPForLevel(currentLevel);
}

/**
 * Calculate level from total XP
 */
export function getLevelFromXP(xpTotal: number): number {
  let level = 1;
  while (xpTotal >= getTotalXPForLevel(level + 1) && level < 100) {
    level++;
  }
  return level;
}

/**
 * Get current XP progress within the current level
 */
export function getXPInCurrentLevel(xpTotal: number, level: number): number {
  return xpTotal - getTotalXPForLevel(level);
}

/**
 * Calculate XP gained from defeating an opponent
 * Formula: (baseExp * opponentLevel) / 7
 * Multiplied by 1.2 for trainer battles
 */
export function calculateXPGain(
  opponentLevel: number,
  opponentBaseExp: number = 60,
  isTrainerBattle: boolean = false
): number {
  let xp = Math.floor((opponentBaseExp * opponentLevel) / 7);
  
  if (isTrainerBattle) {
    xp = Math.floor(xp * 1.2);
  }
  
  // Cap to prevent extreme values
  xp = Math.max(1, Math.min(1000, xp));
  
  return xp;
}

/**
 * Calculate stat value based on base stat and level
 * Simplified formula without IVs/EVs/Nature
 */
export function calculateStat(baseStat: number, level: number, isHP: boolean = false): number {
  if (isHP) {
    // HP formula: floor(((2*baseHP)*level)/100) + level + 10
    return Math.floor(((2 * baseStat) * level) / 100) + level + 10;
  } else {
    // Other stats: floor(((2*baseStat)*level)/100) + 5
    return Math.floor(((2 * baseStat) * level) / 100) + 5;
  }
}

/**
 * Recalculate all stats for a Pokémon at its current level
 * Preserves HP percentage
 */
export function recalculateStats(pokemon: PlayerPokemon): void {
  if (!pokemon.baseHp || !pokemon.baseAttack || !pokemon.baseDefense || !pokemon.baseSpeed) {
    console.warn('[LevelingSystem] Missing base stats for', pokemon.name);
    return;
  }
  
  // Store old HP for percentage calculation
  const oldHpPercent = pokemon.hp / pokemon.maxHp;
  
  // Recalculate stats
  const newMaxHp = calculateStat(pokemon.baseHp, pokemon.level, true);
  pokemon.maxHp = newMaxHp;
  pokemon.attack = calculateStat(pokemon.baseAttack, pokemon.level, false);
  pokemon.defense = calculateStat(pokemon.baseDefense, pokemon.level, false);
  pokemon.speed = calculateStat(pokemon.baseSpeed, pokemon.level, false);
  
  // Preserve HP percentage
  pokemon.hp = Math.max(1, Math.floor(oldHpPercent * newMaxHp));
  
  console.log(`[LevelingSystem] Recalculated stats for ${pokemon.name} Lv.${pokemon.level}:`, {
    HP: pokemon.maxHp,
    Attack: pokemon.attack,
    Defense: pokemon.defense,
    Speed: pokemon.speed,
  });
}

/**
 * Apply XP gain to a Pokémon and handle level-ups
 * Returns array of level-up events for UI handling
 */
export async function gainXP(
  pokemon: PlayerPokemon,
  xpGained: number
): Promise<LevelUpResult> {
  // Initialize xpTotal if not present (migration from old exp field)
  if (pokemon.xpTotal === undefined) {
    pokemon.xpTotal = getTotalXPForLevel(pokemon.level) + (pokemon.exp || 0);
  }
  
  const oldLevel = pokemon.level;
  const oldXpTotal = pokemon.xpTotal;
  
  // Add XP
  pokemon.xpTotal += xpGained;
  
  // Calculate new level
  const newLevel = getLevelFromXP(pokemon.xpTotal);
  
  const result: LevelUpResult = {
    xpGained,
    oldLevel,
    newLevel,
    leveledUp: newLevel > oldLevel,
    levelsGained: newLevel - oldLevel,
    newMoves: [],
  };
  
  // Handle level-ups
  if (result.leveledUp) {
    console.log(`[LevelingSystem] ${pokemon.name} leveled up! ${oldLevel} → ${newLevel}`);
    
    // Update level
    pokemon.level = newLevel;
    
    // Recalculate stats
    recalculateStats(pokemon);
    
    // Check for new moves at each level
    try {
      const learnset = await fetchPokemonLearnset(pokemon.id);
      
      // Find moves learned between oldLevel and newLevel
      for (let level = oldLevel + 1; level <= newLevel; level++) {
        const movesAtLevel = learnset.moves.filter(move => move.learnLevel === level);
        
        for (const move of movesAtLevel) {
          result.newMoves.push({
            move,
            level,
            canLearn: true, // Will be determined by UI
          });
        }
      }
    } catch (error) {
      console.error('[LevelingSystem] Error fetching moves on level up:', error);
    }
  }
  
  return result;
}

/**
 * Learn a move, handling the 4-move limit
 * Returns true if move was learned, false if cancelled
 */
export function learnMove(pokemon: PlayerPokemon, move: BattleMove, replaceIndex?: number): boolean {
  if (!pokemon.battleMoves) {
    pokemon.battleMoves = [];
  }
  
  // If less than 4 moves, add automatically
  if (pokemon.battleMoves.length < 4) {
    pokemon.battleMoves.push(move);
    console.log(`[LevelingSystem] ${pokemon.name} learned ${move.name}!`);
    return true;
  }
  
  // If replaceIndex provided, replace that move
  if (replaceIndex !== undefined && replaceIndex >= 0 && replaceIndex < 4) {
    const oldMove = pokemon.battleMoves[replaceIndex];
    pokemon.battleMoves[replaceIndex] = move;
    console.log(`[LevelingSystem] ${pokemon.name} forgot ${oldMove.name} and learned ${move.name}!`);
    return true;
  }
  
  // Otherwise, learning was cancelled
  return false;
}

/**
 * Initialize base stats for a Pokémon if not present
 */
export function initializeBaseStats(pokemon: PlayerPokemon, baseStats: {
  hp: number;
  attack: number;
  defense: number;
  speed: number;
}): void {
  pokemon.baseHp = baseStats.hp;
  pokemon.baseAttack = baseStats.attack;
  pokemon.baseDefense = baseStats.defense;
  pokemon.baseSpeed = baseStats.speed;
  
  // Recalculate current stats if level is already set
  if (pokemon.level > 1) {
    recalculateStats(pokemon);
  }
}

/**
 * Migrate old Pokémon data to new leveling system
 */
export function migratePokemonData(pokemon: PlayerPokemon): void {
  // Initialize xpTotal from exp if needed
  if (pokemon.xpTotal === undefined) {
    pokemon.xpTotal = getTotalXPForLevel(pokemon.level) + (pokemon.exp || 0);
  }
  
  // Ensure level matches xpTotal
  const calculatedLevel = getLevelFromXP(pokemon.xpTotal);
  if (calculatedLevel !== pokemon.level) {
    console.warn(`[LevelingSystem] Level mismatch for ${pokemon.name}, fixing...`);
    pokemon.level = calculatedLevel;
  }
}

// ============================================
// TYPES
// ============================================

export interface LevelUpResult {
  xpGained: number;
  oldLevel: number;
  newLevel: number;
  leveledUp: boolean;
  levelsGained: number;
  newMoves: NewMoveInfo[];
}

export interface NewMoveInfo {
  move: BattleMove;
  level: number;
  canLearn: boolean;
}

export interface XPBarInfo {
  current: number;
  needed: number;
  percentage: number;
}

/**
 * Get XP bar display info for UI
 */
export function getXPBarInfo(pokemon: PlayerPokemon): XPBarInfo {
  const xpTotal = pokemon.xpTotal ?? getTotalXPForLevel(pokemon.level);
  const current = getXPInCurrentLevel(xpTotal, pokemon.level);
  const needed = getXPToNextLevel(pokemon.level);
  const percentage = (current / needed) * 100;
  
  return {
    current,
    needed,
    percentage: Math.min(100, Math.max(0, percentage)),
  };
}

/**
 * Get base experience value for a Pokémon species
 * Falls back to 60 if not available
 */
export function getBaseExperience(pokemonId: number): number {
  // Mapping of common early-game Pokémon base experience
  const baseExpMap: Record<number, number> = {
    1: 64,   // Bulbasaur
    4: 62,   // Charmander
    7: 63,   // Squirtle
    10: 39,  // Caterpie
    13: 39,  // Weedle
    16: 50,  // Pidgey
    19: 51,  // Rattata
    21: 52,  // Spearow
    23: 58,  // Ekans
    25: 112, // Pikachu
  };
  
  return baseExpMap[pokemonId] ?? 60; // Default fallback
}
