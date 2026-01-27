/**
 * Advanced Damage Calculator for Pokémon
 * 
 * Implements damage formula with major modifiers:
 * - Weather (sun, rain, sand, snow)
 * - Terrain (electric, grassy, psychic, misty)
 * - Screens (reflect, light screen, aurora veil)
 * - Items (Life Orb, Choice Band/Specs, etc.)
 * - Stat boosts (-6 to +6)
 * - STAB and type effectiveness
 */

export interface DamageCalculation {
  minDamage: number;
  maxDamage: number;
  minPercent: number;
  maxPercent: number;
  isKO: boolean;
  koChance: string;
}

export interface BattleConditions {
  weather: Weather;
  terrain: Terrain;
  attackerScreen: Screen;
  defenderScreen: Screen;
}

export type Weather = 'none' | 'sun' | 'rain' | 'sand' | 'snow';
export type Terrain = 'none' | 'electric' | 'grassy' | 'psychic' | 'misty';
export type Screen = 'none' | 'reflect' | 'lightScreen' | 'auroraVeil';
export type Item = 'none' | 'lifeOrb' | 'choiceBand' | 'choiceSpecs' | 'leftovers';

export interface Pokemon {
  name: string;
  level: number;
  attack: number;
  defense: number;
  specialAttack: number;
  specialDefense: number;
  hp: number;
  types: string[];
}

export interface Move {
  name: string;
  power: number;
  type: string;
  category: 'physical' | 'special';
}

export interface Modifiers {
  attackBoost: number; // -6 to +6
  defenseBoost: number; // -6 to +6
  specialAttackBoost: number;
  specialDefenseBoost: number;
  item: Item;
}

/**
 * Get stat boost multiplier
 */
export function getStatBoostMultiplier(boost: number): number {
  const clampedBoost = Math.max(-6, Math.min(6, boost));
  
  if (clampedBoost >= 0) {
    return (2 + clampedBoost) / 2;
  } else {
    return 2 / (2 - clampedBoost);
  }
}

/**
 * Get type effectiveness multiplier
 */
export function getTypeEffectiveness(moveType: string, defenderTypes: string[]): number {
  // Simplified type chart (main interactions)
  const typeChart: Record<string, Record<string, number>> = {
    normal: { rock: 0.5, ghost: 0, steel: 0.5 },
    fire: { fire: 0.5, water: 0.5, grass: 2, ice: 2, bug: 2, rock: 0.5, dragon: 0.5, steel: 2 },
    water: { fire: 2, water: 0.5, grass: 0.5, ground: 2, rock: 2, dragon: 0.5 },
    electric: { water: 2, electric: 0.5, grass: 0.5, ground: 0, flying: 2, dragon: 0.5 },
    grass: { fire: 0.5, water: 2, grass: 0.5, poison: 0.5, ground: 2, flying: 0.5, bug: 0.5, rock: 2, dragon: 0.5, steel: 0.5 },
    ice: { fire: 0.5, water: 0.5, grass: 2, ice: 0.5, ground: 2, flying: 2, dragon: 2, steel: 0.5 },
    fighting: { normal: 2, ice: 2, poison: 0.5, flying: 0.5, psychic: 0.5, bug: 0.5, rock: 2, ghost: 0, dark: 2, steel: 2, fairy: 0.5 },
    poison: { grass: 2, poison: 0.5, ground: 0.5, rock: 0.5, ghost: 0.5, steel: 0, fairy: 2 },
    ground: { fire: 2, electric: 2, grass: 0.5, poison: 2, flying: 0, bug: 0.5, rock: 2, steel: 2 },
    flying: { electric: 0.5, grass: 2, fighting: 2, bug: 2, rock: 0.5, steel: 0.5 },
    psychic: { fighting: 2, poison: 2, psychic: 0.5, dark: 0, steel: 0.5 },
    bug: { fire: 0.5, grass: 2, fighting: 0.5, poison: 0.5, flying: 0.5, psychic: 2, ghost: 0.5, dark: 2, steel: 0.5, fairy: 0.5 },
    rock: { fire: 2, ice: 2, fighting: 0.5, ground: 0.5, flying: 2, bug: 2, steel: 0.5 },
    ghost: { normal: 0, psychic: 2, ghost: 2, dark: 0.5 },
    dragon: { dragon: 2, steel: 0.5, fairy: 0 },
    dark: { fighting: 0.5, psychic: 2, ghost: 2, dark: 0.5, fairy: 0.5 },
    steel: { fire: 0.5, water: 0.5, electric: 0.5, ice: 2, rock: 2, steel: 0.5, fairy: 2 },
    fairy: { fire: 0.5, fighting: 2, poison: 0.5, dragon: 2, dark: 2, steel: 0.5 },
  };
  
  let effectiveness = 1.0;
  
  for (const defenderType of defenderTypes) {
    const matchup = typeChart[moveType]?.[defenderType];
    if (matchup !== undefined) {
      effectiveness *= matchup;
    }
  }
  
  return effectiveness;
}

/**
 * Check if move gets STAB bonus
 */
export function hasSTAB(moveType: string, attackerTypes: string[]): boolean {
  return attackerTypes.includes(moveType);
}

/**
 * Get weather modifier
 */
