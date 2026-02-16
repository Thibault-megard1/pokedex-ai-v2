/**
 * StatusEffectAgent
 * 
 * Agent spécialisé dans la gestion des effets de statut.
 * Utilise StatusEffectTool pour:
 * - Appliquer et gérer les statuts (poison, burn, paralysis, etc.)
 * - Conseiller sur les meilleurs statuts à infliger
 * - Prédire l'impact des statuts sur le combat
 */

import { 
  StatusEffectTool, 
  PrimaryStatus, 
  VolatileStatus, 
  StatusState,
  StatusApplicationResult,
  TurnStartEffect,
  StatusAnalysis
} from "../tools/StatusEffectTool";

export interface StatusStrategyRequest {
  targetTypes: string[];
  targetRole: "attacker" | "defender" | "sweeper" | "tank" | "support";
  targetCurrentHpPercent: number;
  targetCurrentStatus: PrimaryStatus;
}

export interface StatusStrategyResult {
  bestStatus: PrimaryStatus;
  statusValue: number;
  allStatusValues: Map<PrimaryStatus, number>;
  reasoning: string[];
  recommendedMoves: string[];
  breakdown: string[];
}

export interface StatusImpactPrediction {
  totalDamageOverTurns: number;
  turnsToKoByStatus: number;
  movementRestriction: number; // % chance de ne pas pouvoir agir
  combatEfficiency: number; // % de combat efficiency restante
  breakdown: string[];
}

export interface TurnProcessingResult {
  newState: StatusState;
  effects: TurnStartEffect;
  actionRecommendation: string;
  breakdown: string[];
}

export class StatusEffectAgent {
  private tool: StatusEffectTool;
  private name = "StatusEffectAgent";

  constructor() {
    this.tool = new StatusEffectTool();
  }

  /**
   * Applique un statut primaire de manière sécurisée
   */
  applyStatus(
    currentState: StatusState,
    status: PrimaryStatus,
    targetTypes: string[],
    targetName: string
  ): { newState: StatusState; result: StatusApplicationResult } {
    return this.tool.applyPrimaryStatus(currentState, status, targetTypes, targetName);
  }

  /**
   * Applique un statut volatile
   */
  applyVolatileStatus(
    currentState: StatusState,
    status: VolatileStatus,
    targetName: string
  ): { newState: StatusState; result: StatusApplicationResult } {
    return this.tool.applyVolatileStatus(currentState, status, targetName);
  }

  /**
   * Traite les effets de début de tour
   */
  processStatusEffects(
    state: StatusState,
    targetMaxHp: number,
    targetCurrentHp: number,
    targetName: string
  ): TurnProcessingResult {
    const { newState, effects } = this.tool.processStartOfTurn(state, targetMaxHp, targetName);
    
    const breakdown = [...effects.breakdown];
    
    // Générer une recommandation
    let actionRecommendation = "";
    
    if (effects.damage > 0) {
      const remainingHp = targetCurrentHp - effects.damage;
      if (remainingHp <= 0) {
        actionRecommendation = `⚰️ ${targetName} sera KO par les dégâts de statut!`;
      } else {
        actionRecommendation = `${targetName} perdra ${effects.damage} HP (${effects.damagePercent}%) ce tour`;
      }
    }
    
    if (!effects.canAct) {
      actionRecommendation += ` - Ne peut pas agir ce tour!`;
    }
    
    if (effects.statusCleared) {
      actionRecommendation += ` - Statut terminé!`;
    }

    breakdown.push(`\n💡 ${actionRecommendation || "Pas d'effet notable"}`);

    return {
      newState,
      effects,
      actionRecommendation,
      breakdown
    };
  }

