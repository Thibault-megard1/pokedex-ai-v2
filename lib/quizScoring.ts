/**
 * Quiz Scoring System - Algorithmic Pokemon Matching
 * Maps personality answers to Pokemon attributes (types, stats, habitat)
 */

import type { QuizAnswers } from "./quiz";

// ============================================================================
// TYPES
// ============================================================================

export interface PokemonScore {
  id: number;
  name: string;
  nameFr?: string;
  score: number;
  reasons: string[];
  types: string[];
  stats: {
    hp: number;
    attack: number;
    defense: number;
    specialAttack: number;
    specialDefense: number;
    speed: number;
  };
}

export interface QuizScores {
  typeScores: { [key: string]: number };
  statScores: {
    hp: number;
    attack: number;
    defense: number;
    specialAttack: number;
    specialDefense: number;
    speed: number;
  };
  habitatScores: { [key: string]: number };
  personalityTraits: string[];
}

// ============================================================================
// SCORING ALGORITHM
// ============================================================================

/**
 * Calculate personality scores from quiz answers
 */
export function calculateScores(answers: QuizAnswers): QuizScores {
  const typeScores: { [key: string]: number } = {
    fire: 0,
    water: 0,
    grass: 0,
    electric: 0,
    psychic: 0,
    dark: 0,
    fighting: 0,
    rock: 0,
    ice: 0,
    dragon: 0,
    fairy: 0,
    ghost: 0,
    normal: 0,
    flying: 0,
    bug: 0,
    poison: 0,
    ground: 0,
    steel: 0,
  };

  const statScores = {
    hp: 0,
    attack: 0,
    defense: 0,
    specialAttack: 0,
    specialDefense: 0,
    speed: 0,
  };

  const habitatScores: { [key: string]: number } = {
    forest: 0,
    water: 0,
    mountain: 0,
    urban: 0,
    grassland: 0,
    cave: 0,
  };

  const personalityTraits: string[] = [];

  // Question 1: Social Energy
  const social = answers.social_energy as string;
  if (social?.includes("Seul")) {
    typeScores.psychic += 3;
    typeScores.ghost += 2;
    typeScores.dark += 2;
    habitatScores.cave += 2;
    personalityTraits.push("Introverti");
  } else if (social?.includes("quelques amis")) {
    typeScores.normal += 2;
    typeScores.fairy += 2;
    personalityTraits.push("Loyal");
  } else if (social?.includes("groupe")) {
    typeScores.fighting += 2;
    typeScores.fire += 2;
    habitatScores.urban += 2;
    personalityTraits.push("Sociable");
  } else if (social?.includes("explorant")) {
    typeScores.flying += 3;
    typeScores.dragon += 2;
    personalityTraits.push("Aventurier");
  }

  // Question 2: Environment
  const environment = answers.environment as string;
  if (environment?.includes("forêts")) {
    typeScores.grass += 5;
    typeScores.bug += 3;
    habitatScores.forest += 5;
    personalityTraits.push("Nature");
  } else if (environment?.includes("océans")) {
    typeScores.water += 5;
    typeScores.ice += 2;
    habitatScores.water += 5;
    personalityTraits.push("Calme");
  } else if (environment?.includes("montagnes")) {
    typeScores.rock += 5;
    typeScores.fighting += 2;
    typeScores.dragon += 2;
    habitatScores.mountain += 5;
    personalityTraits.push("Déterminé");
  } else if (environment?.includes("plaines")) {
    typeScores.fire += 3;
    typeScores.ground += 3;
    habitatScores.grassland += 4;
    personalityTraits.push("Libre");
  } else if (environment?.includes("villes")) {
    typeScores.electric += 4;
    typeScores.steel += 3;
    habitatScores.urban += 5;
    personalityTraits.push("Moderne");
  } else if (environment?.includes("mystérieuses")) {
    typeScores.ghost += 5;
    typeScores.dark += 4;
    typeScores.psychic += 2;
    habitatScores.cave += 4;
    personalityTraits.push("Mystérieux");
  }

  // Question 3: Combat Style
  const combat = answers.combat_style as string;
  if (combat?.includes("Offensif")) {
    statScores.attack += 5;
    typeScores.fighting += 3;
    typeScores.fire += 2;
    personalityTraits.push("Offensif");
  } else if (combat?.includes("Défensif")) {
    statScores.defense += 5;
    statScores.hp += 3;
    typeScores.rock += 3;
    typeScores.steel += 2;
    personalityTraits.push("Protecteur");
  } else if (combat?.includes("Tactique")) {
    statScores.specialAttack += 4;
    typeScores.psychic += 4;
    typeScores.dark += 2;
    personalityTraits.push("Stratégique");
  } else if (combat?.includes("Pacifique")) {
    typeScores.normal += 3;
    typeScores.fairy += 3;
    typeScores.grass += 2;
    personalityTraits.push("Pacifique");
  } else if (combat?.includes("Rapide")) {
    statScores.speed += 5;
    typeScores.electric += 3;
    typeScores.flying += 2;
    personalityTraits.push("Rapide");
  }

  // Question 4: Temperament
  const temperament = answers.temperament as string;
  if (temperament?.includes("Calme")) {
    typeScores.water += 3;
    typeScores.grass += 2;
    typeScores.psychic += 2;
    statScores.specialDefense += 2;
    personalityTraits.push("Posé");
  } else if (temperament?.includes("Énergique")) {
    typeScores.fire += 4;
    typeScores.electric += 3;
    statScores.speed += 3;
    statScores.attack += 2;
    personalityTraits.push("Énergique");
  } else if (temperament?.includes("Timide")) {
    typeScores.fairy += 3;
    typeScores.grass += 2;
    typeScores.bug += 2;
    statScores.specialDefense += 2;
    personalityTraits.push("Prudent");
  } else if (temperament?.includes("Courageux")) {
    typeScores.fighting += 4;
    typeScores.dragon += 3;
    statScores.attack += 3;
    personalityTraits.push("Courageux");
  } else if (temperament?.includes("Joyeux")) {
    typeScores.normal += 3;
    typeScores.electric += 2;
    typeScores.fairy += 2;
    personalityTraits.push("Joyeux");
  }

  // Question 5: Speed vs Power (slider 1-5)
  const speedPower = answers.speed_power as number;
  if (speedPower <= 2) {
    statScores.speed += 5;
    typeScores.electric += 2;
    typeScores.flying += 2;
  } else if (speedPower >= 4) {
    statScores.attack += 4;
    statScores.hp += 2;
    typeScores.fighting += 2;
    typeScores.rock += 2;
  } else {
    statScores.attack += 2;
    statScores.speed += 2;
  }

  // Question 6: Team Role
  const teamRole = answers.team_role as string;
  if (teamRole?.includes("leader")) {
    typeScores.dragon += 3;
    typeScores.fire += 2;
    statScores.attack += 2;
    personalityTraits.push("Leader");
  } else if (teamRole?.includes("stratège")) {
    typeScores.psychic += 4;
    statScores.specialAttack += 3;
    personalityTraits.push("Intelligent");
  } else if (teamRole?.includes("protecteur")) {
    typeScores.steel += 3;
    typeScores.fighting += 2;
    statScores.defense += 3;
    personalityTraits.push("Dévoué");
  } else if (teamRole?.includes("solitaire")) {
    typeScores.dark += 3;
    typeScores.ghost += 2;
    personalityTraits.push("Indépendant");
  } else if (teamRole?.includes("médiateur")) {
    typeScores.fairy += 3;
    typeScores.psychic += 2;
    personalityTraits.push("Empathique");
  } else if (teamRole?.includes("explorateur")) {
    typeScores.flying += 3;
    typeScores.bug += 2;
    statScores.speed += 2;
    personalityTraits.push("Curieux");
  }

  // Question 7: Motivation
  const motivation = answers.motivation as string;
  if (motivation?.includes("meilleur")) {
    typeScores.dragon += 4;
    typeScores.fighting += 3;
    statScores.attack += 2;
    personalityTraits.push("Ambitieux");
  } else if (motivation?.includes("Protéger")) {
    typeScores.fairy += 3;
    typeScores.steel += 2;
    statScores.defense += 3;
    personalityTraits.push("Altruiste");
  } else if (motivation?.includes("Découvrir")) {
    typeScores.psychic += 3;
    typeScores.flying += 2;
    personalityTraits.push("Explorateur");
  } else if (motivation?.includes("paix")) {
    typeScores.grass += 3;
    typeScores.water += 2;
    personalityTraits.push("Zen");
  } else if (motivation?.includes("Créer")) {
    typeScores.psychic += 2;
    typeScores.fairy += 2;
    statScores.specialAttack += 2;
    personalityTraits.push("Créatif");
  } else if (motivation?.includes("aventures")) {
    typeScores.fire += 3;
    typeScores.flying += 2;
    statScores.speed += 2;
    personalityTraits.push("Aventurier");
  }

  // Question 8: Resilience (slider 1-5)
  const resilience = answers.resilience as number;
  if (resilience <= 2) {
    typeScores.fairy += 2;
    typeScores.grass += 1;
    statScores.hp += 1;
  } else if (resilience >= 4) {
    statScores.defense += 4;
    statScores.hp += 3;
    typeScores.rock += 3;
    typeScores.steel += 2;
  } else {
    statScores.defense += 2;
    statScores.hp += 2;
  }

  // Question 9: Intelligence Style
  const intelligence = answers.intelligence as string;
  if (intelligence?.includes("Logique")) {
    typeScores.psychic += 4;
    typeScores.steel += 2;
    statScores.specialAttack += 3;
    personalityTraits.push("Analytique");
  } else if (intelligence?.includes("Intuitive")) {
    typeScores.psychic += 3;
    typeScores.fairy += 2;
    personalityTraits.push("Créatif");
  } else if (intelligence?.includes("Émotionnelle")) {
    typeScores.fairy += 4;
    typeScores.psychic += 2;
    personalityTraits.push("Empathique");
  } else if (intelligence?.includes("Pratique")) {
    typeScores.fighting += 3;
    typeScores.normal += 2;
    statScores.attack += 2;
    personalityTraits.push("Pragmatique");
  } else if (intelligence?.includes("Stratégique")) {
    typeScores.dark += 3;
    typeScores.psychic += 3;
    statScores.specialAttack += 3;
    personalityTraits.push("Visionnaire");
  }

  // Question 10: Activity Level (slider 1-5)
  const activityLevel = answers.activity_level as number;
  if (activityLevel <= 2) {
    typeScores.normal += 2;
    typeScores.grass += 2;
    statScores.hp += 2;
  } else if (activityLevel >= 4) {
    statScores.speed += 4;
    typeScores.electric += 2;
    typeScores.fighting += 2;
  } else {
    statScores.speed += 1;
    statScores.attack += 1;
  }

  // Question 11: Time of Day
  const timePreference = answers.time_preference as string;
  if (timePreference?.includes("matin")) {
    typeScores.flying += 2;
    typeScores.grass += 2;
    typeScores.normal += 1;
  } else if (timePreference?.includes("journée")) {
    typeScores.fire += 2;
    typeScores.electric += 2;
  } else if (timePreference?.includes("crépuscule")) {
    typeScores.ghost += 2;
    typeScores.psychic += 2;
  } else if (timePreference?.includes("nuit")) {
    typeScores.dark += 3;
    typeScores.ghost += 3;
  }

  // Question 12: Element (direct mapping)
  const element = answers.element as string;
  if (element?.includes("Feu")) {
    typeScores.fire += 6;
    statScores.attack += 2;
    statScores.specialAttack += 2;
  } else if (element?.includes("Eau")) {
    typeScores.water += 6;
    statScores.specialDefense += 2;
  } else if (element?.includes("Plante")) {
    typeScores.grass += 6;
    statScores.defense += 2;
  } else if (element?.includes("Électricité")) {
    typeScores.electric += 6;
    statScores.speed += 3;
  } else if (element?.includes("Roche")) {
    typeScores.rock += 6;
    statScores.defense += 3;
  } else if (element?.includes("Glace")) {
    typeScores.ice += 6;
    statScores.specialAttack += 2;
  }

  // Question 13: Decision Making
  const decisionMaking = answers.decision_making as string;
  if (decisionMaking?.includes("analyse")) {
    typeScores.psychic += 3;
    typeScores.steel += 2;
    statScores.specialDefense += 2;
    personalityTraits.push("Réfléchi");
  } else if (decisionMaking?.includes("instinct")) {
    typeScores.fire += 2;
    typeScores.fighting += 2;
    statScores.attack += 2;
    personalityTraits.push("Instinctif");
  } else if (decisionMaking?.includes("conseil")) {
    typeScores.normal += 2;
    typeScores.fairy += 2;
    personalityTraits.push("Collaboratif");
  } else if (decisionMaking?.includes("risques")) {
    typeScores.dragon += 3;
    typeScores.fire += 2;
    statScores.attack += 2;
    personalityTraits.push("Audacieux");
  } else if (decisionMaking?.includes("prudemment")) {
    typeScores.rock += 2;
    typeScores.steel += 2;
    statScores.defense += 2;
    personalityTraits.push("Prudent");
  }

  // Question 14: Adaptability (slider 1-5)
  const adaptability = answers.adaptability as number;
  if (adaptability <= 2) {
    typeScores.rock += 2;
    typeScores.steel += 2;
    statScores.defense += 2;
  } else if (adaptability >= 4) {
    typeScores.water += 3;
    typeScores.normal += 2;
    typeScores.flying += 2;
  } else {
    typeScores.normal += 1;
  }

  // Question 15: Loyalty
  const loyalty = answers.loyalty as string;
  if (loyalty?.includes("loyal")) {
    typeScores.fairy += 3;
    typeScores.normal += 2;
    personalityTraits.push("Fidèle");
  } else if (loyalty?.includes("Indépendant")) {
    typeScores.dark += 3;
    typeScores.flying += 2;
    personalityTraits.push("Indépendant");
  } else if (loyalty?.includes("Protecteur")) {
    typeScores.steel += 3;
    typeScores.fighting += 2;
    statScores.defense += 2;
    personalityTraits.push("Protecteur");
  } else if (loyalty?.includes("Sélectif")) {
    typeScores.psychic += 2;
    typeScores.ghost += 2;
    personalityTraits.push("Sélectif");
  } else if (loyalty?.includes("Sociable")) {
    typeScores.normal += 2;
    typeScores.electric += 2;
    personalityTraits.push("Extraverti");
  }

  return {
    typeScores,
    statScores,
    habitatScores,
    personalityTraits: [...new Set(personalityTraits)], // Remove duplicates
  };
}