export function getWeatherModifier(moveType: string, weather: Weather): number {
  if (weather === 'sun') {
    if (moveType === 'fire') return 1.5;
    if (moveType === 'water') return 0.5;
  }
  
  if (weather === 'rain') {
    if (moveType === 'water') return 1.5;
    if (moveType === 'fire') return 0.5;
  }
  
  return 1.0;
}

/**
 * Get terrain modifier
 */
export function getTerrainModifier(moveType: string, terrain: Terrain, attackerGrounded: boolean): number {
  if (!attackerGrounded) return 1.0;
  
  if (terrain === 'electric' && moveType === 'electric') return 1.3;
  if (terrain === 'grassy' && moveType === 'grass') return 1.3;
  if (terrain === 'psychic' && moveType === 'psychic') return 1.3;
  
  return 1.0;
}

/**
 * Get screen modifier
 */
export function getScreenModifier(
  moveCategory: 'physical' | 'special',
  defenderScreen: Screen,
  doubles: boolean = false
): number {
  const screenMultiplier = doubles ? 2732 / 4096 : 2048 / 4096;
  
  if (defenderScreen === 'auroraVeil') {
    return screenMultiplier;
  }
  
  if (moveCategory === 'physical' && defenderScreen === 'reflect') {
    return screenMultiplier;
  }
  
  if (moveCategory === 'special' && defenderScreen === 'lightScreen') {
    return screenMultiplier;
  }
  
  return 1.0;
}

/**
 * Get item modifier
 */
export function getItemModifier(item: Item, moveCategory: 'physical' | 'special'): number {
  if (item === 'lifeOrb') return 1.3;
  if (item === 'choiceBand' && moveCategory === 'physical') return 1.5;
  if (item === 'choiceSpecs' && moveCategory === 'special') return 1.5;
  
  return 1.0;
}

/**
 * Calculate damage
 */
export function calculateDamage(
  attacker: Pokemon,
  defender: Pokemon,
  move: Move,
  attackerModifiers: Modifiers,
  defenderModifiers: Modifiers,
  conditions: BattleConditions
): DamageCalculation {
  // Determine attacking and defending stats
  const isPhysical = move.category === 'physical';
  
  let attackStat = isPhysical ? attacker.attack : attacker.specialAttack;
  let defenseStat = isPhysical ? defender.defense : defender.specialDefense;
  
  // Apply stat boosts
  const attackBoost = isPhysical ? attackerModifiers.attackBoost : attackerModifiers.specialAttackBoost;
  const defenseBoost = isPhysical ? defenderModifiers.defenseBoost : defenderModifiers.specialDefenseBoost;
  
  attackStat = Math.floor(attackStat * getStatBoostMultiplier(attackBoost));
  defenseStat = Math.floor(defenseStat * getStatBoostMultiplier(defenseBoost));
  
  // Base damage formula
  const level = attacker.level;
  const power = move.power;
  
  const baseDamage = Math.floor((2 * level / 5 + 2) * power * attackStat / defenseStat / 50) + 2;
  
  // Apply modifiers
  let modifier = 1.0;
  
  // STAB
  if (hasSTAB(move.type, attacker.types)) {
    modifier *= 1.5;
  }
  
  // Type effectiveness
  const effectiveness = getTypeEffectiveness(move.type, defender.types);
  modifier *= effectiveness;
  
  // Weather
  modifier *= getWeatherModifier(move.type, conditions.weather);
  
  // Terrain (assume grounded for simplicity)
  modifier *= getTerrainModifier(move.type, conditions.terrain, true);
  
  // Screens
  modifier *= getScreenModifier(move.category, conditions.defenderScreen);
  
  // Items
  modifier *= getItemModifier(attackerModifiers.item, move.category);
  
  // Random factor (0.85 to 1.0)
  const minDamage = Math.floor(baseDamage * modifier * 0.85);
  const maxDamage = Math.floor(baseDamage * modifier * 1.0);
  
  const minPercent = (minDamage / defender.hp) * 100;
  const maxPercent = (maxDamage / defender.hp) * 100;
  
  // KO chance estimation
  const isKO = minDamage >= defender.hp;
  let koChance = 'Impossible';
  
  if (isKO) {
    koChance = '100%';
  } else if (maxDamage >= defender.hp) {
    // Calculate approximate KO chance based on damage range
    const koRolls = Math.ceil((defender.hp - minDamage) / (maxDamage - minDamage) * 16);
    koChance = `${Math.round((16 - koRolls) / 16 * 100)}%`;
  } else if (maxDamage >= defender.hp * 0.9) {
    koChance = 'Possible avec crit';
  }
  
  return {
    minDamage,
    maxDamage,
    minPercent,
    maxPercent,
    isKO,
    koChance,
  };
}

/**
 * Format damage range for display
 */
export function formatDamageRange(calc: DamageCalculation): string {
  return `${calc.minDamage} - ${calc.maxDamage} (${calc.minPercent.toFixed(1)}% - ${calc.maxPercent.toFixed(1)}%)`;
}

/**
 * Get effectiveness description
 */
export function getEffectivenessText(effectiveness: number): string {
  if (effectiveness === 0) return 'Aucun effet';
  if (effectiveness < 0.5) return 'Vraiment pas efficace';
  if (effectiveness === 0.5) return 'Pas très efficace';
  if (effectiveness === 1) return 'Efficacité normale';
  if (effectiveness === 2) return 'Super efficace';
  if (effectiveness > 2) return 'Extrêmement efficace';
  return 'Efficacité inconnue';
}
