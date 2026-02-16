/**
 * Damage Calculator Tool
 * 
 * Calcule précisément les dégâts selon la formule officielle Pokémon Gen V+
 * 
 * Formule: ((((2 * Level / 5 + 2) * Power * A/D) / 50) + 2) * Modifiers
 * 
 * Modifiers:
 * - Type effectiveness (0, 0.25, 0.5, 1, 2, 4)
 * - STAB (Same Type Attack Bonus): 1.5x
 * - Critical hit: 1.5x (base 6.25% chance)
 * - Random factor: 0.85 to 1.0
 * - Status conditions (burn = 0.5x physical)
 */

import { calculateDefensiveMultiplier } from "@/lib/typeRelations";

export interface BattlePokemonForDamage {
  name: string;
  types: string[];
  level: number;
  currentStats: {
    attack: number;
    defense: number;
    specialAttack: number;
    specialDefense: number;
  };
  statStages: {
    attack: number;
    defense: number;
    specialAttack: number;
    specialDefense: number;
  };
  statusCondition: "burn" | "poison" | "paralysis" | "sleep" | "freeze" | null;
}

export interface MoveForDamage {
  name: string;
  type: string;
  power: number;
  damageClass: "physical" | "special" | "status";
  accuracy: number;
}

export interface DamageCalculationResult {
  // Résultats
  damage: number;
  minDamage: number;
  maxDamage: number;
  
  // Détails
  baseDamage: number;
  effectiveness: number;
  effectivenessLabel: string;
  stabBonus: boolean;
  isCritical: boolean;
  burnPenalty: boolean;
  
  // Analyse
  koChance: number; // % de chance de KO en un coup (basé sur HP restant)
  damagePercent: number; // % de HP infligé
  turnsToKo: number; // Nombre de tours estimé pour KO
  
  // Logs pour debug/affichage
  breakdown: string[];
}

export class DamageCalculatorTool {
  /**
   * Applique le multiplicateur de stat stage (-6 à +6)
   */
  private applyStatStage(baseStat: number, stage: number): number {
    const multipliers: Record<string, number> = {
      "-6": 2/8, "-5": 2/7, "-4": 2/6, "-3": 2/5, "-2": 2/4, "-1": 2/3,
      "0": 1,
      "1": 3/2, "2": 4/2, "3": 5/2, "4": 6/2, "5": 7/2, "6": 8/2
    };
    return Math.floor(baseStat * (multipliers[stage.toString()] || 1));
  }

  /**
   * Calcule l'efficacité de type
   */
  private getTypeEffectiveness(moveType: string, defenderTypes: string[]): number {
    return calculateDefensiveMultiplier(moveType, defenderTypes);
  }

  /**
   * Vérifie le STAB (Same Type Attack Bonus)
   */
  private hasStab(attackerTypes: string[], moveType: string): boolean {
    return attackerTypes.includes(moveType);
  }

  /**
   * Calcule si c'est un coup critique (6.25% de base)
   * @param critStage - Modificateur de crit (0 = base, 1 = focus energy, etc.)
   */
  private rollCritical(critStage: number = 0): boolean {
    const critChances = [1/24, 1/8, 1/2, 1]; // Stages 0, 1, 2, 3+
    const chance = critChances[Math.min(critStage, 3)];
    return Math.random() < chance;
  }

  /**
   * Génère le facteur aléatoire (0.85 à 1.0)
   */
  private getRandomFactor(): number {
    return 0.85 + Math.random() * 0.15;
  }

