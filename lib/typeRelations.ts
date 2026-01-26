/**
 * Calcule les relations de types pour un Pokémon
 * Retourne : super efficace contre lui, peu efficace contre lui, immunités
 */

type TypeRelations = {
  weakTo: string[];      // Types super efficaces contre ce Pokémon (x2 ou x4)
  resistantTo: string[]; // Types peu efficaces contre ce Pokémon (x0.5 ou x0.25)
  immuneTo: string[];    // Types qui n'affectent pas ce Pokémon (x0)
  strongAgainst: string[]; // Types contre lesquels ce Pokémon est fort
  weakAgainst: string[];   // Types contre lesquels ce Pokémon est faible
};

// Types super efficaces (attaquant → défenseur)
const SUPER: Record<string, string[]> = {
  fire: ["grass", "ice", "bug", "steel"],
  water: ["fire", "ground", "rock"],
  grass: ["water", "ground", "rock"],
  electric: ["water", "flying"],
  ice: ["grass", "ground", "flying", "dragon"],
  fighting: ["normal", "ice", "rock", "dark", "steel"],
  ground: ["fire", "electric", "poison", "rock", "steel"],
  flying: ["grass", "fighting", "bug"],
  psychic: ["fighting", "poison"],
  bug: ["grass", "psychic", "dark"],
  rock: ["fire", "ice", "flying", "bug"],
  ghost: ["psychic", "ghost"],
  dragon: ["dragon"],
  dark: ["psychic", "ghost"],
  steel: ["ice", "rock", "fairy"],
  fairy: ["fighting", "dragon", "dark"],
  poison: ["grass", "fairy"]
};

// Types peu efficaces (attaquant → défenseur)
const NOTVERY: Record<string, string[]> = {
  fire: ["water", "rock", "fire", "dragon"],
  water: ["grass", "water", "dragon"],
  grass: ["fire", "grass", "poison", "flying", "bug", "dragon", "steel"],
  electric: ["grass", "electric", "dragon"],
  ice: ["fire", "water", "ice", "steel"],
  fighting: ["flying", "psychic", "bug", "fairy", "poison"],
  ground: ["grass", "bug"],
  flying: ["electric", "rock", "steel"],
  psychic: ["psychic", "steel"],
  bug: ["fire", "fighting", "flying", "poison", "ghost", "steel", "fairy"],
  rock: ["fighting", "ground", "steel"],
  ghost: ["dark"],
  dragon: ["steel"],
  dark: ["fighting", "dark", "fairy"],
  steel: ["fire", "water", "electric", "steel"],
  fairy: ["fire", "poison", "steel"],
  poison: ["poison", "ground", "rock", "ghost"],
  normal: ["rock", "steel"]
};

// Immunités (attaquant → défenseur immunisé)
const IMMUNE: Record<string, string[]> = {
  normal: ["ghost"],
  fighting: ["ghost"],
  poison: ["steel"],
  ground: ["flying"],
  electric: ["ground"],
  psychic: ["dark"],
  ghost: ["normal"],
  dragon: ["fairy"]
};

const ALL_TYPES = [
  "normal", "fire", "water", "grass", "electric", "ice", 
  "fighting", "poison", "ground", "flying", "psychic", "bug", 
  "rock", "ghost", "dragon", "dark", "steel", "fairy"
];

/**
 * Calcule le multiplicateur de dégâts reçus pour un type donné
 */
export function calculateDefensiveMultiplier(attackType: string, defenderTypes: string[]): number {
  let mult = 1;
  
  for (const dt of defenderTypes) {
    // Immunité
    if (IMMUNE[attackType]?.includes(dt)) {
      return 0;
    }
    
    // Super efficace
    if (SUPER[attackType]?.includes(dt)) {
      mult *= 2;
    }
    // Peu efficace
    else if (NOTVERY[attackType]?.includes(dt)) {
      mult *= 0.5;
    }
  }
  
  return mult;
}

/**
 * Calcule toutes les relations de types pour un Pokémon
 */
export function getTypeRelations(pokemonTypes: string[]): TypeRelations {
  const weakTo: Set<string> = new Set();
  const resistantTo: Set<string> = new Set();
  const immuneTo: Set<string> = new Set();
  const strongAgainst: Set<string> = new Set();
  const weakAgainst: Set<string> = new Set();

  // Pour chaque type d'attaque possible
  for (const attackType of ALL_TYPES) {
    const defensiveMult = calculateDefensiveMultiplier(attackType, pokemonTypes);
    
    // Défense (types qui affectent ce Pokémon)
    if (defensiveMult === 0) {
      immuneTo.add(attackType);
    } else if (defensiveMult >= 2) {
      weakTo.add(attackType);
    } else if (defensiveMult <= 0.5) {
      resistantTo.add(attackType);
    }
  }

  // Attaque (types contre lesquels ce Pokémon est fort/faible)
  for (const defenderType of ALL_TYPES) {
    let offensiveMult = 1;
    
    for (const pokemonType of pokemonTypes) {
      // Ce Pokémon est immunisé par le défenseur ?
      if (IMMUNE[pokemonType]?.includes(defenderType)) {
        offensiveMult = 0;
        break;
      }
      
      // Super efficace contre le défenseur
      if (SUPER[pokemonType]?.includes(defenderType)) {
        offensiveMult *= 2;
      }
      // Peu efficace contre le défenseur
      else if (NOTVERY[pokemonType]?.includes(defenderType)) {
        offensiveMult *= 0.5;
      }
    }
    
    if (offensiveMult >= 2) {
      strongAgainst.add(defenderType);
    } else if (offensiveMult <= 0.5 && offensiveMult > 0) {
      weakAgainst.add(defenderType);
    }
  }

  return {
    weakTo: Array.from(weakTo).sort(),
    resistantTo: Array.from(resistantTo).sort(),
    immuneTo: Array.from(immuneTo).sort(),
    strongAgainst: Array.from(strongAgainst).sort(),
    weakAgainst: Array.from(weakAgainst).sort()
  };
}

// Export TYPE_CHART pour compatibilité avec teamAnalysis.ts
export const TYPE_CHART: Record<string, Record<string, number>> = {};

ALL_TYPES.forEach(defenderType => {
  TYPE_CHART[defenderType] = {};
  
  ALL_TYPES.forEach(attackType => {
    TYPE_CHART[defenderType][attackType] = calculateDefensiveMultiplier(attackType, [defenderType]);
  });
});