/**
 * Calculate compatibility score between quiz scores and a Pokemon
 */
export function calculatePokemonCompatibility(
  quizScores: QuizScores,
  pokemon: {
    id: number;
    name: string;
    types: string[];
    stats: {
      hp: number;
      attack: number;
      defense: number;
      specialAttack: number;
      specialDefense: number;
      speed: number;
    };
  }
): number {
  let score = 0;

  // Type matching (40% weight)
  for (const type of pokemon.types) {
    score += (quizScores.typeScores[type] || 0) * 4;
  }

  // Stats correlation (30% weight)
  // Normalize stats and compare distribution similarity
  const totalQuizStats =
    quizScores.statScores.hp +
    quizScores.statScores.attack +
    quizScores.statScores.defense +
    quizScores.statScores.specialAttack +
    quizScores.statScores.specialDefense +
    quizScores.statScores.speed;

  const totalPokemonStats =
    pokemon.stats.hp +
    pokemon.stats.attack +
    pokemon.stats.defense +
    pokemon.stats.specialAttack +
    pokemon.stats.specialDefense +
    pokemon.stats.speed;

  if (totalQuizStats > 0 && totalPokemonStats > 0) {
    // Calculate correlation between stat distributions
    const quizStatDist = {
      hp: quizScores.statScores.hp / totalQuizStats,
      attack: quizScores.statScores.attack / totalQuizStats,
      defense: quizScores.statScores.defense / totalQuizStats,
      specialAttack: quizScores.statScores.specialAttack / totalQuizStats,
      specialDefense: quizScores.statScores.specialDefense / totalQuizStats,
      speed: quizScores.statScores.speed / totalQuizStats,
    };

    const pokemonStatDist = {
      hp: pokemon.stats.hp / totalPokemonStats,
      attack: pokemon.stats.attack / totalPokemonStats,
      defense: pokemon.stats.defense / totalPokemonStats,
      specialAttack: pokemon.stats.specialAttack / totalPokemonStats,
      specialDefense: pokemon.stats.specialDefense / totalPokemonStats,
      speed: pokemon.stats.speed / totalPokemonStats,
    };

    // Similarity score (inverse of sum of squared differences)
    const statSimilarity =
      1 -
      (Math.pow(quizStatDist.hp - pokemonStatDist.hp, 2) +
        Math.pow(quizStatDist.attack - pokemonStatDist.attack, 2) +
        Math.pow(quizStatDist.defense - pokemonStatDist.defense, 2) +
        Math.pow(quizStatDist.specialAttack - pokemonStatDist.specialAttack, 2) +
        Math.pow(quizStatDist.specialDefense - pokemonStatDist.specialDefense, 2) +
        Math.pow(quizStatDist.speed - pokemonStatDist.speed, 2));

    score += statSimilarity * 30;
  }

  // Bonus for popular/iconic Pokemon (10% weight)
  const iconicPokemon = [1, 3, 4, 6, 7, 9, 25, 133, 143, 149, 150, 151];
  if (iconicPokemon.includes(pokemon.id)) {
    score += 10;
  }

  return score;
}