  /**
   * Calcule les dégâts complets
   */
  calculateDamage(
    attacker: BattlePokemonForDamage,
    defender: BattlePokemonForDamage,
    move: MoveForDamage,
    defenderCurrentHp: number,
    defenderMaxHp: number,
    options: {
      randomRoll?: boolean; // Si false, utilise moyenne
      forceCrit?: boolean;
      critStage?: number;
    } = {}
  ): DamageCalculationResult {
    const breakdown: string[] = [];

    // Moves de statut ne font pas de dégâts
    if (move.damageClass === "status" || move.power === 0) {
      return {
        damage: 0,
        minDamage: 0,
        maxDamage: 0,
        baseDamage: 0,
        effectiveness: 1,
        effectivenessLabel: "N/A",
        stabBonus: false,
        isCritical: false,
        burnPenalty: false,
        koChance: 0,
        damagePercent: 0,
        turnsToKo: Infinity,
        breakdown: ["Move de statut - pas de dégâts directs"]
      };
    }

    // Déterminer Attack et Defense
    const isPhysical = move.damageClass === "physical";
    const rawAttack = isPhysical ? attacker.currentStats.attack : attacker.currentStats.specialAttack;
    const rawDefense = isPhysical ? defender.currentStats.defense : defender.currentStats.specialDefense;
    
    const attackStage = isPhysical ? attacker.statStages.attack : attacker.statStages.specialAttack;
    const defenseStage = isPhysical ? defender.statStages.defense : defender.statStages.specialDefense;

    const attack = this.applyStatStage(rawAttack, attackStage);
    const defense = this.applyStatStage(rawDefense, defenseStage);

    breakdown.push(`📊 ${isPhysical ? "ATK" : "SP.ATK"}: ${rawAttack} (stage ${attackStage >= 0 ? "+" : ""}${attackStage}) → ${attack}`);
    breakdown.push(`🛡️ ${isPhysical ? "DEF" : "SP.DEF"}: ${rawDefense} (stage ${defenseStage >= 0 ? "+" : ""}${defenseStage}) → ${defense}`);

    // Formule de base
    const level = attacker.level;
    const power = move.power;
    const baseDamage = Math.floor(((2 * level / 5 + 2) * power * attack / defense) / 50 + 2);
    breakdown.push(`⚔️ Dégâts de base: ${baseDamage}`);

    // === MODIFICATEURS ===
    let modifier = 1;

    // 1. Type Effectiveness
    const effectiveness = this.getTypeEffectiveness(move.type, defender.types);
    modifier *= effectiveness;
    
    let effectivenessLabel = "Neutre";
    if (effectiveness === 0) effectivenessLabel = "Immunité";
    else if (effectiveness <= 0.25) effectivenessLabel = "Très peu efficace (x0.25)";
    else if (effectiveness <= 0.5) effectivenessLabel = "Peu efficace (x0.5)";
    else if (effectiveness >= 4) effectivenessLabel = "Ultra efficace (x4!)";
    else if (effectiveness >= 2) effectivenessLabel = "Super efficace (x2)";
    
    breakdown.push(`🎯 Efficacité: ${effectiveness}x (${effectivenessLabel})`);

    // 2. STAB (Same Type Attack Bonus)
    const stabBonus = this.hasStab(attacker.types, move.type);
    if (stabBonus) {
      modifier *= 1.5;
      breakdown.push(`✨ STAB: x1.5`);
    }

    // 3. Burn penalty (physical moves)
    const burnPenalty = isPhysical && attacker.statusCondition === "burn";
    if (burnPenalty) {
      modifier *= 0.5;
      breakdown.push(`🔥 Brûlure: x0.5 (attaque physique)`);
    }

    // 4. Critical Hit
    const critStage = options.critStage || 0;
    const isCritical = options.forceCrit ?? this.rollCritical(critStage);
    if (isCritical) {
      modifier *= 1.5;
      breakdown.push(`💥 Coup critique: x1.5!`);
    }

    // Calculer les dégâts finaux (min, max, actual)
    const minDamage = Math.floor(baseDamage * modifier * 0.85);
    const maxDamage = Math.floor(baseDamage * modifier);
    
    const randomFactor = options.randomRoll !== false ? this.getRandomFactor() : 0.925;
    const damage = Math.max(1, Math.floor(baseDamage * modifier * randomFactor));

    breakdown.push(`📈 Dégâts finaux: ${damage} (${minDamage}-${maxDamage})`);

    // === ANALYSE ===
    const damagePercent = (damage / defenderMaxHp) * 100;
    
    // Calcul KO chance (estimation basée sur les dégâts max possibles)
    let koChance = 0;
    if (maxDamage >= defenderCurrentHp) {
      // On peut potentiellement KO
      if (minDamage >= defenderCurrentHp) {
        koChance = 100; // Guaranteed KO
      } else {
        // Probabilité basée sur la distribution
        const koThreshold = defenderCurrentHp;
        const range = maxDamage - minDamage;
        if (range > 0) {
          koChance = ((maxDamage - koThreshold) / range) * 100;
        }
      }
    }

    const turnsToKo = Math.ceil(defenderCurrentHp / damage);
    breakdown.push(`💀 KO en ~${turnsToKo} tour(s) | Chance KO: ${Math.round(koChance)}%`);

    return {
      damage,
      minDamage,
      maxDamage,
      baseDamage,
      effectiveness,
      effectivenessLabel,
      stabBonus,
      isCritical,
      burnPenalty,
      koChance,
      damagePercent: Math.round(damagePercent * 10) / 10,
      turnsToKo,
      breakdown
    };
  }

  /**
   * Calcule les dégâts de tous les moves d'un attaquant contre un défenseur
   */
  evaluateAllMoves(
    attacker: BattlePokemonForDamage,
    defender: BattlePokemonForDamage,
    moves: MoveForDamage[],
    defenderCurrentHp: number,
    defenderMaxHp: number
  ): Map<string, DamageCalculationResult> {
    const results = new Map<string, DamageCalculationResult>();

    moves.forEach(move => {
      const result = this.calculateDamage(
        attacker, 
        defender, 
        move, 
        defenderCurrentHp, 
        defenderMaxHp,
        { randomRoll: false } // Utiliser moyenne pour comparaison
      );
      results.set(move.name, result);
    });

    return results;
  }

  /**
   * Trouve le move qui fait le plus de dégâts
   */
  findBestDamagingMove(
    attacker: BattlePokemonForDamage,
    defender: BattlePokemonForDamage,
    moves: MoveForDamage[],
    defenderCurrentHp: number,
    defenderMaxHp: number
  ): { move: MoveForDamage; result: DamageCalculationResult } | null {
    const results = this.evaluateAllMoves(attacker, defender, moves, defenderCurrentHp, defenderMaxHp);
    
    let bestMove: MoveForDamage | null = null;
    let bestResult: DamageCalculationResult | null = null;
    let bestScore = -1;

    moves.forEach(move => {
      const result = results.get(move.name);
      if (!result) return;

      // Score = dégâts × précision
      const score = result.damage * (move.accuracy / 100);
      
      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
        bestResult = result;
      }
    });

    return bestMove && bestResult ? { move: bestMove, result: bestResult } : null;
  }
}
