import type { PokemonDetail } from "@/lib/types";

const SUPER: Record<string, string[]> = {
  fire: ["grass", "ice", "bug", "steel"],
  water: ["fire", "ground", "rock"],
  grass: ["water", "ground", "rock"],
  electric: ["water", "flying"],
  ice: ["grass", "ground", "flying", "dragon"],
  fighting: ["normal", "ice", "rock", "dark", "steel"],
  ground: ["fire", "electric", "poison", "rock", "steel"],
  psychic: ["fighting", "poison"],
  rock: ["fire", "ice", "flying", "bug"]
};

const NOTVERY: Record<string, string[]> = {
  fire: ["water", "rock", "fire", "dragon"],
  water: ["grass", "water", "dragon"],
  grass: ["fire", "grass", "poison", "flying", "bug", "dragon", "steel"],
  electric: ["grass", "electric", "dragon"],
  ice: ["fire", "water", "ice", "steel"],
  fighting: ["psychic", "fairy"],
  ground: ["grass", "bug"],
  psychic: ["psychic", "steel"],
  rock: ["fighting", "ground", "steel"]
};

function stat(p: PokemonDetail, key: string) {
  return p.stats.find(s => s.name === key)?.value ?? 0;
}

function typeMultiplier(attackerTypes: string[], defenderTypes: string[]) {
  let mult = 1;
  for (const at of attackerTypes) {
    for (const dt of defenderTypes) {
      if (SUPER[at]?.includes(dt)) mult *= 1.5;
      if (NOTVERY[at]?.includes(dt)) mult *= 0.75;
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
 * Estimation de probabilité de victoire (0..1).
 * Heuristique: score stats + avantage types, puis logistic.
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

  const aScore = aHp * 1.0 + aAtk * 1.2 + aDef * 1.0 + aSpA * 1.1 + aSpD * 1.0 + aSpe * 0.6;
  const bScore = bHp * 1.0 + bAtk * 1.2 + bDef * 1.0 + bSpA * 1.1 + bSpD * 1.0 + bSpe * 0.6;

  const aType = typeMultiplier(a.types, b.types);
  const bType = typeMultiplier(b.types, a.types);

  const typeEdge = Math.log((aType + 0.01) / (bType + 0.01));
  const diff = (aScore - bScore) / 120.0;

  const x = diff + typeEdge * 0.8;
  const p = 1 / (1 + Math.exp(-x));

  return Math.min(0.98, Math.max(0.02, p));
}

export function fight(a: PokemonDetail, b: PokemonDetail): BattleResult {
  let aHp = stat(a, "hp");
  let bHp = stat(b, "hp");

  const aAtk = stat(a, "attack");
  const aDef = stat(a, "defense");
  const aSpe = stat(a, "speed");

  const bAtk = stat(b, "attack");
  const bDef = stat(b, "defense");
  const bSpe = stat(b, "speed");

  const turns: BattleTurn[] = [];
  let attacker: "A" | "B" = aSpe >= bSpe ? "A" : "B";

  for (let t = 1; t <= 20; t++) {
    if (aHp <= 0 || bHp <= 0) break;

    if (attacker === "A") {
      const base = Math.max(1, Math.round(aAtk - bDef / 2));
      const mult = typeMultiplier(a.types, b.types);
      const dmg = Math.max(1, Math.round(base * mult));
      bHp -= dmg;
      turns.push({ attacker: "A", damage: dmg, aHp: Math.max(0, aHp), bHp: Math.max(0, bHp), note: `x${mult.toFixed(2)}` });
      attacker = "B";
    } else {
      const base = Math.max(1, Math.round(bAtk - aDef / 2));
      const mult = typeMultiplier(b.types, a.types);
      const dmg = Math.max(1, Math.round(base * mult));
      aHp -= dmg;
      turns.push({ attacker: "B", damage: dmg, aHp: Math.max(0, aHp), bHp: Math.max(0, bHp), note: `x${mult.toFixed(2)}` });
      attacker = "A";
    }
  }

  const winner: "A" | "B" = aHp >= bHp ? "A" : "B";
  return { winner, turns };
}
