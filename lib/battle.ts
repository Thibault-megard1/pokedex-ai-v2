import type { PokemonDetail } from "@/lib/types";

// Types super efficaces (x2)
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

// Types peu efficaces (x0.5)
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

// Immunités (x0) - aucun effet
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

function stat(p: PokemonDetail, key: string) {
  return p.stats.find(s => s.name === key)?.value ?? 0;
}

/**
 * Calcule le multiplicateur de dégâts basé sur les types
 * Prend en compte : Super efficace (x2), Peu efficace (x0.5), Immunité (x0)
 */
function typeMultiplier(attackerTypes: string[], defenderTypes: string[]) {
  let mult = 1;
  
  for (const at of attackerTypes) {
    for (const dt of defenderTypes) {
      // Vérifier les immunités d'abord (priorité absolue)
      if (IMMUNE[at]?.includes(dt)) {
        return 0; // Immunité totale
      }
      
      // Super efficace (x2)
      if (SUPER[at]?.includes(dt)) {
        mult *= 2;
      }
      // Peu efficace (x0.5)
      else if (NOTVERY[at]?.includes(dt)) {
        mult *= 0.5;
      }
    }
  }
  
  return mult;
}

export type BattleTurn = { attacker: "A" | "B"; damage: number; aHp: number; bHp: number; note: string };

export type BattleResult = {
  winner: "A" | "B";
  turns: BattleTurn[];
};

/**
 * Simule un combat complet tour par tour entre deux Pokémon.
 * Retourne le vainqueur et l'historique des tours.
 */
export function fight(a: PokemonDetail, b: PokemonDetail): BattleResult {
  let aHp = stat(a, "hp");
  const aAtk = stat(a, "attack");
  const aDef = stat(a, "defense");
  const aSpA = stat(a, "special-attack");
  const aSpD = stat(a, "special-defense");
  const aSpe = stat(a, "speed");

  let bHp = stat(b, "hp");
  const bAtk = stat(b, "attack");
  const bDef = stat(b, "defense");
  const bSpA = stat(b, "special-attack");
  const bSpD = stat(b, "special-defense");
  const bSpe = stat(b, "speed");

  const turns: BattleTurn[] = [];
  let attacker: "A" | "B" = aSpe >= bSpe ? "A" : "B";

  for (let t = 1; t <= 50; t++) {
    if (aHp <= 0 || bHp <= 0) break;

    if (attacker === "A") {
      // Attaque physique et spéciale combinées (moyenne)
      const physDmg = Math.max(0, aAtk - bDef / 2);
      const specDmg = Math.max(0, aSpA - bSpD / 2);
      const baseDmg = Math.max(1, Math.round((physDmg + specDmg) / 2));
      
      const mult = typeMultiplier(a.types, b.types);
      
      if (mult === 0) {
        // Immunité : aucun dégât
        turns.push({ 
          attacker: "A", 
          damage: 0, 
          aHp: Math.max(0, aHp), 
          bHp: Math.max(0, bHp), 
          note: "Immunité!" 
        });
      } else {
        const dmg = Math.max(1, Math.round(baseDmg * mult));
        bHp -= dmg;
        
        let note = "";
        if (mult >= 2) note = "Super efficace! (x" + mult.toFixed(1) + ")";
        else if (mult <= 0.5) note = "Peu efficace... (x" + mult.toFixed(1) + ")";
        else note = `x${mult.toFixed(1)}`;
        
        turns.push({ 
          attacker: "A", 
          damage: dmg, 
          aHp: Math.max(0, aHp), 
          bHp: Math.max(0, bHp), 
          note 
        });
      }
      attacker = "B";
    } else {
      // Attaque physique et spéciale combinées (moyenne)
      const physDmg = Math.max(0, bAtk - aDef / 2);
      const specDmg = Math.max(0, bSpA - aSpD / 2);
      const baseDmg = Math.max(1, Math.round((physDmg + specDmg) / 2));
      
      const mult = typeMultiplier(b.types, a.types);
      
      if (mult === 0) {
        // Immunité : aucun dégât
        turns.push({ 
          attacker: "B", 
          damage: 0, 
          aHp: Math.max(0, aHp), 
          bHp: Math.max(0, bHp), 
          note: "Immunité!" 
        });
      } else {
        const dmg = Math.max(1, Math.round(baseDmg * mult));
        aHp -= dmg;
        
        let note = "";
        if (mult >= 2) note = "Super efficace! (x" + mult.toFixed(1) + ")";
        else if (mult <= 0.5) note = "Peu efficace... (x" + mult.toFixed(1) + ")";
        else note = `x${mult.toFixed(1)}`;
        
        turns.push({ 
          attacker: "B", 
          damage: dmg, 
          aHp: Math.max(0, aHp), 
          bHp: Math.max(0, bHp), 
          note 
        });
      }
      attacker = "A";
    }
  }

  const winner: "A" | "B" = aHp > bHp ? "A" : "B";
  return { winner, turns };
}

/**
 * Estimation de probabilité de victoire (0..1).
 * Prend en compte :
 * - Stats équilibrées (Atk, Def, SpAtk, SpDef ont même importance)
 * - Avantages de types (immunités, super efficace, peu efficace)
 * - Vitesse pour déterminer qui frappe en premier
 */
export function estimateWinChance(a: PokemonDetail, b: PokemonDetail): number {
  const aHp = stat(a, "hp");
  const aAtk = stat(a, "attack");
  const aDef = stat(a, "defense");
  const aSpA = stat(a, "special-attack");
  const aSpD = stat(a, "special-defense");
  const aSpe = stat(a, "speed");

  const bHp = stat(b, "hp");
  const bAtk = stat(b, "attack");
  const bDef = stat(b, "defense");
  const bSpA = stat(b, "special-attack");
  const bSpD = stat(b, "special-defense");
  const bSpe = stat(b, "speed");

  // Calcul équilibré : toutes les stats offensives/défensives ont la même importance
  // HP x1.2, Atk x1.0, Def x1.0, SpAtk x1.0, SpDef x1.0, Speed x0.7
  const aScore = aHp * 1.2 + aAtk * 1.0 + aDef * 1.0 + aSpA * 1.0 + aSpD * 1.0 + aSpe * 0.7;
  const bScore = bHp * 1.2 + bAtk * 1.0 + bDef * 1.0 + bSpA * 1.0 + bSpD * 1.0 + bSpe * 0.7;

  // Multiplicateurs de types (incluant immunités)
  const aTypeAdvantage = typeMultiplier(a.types, b.types);
  const bTypeAdvantage = typeMultiplier(b.types, a.types);

  // Si A a une immunité contre les attaques de B, énorme avantage
  if (bTypeAdvantage === 0) {
    return 0.95; // A gagne presque à coup sûr (B ne peut pas le toucher)
  }
  
  // Si B a une immunité contre les attaques de A, désavantage énorme
  if (aTypeAdvantage === 0) {
    return 0.05; // A perd presque à coup sûr (A ne peut pas toucher B)
  }

  // Appliquer les avantages de types au score
  const aFinalScore = aScore * aTypeAdvantage;
  const bFinalScore = bScore * bTypeAdvantage;

  // Bonus de vitesse : celui qui frappe en premier a un léger avantage
  const speedBonus = aSpe > bSpe ? 1.1 : (bSpe > aSpe ? 0.9 : 1.0);

  // Probabilité finale (normalisée entre 0 et 1)
  const totalScore = aFinalScore * speedBonus + bFinalScore;
  return Math.max(0, Math.min(1, (aFinalScore * speedBonus) / totalScore));
}
