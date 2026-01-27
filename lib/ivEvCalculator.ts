/**
 * IV/EV Calculator for Pokémon Stats
 * 
 * Uses canonical stat formulas from Pokémon games:
 * HP = floor(((2 * Base + IV + floor(EV / 4)) * Level) / 100) + Level + 10
 * Other = (floor(((2 * Base + IV + floor(EV / 4)) * Level) / 100) + 5) * Nature
 */

export type StatName = 'hp' | 'attack' | 'defense' | 'specialAttack' | 'specialDefense' | 'speed';

export interface BaseStats {
  hp: number;
  attack: number;
  defense: number;
  specialAttack: number;
  specialDefense: number;
  speed: number;
}

export interface IVs {
  hp: number;
  attack: number;
  defense: number;
  specialAttack: number;
  specialDefense: number;
  speed: number;
}

export interface EVs {
  hp: number;
  attack: number;
  defense: number;
  specialAttack: number;
  specialDefense: number;
  speed: number;
}

export interface NatureModifiers {
  attack: number;
  defense: number;
  specialAttack: number;
  specialDefense: number;
  speed: number;
}

export interface CalculatedStats {
  hp: number;
  attack: number;
  defense: number;
  specialAttack: number;
  specialDefense: number;
  speed: number;
  total: number;
}

// Nature data: [increased stat, decreased stat]
export const NATURES: Record<string, [StatName | null, StatName | null]> = {
  // Neutral natures
  'Hardy': [null, null],
  'Docile': [null, null],
  'Serious': [null, null],
  'Bashful': [null, null],
  'Quirky': [null, null],
  
  // Attack boosting
  'Lonely': ['attack', 'defense'],
  'Brave': ['attack', 'speed'],
  'Adamant': ['attack', 'specialAttack'],
  'Naughty': ['attack', 'specialDefense'],
  
  // Defense boosting
  'Bold': ['defense', 'attack'],
  'Relaxed': ['defense', 'speed'],
  'Impish': ['defense', 'specialAttack'],
  'Lax': ['defense', 'specialDefense'],
  
  // Special Attack boosting
  'Modest': ['specialAttack', 'attack'],
  'Mild': ['specialAttack', 'defense'],
  'Quiet': ['specialAttack', 'speed'],
  'Rash': ['specialAttack', 'specialDefense'],
  
  // Special Defense boosting
  'Calm': ['specialDefense', 'attack'],
  'Gentle': ['specialDefense', 'defense'],
  'Sassy': ['specialDefense', 'speed'],
  'Careful': ['specialDefense', 'specialAttack'],
  
  // Speed boosting
  'Timid': ['speed', 'attack'],
  'Hasty': ['speed', 'defense'],
  'Jolly': ['speed', 'specialAttack'],
  'Naive': ['speed', 'specialDefense'],
};

/**
 * Get nature modifiers for stat calculation
 */
export function getNatureModifiers(nature: string): NatureModifiers {
  const [increased, decreased] = NATURES[nature] || [null, null];
  
  const modifiers: NatureModifiers = {
    attack: 1.0,
    defense: 1.0,
    specialAttack: 1.0,
    specialDefense: 1.0,
    speed: 1.0,
  };
  
  if (increased && increased !== 'hp') {
    modifiers[increased] = 1.1;
  }
  
  if (decreased && decreased !== 'hp') {
    modifiers[decreased] = 0.9;
  }
  
  return modifiers;
}

/**
 * Calculate HP stat
 */
export function calculateHP(base: number, iv: number, ev: number, level: number): number {
  if (base === 1) {
    // Shedinja special case
    return 1;
  }
  
  return Math.floor(((2 * base + iv + Math.floor(ev / 4)) * level) / 100) + level + 10;
}

/**
 * Calculate non-HP stat
 */
export function calculateStat(
  base: number,
  iv: number,
  ev: number,
  level: number,
  natureModifier: number
): number {
  const baseStat = Math.floor(((2 * base + iv + Math.floor(ev / 4)) * level) / 100) + 5;
  return Math.floor(baseStat * natureModifier);
}

/**
 * Calculate all stats for a Pokémon
 */
