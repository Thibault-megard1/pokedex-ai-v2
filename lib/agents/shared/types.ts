/**
 * Types partagés pour les agents
 * 
 * Définit les interfaces communes utilisées par MasterAgent, SubAgents et les outils.
 */

// ============================================================================
// TYPE POKÉMON
// ============================================================================

export interface Pokemon {
  id: number;
  name: string;
  types: string[];
  stats?: { name: string; value: number }[];
  moves?: Move[];
  abilities?: string[];
  held_item?: string;
}

export interface Move {
  name: string;
  type: string;
  power: number;
  accuracy: number;
  damageClass: "physical" | "special" | "status";
  pp?: number;
  priority?: number;
  effect?: string;
}

// ============================================================================
// TYPE EFFECTIVENESS
// ============================================================================

export const TYPE_CHART: Record<string, Record<string, number>> = {
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
  fairy: { fire: 0.5, fighting: 2, poison: 0.5, dragon: 2, dark: 2, steel: 0.5 }
};

export const ALL_TYPES = [
  "normal", "fire", "water", "electric", "grass", "ice",
  "fighting", "poison", "ground", "flying", "psychic", "bug",
  "rock", "ghost", "dragon", "dark", "steel", "fairy"
];

// ============================================================================
// OUTILS D'ANALYSE
// ============================================================================

/**
 * Calcule l'efficacité d'un type attaquant contre un ensemble de types défensifs
 */
export function getTypeEffectiveness(attackType: string, defenseTypes: string[]): number {
  let multiplier = 1;
  for (const defType of defenseTypes) {
    const chart = TYPE_CHART[attackType.toLowerCase()];
    if (chart && chart[defType.toLowerCase()] !== undefined) {
      multiplier *= chart[defType.toLowerCase()];
    }
  }
  return multiplier;
}

/**
 * Analyse les faiblesses d'une équipe
 */
export function analyzeTeamWeaknesses(team: Pokemon[]): string[] {
  const weaknessCount: Record<string, number> = {};
  
  for (const pokemon of team) {
    for (const attackType of ALL_TYPES) {
      const effectiveness = getTypeEffectiveness(attackType, pokemon.types);
      if (effectiveness > 1) {
        weaknessCount[attackType] = (weaknessCount[attackType] || 0) + 1;
      }
    }
  }
  
  // Faiblesses critiques: types super-efficaces contre 3+ Pokémon
  return Object.entries(weaknessCount)
    .filter(([_, count]) => count >= 3)
    .map(([type]) => type);
}

/**
 * Analyse les résistances d'une équipe
 */
export function analyzeTeamResistances(team: Pokemon[]): string[] {
  const resistanceCount: Record<string, number> = {};
  
  for (const pokemon of team) {
    for (const attackType of ALL_TYPES) {
      const effectiveness = getTypeEffectiveness(attackType, pokemon.types);
      if (effectiveness < 1) {
        resistanceCount[attackType] = (resistanceCount[attackType] || 0) + 1;
      }
    }
  }
  
  // Bonnes résistances: types résistés par 3+ Pokémon
  return Object.entries(resistanceCount)
    .filter(([_, count]) => count >= 3)
    .map(([type]) => type);
}

/**
 * Récupère une stat d'un Pokémon
 */
export function getStat(pokemon: Pokemon, statName: string): number {
  return pokemon.stats?.find(s => s.name === statName)?.value || 0;
}

/**
 * Calcule le total de stats d'un Pokémon
 */
export function getTotalStats(pokemon: Pokemon): number {
  return pokemon.stats?.reduce((sum, s) => sum + s.value, 0) || 0;
}

// ============================================================================
// RÔLES POKÉMON
// ============================================================================

export type PokemonRole = "sweeper" | "wall" | "support" | "tank" | "pivot";

/**
 * Classifie un Pokémon par son rôle probable
 */
export function classifyRole(pokemon: Pokemon): PokemonRole {
  const attack = getStat(pokemon, "attack");
  const spAttack = getStat(pokemon, "special-attack");
  const defense = getStat(pokemon, "defense");
  const spDefense = getStat(pokemon, "special-defense");
  const hp = getStat(pokemon, "hp");
  const speed = getStat(pokemon, "speed");
  
  const offensiveTotal = attack + spAttack;
  const defensiveTotal = defense + spDefense + hp;
  
  if (speed > 100 && offensiveTotal > 200) {
    return "sweeper";
  } else if (defensiveTotal > 300 && offensiveTotal < 160) {
    return "wall";
  } else if (hp > 90 && defense > 80 && spDefense > 80) {
    return "tank";
  } else if (speed > 80 && defensiveTotal > 200) {
    return "pivot";
  }
  
  return "support";
}

/**
 * Analyse la distribution des rôles dans une équipe
 */
export function analyzeRoleDistribution(team: Pokemon[]): Record<PokemonRole, number> {
  const distribution: Record<PokemonRole, number> = {
    sweeper: 0,
    wall: 0,
    support: 0,
    tank: 0,
    pivot: 0
  };
  
  for (const pokemon of team) {
    const role = classifyRole(pokemon);
    distribution[role]++;
  }
  
  return distribution;
}