/**
 * Generate reasons for why a Pokemon matches the user's personality
 */
export function generateReasons(
  quizScores: QuizScores,
  pokemon: {
    name: string;
    types: string[];
    stats: {
      hp: number;
      attack: number;
      defense: number;
      specialAttack: number;
      specialDefense: number;
      speed: number;
    };
  },
  answers: QuizAnswers
): string[] {
  const reasons: string[] = [];

  // Type-based reasons
  const topTypes = Object.entries(quizScores.typeScores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .filter(([, score]) => score > 5)
    .map(([type]) => type);

  for (const type of pokemon.types) {
    if (topTypes.includes(type)) {
      const typeReasons: { [key: string]: string } = {
        fire: "Votre personnalité passionnée et énergique s'aligne avec le type Feu",
        water: "Votre nature calme et adaptable reflète le type Eau",
        grass: "Votre tempérament paisible et bienveillant correspond au type Plante",
        electric: "Votre vivacité et dynamisme résonnent avec le type Électrik",
        psychic: "Votre intelligence et réflexion profonde s'accordent au type Psy",
        dark: "Votre côté mystérieux et stratégique correspond au type Ténèbres",
        fighting: "Votre détermination et courage s'alignent avec le type Combat",
        dragon: "Votre ambition et puissance reflètent le type Dragon",
        fairy: "Votre douceur et empathie correspondent au type Fée",
        rock: "Votre stabilité et résilience s'accordent au type Roche",
        ice: "Votre contrôle et précision reflètent le type Glace",
        ghost: "Votre indépendance et mystère correspondent au type Spectre",
      };
      if (typeReasons[type]) {
        reasons.push(typeReasons[type]);
      }
    }
  }

  // Stat-based reasons
  const maxStat = Object.entries(pokemon.stats).reduce((max, [key, value]) =>
    value > max.value ? { key, value } : max
  , { key: '', value: 0 });

  if (maxStat.key === "speed" && quizScores.statScores.speed > 5) {
    reasons.push("Comme vous, ce Pokémon privilégie la rapidité et l'agilité");
  } else if (maxStat.key === "attack" && quizScores.statScores.attack > 5) {
    reasons.push("Son approche offensive correspond à votre style direct");
  } else if (maxStat.key === "defense" && quizScores.statScores.defense > 5) {
    reasons.push("Sa nature défensive reflète votre résilience");
  } else if (maxStat.key === "specialAttack" && quizScores.statScores.specialAttack > 5) {
    reasons.push("Son intelligence tactique s'aligne avec votre esprit stratégique");
  }

  // Personality trait-based reasons
  if (quizScores.personalityTraits.includes("Leader") && pokemon.stats.attack > 100) {
    reasons.push("Ce Pokémon incarne les qualités de leadership que vous possédez");
  }

  if (quizScores.personalityTraits.includes("Protecteur") && pokemon.stats.defense > 100) {
    reasons.push("Sa nature protectrice reflète votre désir de veiller sur les autres");
  }

  // Environment-based reasons
  const environment = answers.environment as string;
  if (environment?.includes("forêts") && pokemon.types.includes("grass")) {
    reasons.push("Vous partagez un amour pour la nature et les espaces verts");
  } else if (environment?.includes("océans") && pokemon.types.includes("water")) {
    reasons.push("Votre affinité avec l'eau se reflète dans ce Pokémon");
  }

  // Ensure at least 2 reasons
  if (reasons.length === 0) {
    reasons.push(`Ce Pokémon reflète votre personnalité unique`);
    reasons.push(`Vous partagez des valeurs et un tempérament similaires`);
  } else if (reasons.length === 1) {
    reasons.push(`Votre personnalité s'aligne naturellement avec ce Pokémon`);
  }

  return reasons.slice(0, 4); // Max 4 reasons
}