export function calculateAllStats(
  baseStats: BaseStats,
  ivs: IVs,
  evs: EVs,
  level: number,
  nature: string
): CalculatedStats {
  const natureModifiers = getNatureModifiers(nature);
  
  const hp = calculateHP(baseStats.hp, ivs.hp, evs.hp, level);
  const attack = calculateStat(baseStats.attack, ivs.attack, evs.attack, level, natureModifiers.attack);
  const defense = calculateStat(baseStats.defense, ivs.defense, evs.defense, level, natureModifiers.defense);
  const specialAttack = calculateStat(baseStats.specialAttack, ivs.specialAttack, evs.specialAttack, level, natureModifiers.specialAttack);
  const specialDefense = calculateStat(baseStats.specialDefense, ivs.specialDefense, evs.specialDefense, level, natureModifiers.specialDefense);
  const speed = calculateStat(baseStats.speed, ivs.speed, evs.speed, level, natureModifiers.speed);
  
  return {
    hp,
    attack,
    defense,
    specialAttack,
    specialDefense,
    speed,
    total: hp + attack + defense + specialAttack + specialDefense + speed,
  };
}

/**
 * Validate IVs (must be 0-31)
 */
export function validateIVs(ivs: IVs): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const stats: (keyof IVs)[] = ['hp', 'attack', 'defense', 'specialAttack', 'specialDefense', 'speed'];
  
  for (const stat of stats) {
    const value = ivs[stat];
    if (value < 0 || value > 31) {
      errors.push(`${stat} IV must be between 0 and 31`);
    }
    if (!Number.isInteger(value)) {
      errors.push(`${stat} IV must be an integer`);
    }
  }
  
  return { valid: errors.length === 0, errors };
}

/**
 * Validate EVs (must be 0-252 per stat, max 510 total)
 */
export function validateEVs(evs: EVs): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const stats: (keyof EVs)[] = ['hp', 'attack', 'defense', 'specialAttack', 'specialDefense', 'speed'];
  
  let total = 0;
  
  for (const stat of stats) {
    const value = evs[stat];
    if (value < 0 || value > 252) {
      errors.push(`${stat} EV must be between 0 and 252`);
    }
    if (!Number.isInteger(value)) {
      errors.push(`${stat} EV must be an integer`);
    }
    if (value % 4 !== 0) {
      errors.push(`${stat} EV should be a multiple of 4 for efficiency`);
    }
    total += value;
  }
  
  if (total > 510) {
    errors.push(`Total EVs (${total}) exceed the maximum of 510`);
  }
  
  return { valid: errors.length === 0, errors };
}

/**
 * Get total EV count
 */
export function getTotalEVs(evs: EVs): number {
  return evs.hp + evs.attack + evs.defense + evs.specialAttack + evs.specialDefense + evs.speed;
}

/**
 * Create default IVs (all 31 - perfect)
 */
export function createPerfectIVs(): IVs {
  return {
    hp: 31,
    attack: 31,
    defense: 31,
    specialAttack: 31,
    specialDefense: 31,
    speed: 31,
  };
}

/**
 * Create default EVs (all 0)
 */
export function createEmptyEVs(): EVs {
  return {
    hp: 0,
    attack: 0,
    defense: 0,
    specialAttack: 0,
    specialDefense: 0,
    speed: 0,
  };
}

/**
 * Common EV spreads
 */
export const COMMON_EV_SPREADS: Record<string, { evs: EVs; description: string }> = {
  'offensive': {
    evs: { hp: 0, attack: 252, defense: 0, specialAttack: 0, specialDefense: 4, speed: 252 },
    description: 'Sweeper physique (Atk/Spe)',
  },
  'special-offensive': {
    evs: { hp: 0, attack: 0, defense: 0, specialAttack: 252, specialDefense: 4, speed: 252 },
    description: 'Sweeper spécial (SpA/Spe)',
  },
  'bulky-physical': {
    evs: { hp: 252, attack: 0, defense: 252, specialAttack: 0, specialDefense: 4, speed: 0 },
    description: 'Tank physique (HP/Def)',
  },
  'bulky-special': {
    evs: { hp: 252, attack: 0, defense: 0, specialAttack: 0, specialDefense: 252, speed: 4 },
    description: 'Tank spécial (HP/SpD)',
  },
  'balanced': {
    evs: { hp: 252, attack: 0, defense: 128, specialAttack: 0, specialDefense: 128, speed: 0 },
    description: 'Équilibré (HP/Def/SpD)',
  },
  'mixed-attacker': {
    evs: { hp: 0, attack: 128, defense: 0, specialAttack: 128, specialDefense: 0, speed: 252 },
    description: 'Attaquant mixte (Atk/SpA/Spe)',
  },
};