  /**
   * Recommande le meilleur statut à infliger
   */
  recommendStatus(request: StatusStrategyRequest): StatusStrategyResult {
    const breakdown: string[] = [];
    breakdown.push(`\n☠️ ${this.name} - Stratégie de statut`);
    breakdown.push(`🎯 Cible: ${request.targetRole}, HP ${request.targetCurrentHpPercent}%`);

    const reasoning: string[] = [];
    const allStatusValues = new Map<PrimaryStatus, number>();
    
    // Vérifier si la cible peut recevoir un statut
    if (request.targetCurrentStatus !== null) {
      breakdown.push(`⚠️ La cible a déjà un statut (${request.targetCurrentStatus})`);
      return {
        bestStatus: null,
        statusValue: 0,
        allStatusValues: new Map(),
        reasoning: ["La cible a déjà un statut"],
        recommendedMoves: [],
        breakdown
      };
    }

    // Évaluer chaque statut
    const statuses: PrimaryStatus[] = ["burn", "poison", "paralysis", "sleep", "freeze"];
    
    statuses.forEach(status => {
      const evaluation = this.tool.evaluateStatusValue(
        status,
        request.targetTypes,
        request.targetRole,
        request.targetCurrentHpPercent
      );
      
      allStatusValues.set(status, evaluation.value);
      breakdown.push(...evaluation.breakdown);
    });

    // Trouver le meilleur
    let bestStatus: PrimaryStatus | null = null;
    let bestValue = 0;

    for (const [status, value] of allStatusValues) {
      if (value > bestValue) {
        bestValue = value;
        bestStatus = status;
      }
    }

    // Générer le raisonnement
    const recommendedMoves: string[] = [];
    
    if (bestStatus) {
      reasoning.push(`${bestStatus} est le statut le plus efficace (valeur: ${bestValue}/100)`);
      
      switch (bestStatus) {
        case "burn":
          reasoning.push("Brûlure: réduit ATK de 50%, idéal contre les attaquants physiques");
          recommendedMoves.push("Will-O-Wisp", "Scald", "Lava Plume");
          break;
        case "poison":
          reasoning.push("Poison: dégâts constants, efficace contre les tanks à gros HP");
          recommendedMoves.push("Toxic", "Poison Powder", "Sludge Bomb");
          break;
        case "paralysis":
          reasoning.push("Paralysie: réduit Speed de 50%, neutralise les sweepers");
          recommendedMoves.push("Thunder Wave", "Stun Spore", "Glare", "Body Slam");
          break;
        case "sleep":
          reasoning.push("Sommeil: empêche d'agir, très puissant mais temporaire");
          recommendedMoves.push("Spore", "Sleep Powder", "Hypnosis", "Yawn");
          break;
        case "freeze":
          reasoning.push("Gel: empêche d'agir, très rare et puissant");
          recommendedMoves.push("Ice Beam", "Blizzard", "Freeze-Dry");
          break;
      }
    }

    breakdown.push(`\n🏆 Meilleur statut: ${bestStatus || "Aucun"}`);
    breakdown.push(`📊 Valeur: ${bestValue}/100`);

    return {
      bestStatus,
      statusValue: bestValue,
      allStatusValues,
      reasoning,
      recommendedMoves,
      breakdown
    };
  }

