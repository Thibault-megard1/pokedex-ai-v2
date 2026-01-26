// Formules officielles Pokémon pour calcul de dégâts
// Source: https://bulbapedia.bulbagarden.net/wiki/Damage

import { TYPE_CHART } from "./typeRelations";

export type DamageCalculation = {
  minDamage: number;
  maxDamage: number;
  effectiveness: number;
  isCritical: boolean;
  description: string[];
};

export type CalculatorInput = {
  attackerLevel: number;
  attackerAttack: number; // ou Special Attack
  defenderDefense: number; // ou Special Defense
  movePower: number;
  attackerType: string[];
  defenderType: string[];
  moveType: string;
  isPhysical: boolean;
  attackerNature?: { increased?: string; decreased?: string };
  defenderNature?: { increased?: string; decreased?: string };
  attackerEVs?: number; // 0-252
  defenderEVs?: number; // 0-252
  attackerIVs?: number; // 0-31
  defenderIVs?: number; // 0-31
  itemMultiplier?: number; // Choice Band = 1.5, Life Orb = 1.3, etc.
  weatherBoost?: boolean;
};

function calculateEffectiveness(moveType: string, defenderTypes: string[]): number {
  let effectiveness = 1;
  
  defenderTypes.forEach(type => {
    const multiplier = TYPE_CHART[moveType]?.[type];
    if (multiplier !== undefined) {
      effectiveness *= multiplier;
    }
  });
  
  return effectiveness;
}

function hasSTAB(moveType: string, attackerTypes: string[]): boolean {
  return attackerTypes.includes(moveType);
}

function getNatureMultiplier(nature?: { increased?: string; decreased?: string }, stat?: string): number {
  if (!nature || !stat) return 1;
  if (nature.increased === stat) return 1.1;
  if (nature.decreased === stat) return 0.9;
  return 1;
}

function calculateStat(
  base: number,
  level: number,
  iv: number = 31,
  ev: number = 0,
  natureMult: number = 1
): number {
  // Formule officielle: ((2 * Base + IV + EV/4) * Level / 100 + 5) * Nature
  return Math.floor(((2 * base + iv + Math.floor(ev / 4)) * level / 100 + 5) * natureMult);
}

export function calculateDamage(input: CalculatorInput): DamageCalculation {
  const {
    attackerLevel,
    attackerAttack,
    defenderDefense,
    movePower,
    attackerType,
    defenderType,
    moveType,
    isPhysical,
    attackerNature,
    defenderNature,
    itemMultiplier = 1,
    weatherBoost = false
  } = input;

  const descriptions: string[] = [];

  // Calculer l'efficacité du type
  const effectiveness = calculateEffectiveness(moveType, defenderType);
  
  if (effectiveness > 1) {
    descriptions.push(`Super efficace (×${effectiveness})`);
  } else if (effectiveness < 1 && effectiveness > 0) {
    descriptions.push(`Peu efficace (×${effectiveness})`);
  } else if (effectiveness === 0) {
    descriptions.push("Aucun effet");
  }

  // STAB (Same Type Attack Bonus)
  const stab = hasSTAB(moveType, attackerType) ? 1.5 : 1;
  if (stab > 1) {
    descriptions.push("STAB (+50%)");
  }

  // Nature multipliers
  const atkStatName = isPhysical ? "attack" : "special-attack";
  const defStatName = isPhysical ? "defense" : "special-defense";
  
  const atkNatureMult = getNatureMultiplier(attackerNature, atkStatName);
  const defNatureMult = getNatureMultiplier(defenderNature, defStatName);

  if (atkNatureMult > 1) descriptions.push("Nature att. +10%");
  if (atkNatureMult < 1) descriptions.push("Nature att. -10%");
  if (defNatureMult > 1) descriptions.push("Nature déf. +10%");
  if (defNatureMult < 1) descriptions.push("Nature déf. -10%");

  // Item multiplier
  if (itemMultiplier > 1) {
    descriptions.push(`Objet (×${itemMultiplier})`);
  }

  // Weather boost
  if (weatherBoost) {
    descriptions.push("Météo (+50%)");
  }

  // Formule de base des dégâts Pokémon:
  // Damage = ((2 × Level / 5 + 2) × Power × A/D / 50 + 2) × Modifiers
  
  const levelFactor = (2 * attackerLevel / 5 + 2);
  const baseDamage = levelFactor * movePower * (attackerAttack / defenderDefense) / 50 + 2;
  
  // Modifiers
  let modifiers = stab * effectiveness * itemMultiplier;
  if (weatherBoost) modifiers *= 1.5;
  
  // Random factor (0.85 à 1.00)
  const minDamage = Math.floor(baseDamage * modifiers * 0.85);
  const maxDamage = Math.floor(baseDamage * modifiers * 1.00);

  return {
    minDamage,
    maxDamage,
    effectiveness,
    isCritical: false,
    description: descriptions
  };
}

export function calculateCriticalDamage(input: CalculatorInput): DamageCalculation {
  const normal = calculateDamage(input);
  
  // Coup critique = ×1.5 en général (ignorant les modifs de stats négatives)
  return {
    minDamage: Math.floor(normal.minDamage * 1.5),
    maxDamage: Math.floor(normal.maxDamage * 1.5),
    effectiveness: normal.effectiveness,
    isCritical: true,
    description: [...normal.description, "Coup Critique (×1.5)"]
  };
}

// Items populaires et leurs multiplicateurs
export const ITEMS = {
  none: { name: "Aucun", multiplier: 1 },
  "choice-band": { name: "Bandeau Choix", multiplier: 1.5 },
  "choice-specs": { name: "Lunettes Choix", multiplier: 1.5 },
  "life-orb": { name: "Orbe Vie", multiplier: 1.3 },
  "expert-belt": { name: "Ceinture Pro", multiplier: 1.2 }, // Only on super effective
  "muscle-band": { name: "Bandeau Muscle", multiplier: 1.1 },
  "wise-glasses": { name: "Lunet. Sages", multiplier: 1.1 }
};

// Natures communes
export const NATURES = [
  { name: "Hardy", increased: null, decreased: null },
  { name: "Lonely", increased: "attack", decreased: "defense" },
  { name: "Adamant", increased: "attack", decreased: "special-attack" },
  { name: "Naughty", increased: "attack", decreased: "special-defense" },
  { name: "Brave", increased: "attack", decreased: "speed" },
  { name: "Bold", increased: "defense", decreased: "attack" },
  { name: "Impish", increased: "defense", decreased: "special-attack" },
  { name: "Lax", increased: "defense", decreased: "special-defense" },
  { name: "Relaxed", increased: "defense", decreased: "speed" },
  { name: "Modest", increased: "special-attack", decreased: "attack" },
  { name: "Mild", increased: "special-attack", decreased: "defense" },
  { name: "Rash", increased: "special-attack", decreased: "special-defense" },
  { name: "Quiet", increased: "special-attack", decreased: "speed" },
  { name: "Calm", increased: "special-defense", decreased: "attack" },
  { name: "Gentle", increased: "special-defense", decreased: "defense" },
  { name: "Careful", increased: "special-defense", decreased: "special-attack" },
  { name: "Sassy", increased: "special-defense", decreased: "speed" },
  { name: "Timid", increased: "speed", decreased: "attack" },
  { name: "Hasty", increased: "speed", decreased: "defense" },
  { name: "Jolly", increased: "speed", decreased: "special-attack" },
  { name: "Naive", increased: "speed", decreased: "special-defense" }
];