  /**
   * Prédit l'impact d'un statut sur plusieurs tours
   */
  predictStatusImpact(
    status: PrimaryStatus,
    targetMaxHp: number,
    turns: number = 5
  ): StatusImpactPrediction {
    const breakdown: string[] = [];
    breakdown.push(`\n📈 Prédiction d'impact de ${status} sur ${turns} tours`);

    let totalDamage = 0;
    let movementRestriction = 0;
    let combatEfficiency = 100;

    switch (status) {
      case "burn":
        const burnDamagePerTurn = Math.floor(targetMaxHp / 16);
        totalDamage = burnDamagePerTurn * turns;
        combatEfficiency = 50; // ATK réduite de 50%
        breakdown.push(`🔥 Dégâts par tour: ${burnDamagePerTurn} (1/16 HP)`);
        breakdown.push(`⚔️ ATK réduite de 50%`);
        break;

      case "poison":
        const poisonDamagePerTurn = Math.floor(targetMaxHp / 8);
        totalDamage = poisonDamagePerTurn * turns;
        breakdown.push(`☠️ Dégâts par tour: ${poisonDamagePerTurn} (1/8 HP)`);
        break;

      case "paralysis":
        movementRestriction = 25;
        combatEfficiency = 75; // Speed réduite
        breakdown.push(`⚡ 25% chance de ne pas agir chaque tour`);
        breakdown.push(`🏃 Speed réduite de 50%`);
        break;

      case "sleep":
        // En moyenne 3 tours de sommeil
        movementRestriction = Math.min(100, (3 / turns) * 100);
        combatEfficiency = 0;
        breakdown.push(`😴 Endormi ~3 tours en moyenne`);
        breakdown.push(`❌ Impossible d'agir pendant le sommeil`);
        break;

      case "freeze":
        // En moyenne 5 tours gelé (10% dégel)
        movementRestriction = 90;
        combatEfficiency = 0;
        breakdown.push(`❄️ Gelé ~5 tours en moyenne (10% dégel/tour)`);
        breakdown.push(`❌ Impossible d'agir pendant le gel`);
        break;
    }

    const turnsToKoByStatus = totalDamage > 0 ? Math.ceil(targetMaxHp / (totalDamage / turns)) : Infinity;

    breakdown.push(`\n📊 Résumé sur ${turns} tours:`);
    breakdown.push(`   Dégâts totaux: ${totalDamage}`);
    breakdown.push(`   Tours pour KO: ${turnsToKoByStatus === Infinity ? "∞" : turnsToKoByStatus}`);
    breakdown.push(`   Restriction mouvement: ${movementRestriction}%`);
    breakdown.push(`   Efficacité combat: ${combatEfficiency}%`);

    return {
      totalDamageOverTurns: totalDamage,
      turnsToKoByStatus,
      movementRestriction,
      combatEfficiency,
      breakdown
    };
  }

  /**
   * Analyse complète du statut d'un Pokémon
   */
  analyzeTargetStatus(
    state: StatusState,
    targetTypes: string[],
    targetName: string
  ): StatusAnalysis {
    return this.tool.analyzeStatus(state, targetTypes, targetName);
  }

  /**
   * Guérit un statut
   */
  cureStatus(
    state: StatusState,
    targetName: string
  ): { newState: StatusState; breakdown: string[] } {
    return this.tool.cureStatus(state, targetName);
  }

  /**
   * Évalue si infliger un statut vaut mieux qu'attaquer
   */
  statusVsAttackDecision(
    statusValue: number,
    attackKoChance: number,
    canSurviveNextTurn: boolean
  ): {
    recommendation: "status" | "attack";
    reasoning: string[];
    confidence: number;
  } {
    const reasoning: string[] = [];
    let statusScore = statusValue;
    let attackScore = attackKoChance;

    // Si on peut KO, c'est généralement mieux
    if (attackKoChance >= 80) {
      attackScore += 30;
      reasoning.push("Forte chance de KO - attaque préférable");
    }

    // Si on risque de mourir, le statut est moins utile
    if (!canSurviveNextTurn) {
      statusScore -= 20;
      reasoning.push("Risque de KO adverse - mieux vaut attaquer");
    }

    // Ajuster selon la valeur du statut
    if (statusValue >= 70) {
      statusScore += 15;
      reasoning.push("Statut très efficace contre cette cible");
    } else if (statusValue < 30) {
      statusScore -= 20;
      reasoning.push("Statut peu efficace");
    }

    const recommendation = statusScore > attackScore ? "status" : "attack";
    const confidence = Math.abs(statusScore - attackScore) > 30 ? 85 : 60;

    reasoning.push(`Score statut: ${Math.round(statusScore)}, Score attaque: ${Math.round(attackScore)}`);

    return {
      recommendation,
      reasoning,
      confidence
    };
  }
}
