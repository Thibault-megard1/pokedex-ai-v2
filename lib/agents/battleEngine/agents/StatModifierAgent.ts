/**
 * StatModifierAgent
 * 
 * Agent spécialisé dans la gestion des modifications de stats.
 * Utilise StatModifierTool pour:
 * - Appliquer et suivre les boosts/debuffs
 * - Conseiller sur les stratégies de setup
 * - Analyser l'état des stats d'un Pokémon
 */

import { 
  StatModifierTool, 
  StatStages, 
  BaseStats,
  StatModificationResult,
  MultiStatModificationResult,
  StatAnalysis
} from "../tools/StatModifierTool";

export interface StatModificationRequest {
  currentStages: StatStages;
  modification: "boost" | "debuff" | "reset";
  stats: Array<{ stat: keyof StatStages; amount: number }>;
}

export interface StatAnalysisRequest {
  baseStats: BaseStats;
  currentStages: StatStages;
  role?: "attacker" | "defender" | "sweeper" | "tank" | "support";
}

export interface SetupRecommendation {
  shouldSetup: boolean;
  priority: number; // 0-100
  recommendedBoosts: Array<{
    stat: keyof StatStages;
    reason: string;
    potentialGain: number;
  }>;
  setupMoves: string[];
  reasoning: string[];
  breakdown: string[];
}

export interface StatStateAnalysis {
  overallPower: number; // Score de puissance 0-100
  isSetup: boolean; // A déjà des boosts significatifs
  isDebuffed: boolean; // A des malus significatifs
  bestStat: { stat: keyof StatStages; value: number; stage: number };
  worstStat: { stat: keyof StatStages; value: number; stage: number };
  totalBoostStages: number;
  totalDebuffStages: number;
  breakdown: string[];
}

export class StatModifierAgent {
  private tool: StatModifierTool;
  private name = "StatModifierAgent";

  constructor() {
    this.tool = new StatModifierTool();
  }

  /**
   * Applique une modification de stats
   */
  applyModification(request: StatModificationRequest): {
    newStages: StatStages;
    results: MultiStatModificationResult;
  } {
    if (request.modification === "reset") {
      const { newStages, breakdown } = this.tool.resetStats(
        request.currentStages,
        request.stats.map(s => s.stat)
      );
      return {
        newStages,
        results: {
          modifications: [],
          summary: "Stats réinitialisées",
          breakdown
        }
      };
    }

    // Boost ou debuff
    const modifications = request.stats.map(s => ({
      stat: s.stat,
      change: request.modification === "boost" ? s.amount : -s.amount
    }));

    return this.tool.modifyMultipleStats(request.currentStages, modifications);
  }

  /**
   * Analyse l'état actuel des stats
   */
  analyzeStatState(request: StatAnalysisRequest): StatStateAnalysis {
    const breakdown: string[] = [];
    breakdown.push(`\n📊 ${this.name} - Analyse des stats`);

    const { analyses, breakdown: statBreakdown } = this.tool.analyzeAllStats(
      request.baseStats,
      request.currentStages
    );

    breakdown.push(...statBreakdown);

    // Calculer les totaux
    let totalBoostStages = 0;
    let totalDebuffStages = 0;
    let bestStat: { stat: keyof StatStages; value: number; stage: number } | null = null;
    let worstStat: { stat: keyof StatStages; value: number; stage: number } | null = null;

    const combatStats: (keyof StatStages)[] = ["attack", "defense", "specialAttack", "specialDefense", "speed"];
    
    for (const statKey of combatStats) {
      const stage = request.currentStages[statKey];
      if (stage > 0) totalBoostStages += stage;
      if (stage < 0) totalDebuffStages += Math.abs(stage);

      const analysis = analyses.get(statKey);
      if (analysis) {
        if (!bestStat || analysis.effectiveValue > bestStat.value) {
          bestStat = { stat: statKey, value: analysis.effectiveValue, stage: analysis.currentStage };
        }
        if (!worstStat || analysis.effectiveValue < worstStat.value) {
          worstStat = { stat: statKey, value: analysis.effectiveValue, stage: analysis.currentStage };
        }
      }
    }

    // Calculer un score de puissance global
    const baseStatTotal = request.baseStats.attack + request.baseStats.defense + 
                          request.baseStats.specialAttack + request.baseStats.specialDefense + 
                          request.baseStats.speed;
    
    // Score basé sur les boost stages (chaque stage = ~16% de boost)
    const boostBonus = totalBoostStages * 8;
    const debuffMalus = totalDebuffStages * 8;
    const baseScore = Math.min(100, (baseStatTotal / 600) * 100);
    const overallPower = Math.max(0, Math.min(100, baseScore + boostBonus - debuffMalus));

    const isSetup = totalBoostStages >= 2;
    const isDebuffed = totalDebuffStages >= 2;

    breakdown.push(`\n📈 Résumé:`);
    breakdown.push(`   Score de puissance: ${Math.round(overallPower)}/100`);
    breakdown.push(`   Total boosts: +${totalBoostStages} stages`);
    breakdown.push(`   Total debuffs: -${totalDebuffStages} stages`);
    if (bestStat) {
      const best = bestStat as { stat: keyof StatStages; value: number; stage: number };
      breakdown.push(`   Meilleure stat: ${best.stat} (${best.value})`);
    }
    if (worstStat) {
      const worst = worstStat as { stat: keyof StatStages; value: number; stage: number };
      breakdown.push(`   Pire stat: ${worst.stat} (${worst.value})`);
    }

    return {
      overallPower,
      isSetup,
      isDebuffed,
      bestStat: bestStat!,
      worstStat: worstStat!,
      totalBoostStages,
      totalDebuffStages,
      breakdown
    };
  }

  /**
   * Recommande une stratégie de setup
   */
  recommendSetup(
    request: StatAnalysisRequest,
    canSurviveTurn: boolean,
    opponentThreatLevel: "low" | "medium" | "high"
  ): SetupRecommendation {
    const breakdown: string[] = [];
    breakdown.push(`\n💪 ${this.name} - Recommandation de setup`);

    const role = request.role || "attacker";
    const { recommendations, breakdown: recBreakdown } = this.tool.recommendBoosts(
      request.baseStats,
      request.currentStages,
      role
    );

    breakdown.push(...recBreakdown);

    // Évaluer si le setup vaut le coup
    const reasoning: string[] = [];
    let priority = 50;
    let shouldSetup = false;

    // Facteur 1: Peut-on survivre un tour?
    if (!canSurviveTurn) {
      priority -= 40;
      reasoning.push("❌ Risque de KO si on setup");
    } else {
      reasoning.push("✅ Peut survivre un tour");
    }

    // Facteur 2: Niveau de menace
    switch (opponentThreatLevel) {
      case "low":
        priority += 20;
        reasoning.push("🟢 Faible menace - bon moment pour setup");
        break;
      case "medium":
        // Neutre
        reasoning.push("🟡 Menace moyenne");
        break;
      case "high":
        priority -= 20;
        reasoning.push("🔴 Haute menace - setup risqué");
        break;
    }

    // Facteur 3: Stats déjà boostées?
    const currentBoosts = Object.values(request.currentStages).filter(v => v > 0).length;
    if (currentBoosts >= 2) {
      priority -= 10;
      reasoning.push("⚠️ Déjà plusieurs boosts actifs");
    }

    // Facteur 4: Potentiel de gain
    const bestRec = recommendations[0];
    if (bestRec) {
      const impact = this.tool.calculateBoostImpact(
        (request.baseStats as any)[bestRec.stat] || 100,
        request.currentStages[bestRec.stat],
        2,
        bestRec.stat
      );
      
      if (impact.percentIncrease > 50) {
        priority += 15;
        reasoning.push(`📈 Gain potentiel important: +${impact.percentIncrease}% ${bestRec.stat}`);
      }
    }

    shouldSetup = priority > 50 && canSurviveTurn;

    // Mapper les recommandations
    const recommendedBoosts = recommendations.slice(0, 3).map(rec => {
      const impact = this.tool.calculateBoostImpact(
        (request.baseStats as any)[rec.stat] || 100,
        request.currentStages[rec.stat],
        2,
        rec.stat
      );
      return {
        stat: rec.stat,
        reason: rec.reason,
        potentialGain: impact.percentIncrease
      };
    });

    // Suggérer des moves de setup
    const setupMoves: string[] = [];
    if (recommendedBoosts.some(b => b.stat === "attack")) {
      setupMoves.push("Swords Dance", "Dragon Dance", "Howl");
    }
    if (recommendedBoosts.some(b => b.stat === "specialAttack")) {
      setupMoves.push("Nasty Plot", "Calm Mind", "Quiver Dance");
    }
    if (recommendedBoosts.some(b => b.stat === "speed")) {
      setupMoves.push("Agility", "Dragon Dance", "Rock Polish");
    }
    if (recommendedBoosts.some(b => ["defense", "specialDefense"].includes(b.stat))) {
      setupMoves.push("Bulk Up", "Calm Mind", "Iron Defense", "Amnesia");
    }

    breakdown.push(`\n💡 Décision: ${shouldSetup ? "Setup recommandé" : "Setup non recommandé"}`);
    breakdown.push(`📊 Priorité: ${Math.round(priority)}/100`);

    return {
      shouldSetup,
      priority: Math.round(priority),
      recommendedBoosts,
      setupMoves: [...new Set(setupMoves)],
      reasoning,
      breakdown
    };
  }

  /**
   * Évalue l'impact d'une modification de stats adverse (debuff)
   */
  evaluateDebuffStrategy(
    opponentStats: BaseStats,
    opponentStages: StatStages,
    opponentRole: "attacker" | "defender" | "sweeper" | "tank" | "support"
  ): {
    bestDebuffTarget: keyof StatStages;
    reasoning: string[];
    impactScore: number;
    recommendedMoves: string[];
    breakdown: string[];
  } {
    const breakdown: string[] = [];
    breakdown.push(`\n🎯 Analyse de stratégie de debuff`);

    const statPriority: Record<string, (keyof StatStages)[]> = {
      attacker: ["attack", "speed"],
      defender: ["defense", "specialDefense"],
      sweeper: ["speed", "attack", "specialAttack"],
      tank: ["defense", "specialDefense"],
      support: ["speed", "specialDefense"]
    };

    const targets = statPriority[opponentRole] || ["attack", "speed"];
    const reasoning: string[] = [];
    
    let bestTarget: keyof StatStages = targets[0];
    let bestImpact = 0;

    targets.forEach(stat => {
      const currentStage = opponentStages[stat];
      if (currentStage > -6) {
        const baseStat = (opponentStats as any)[stat] || 100;
        const impact = this.tool.calculateBoostImpact(baseStat, currentStage, -1, stat);
        
        // Impact négatif = bon pour nous
        const positiveImpact = Math.abs(impact.percentIncrease);
        
        if (positiveImpact > bestImpact) {
          bestImpact = positiveImpact;
          bestTarget = stat;
        }

        breakdown.push(`   ${stat}: -${Math.round(positiveImpact)}% si debuff`);
      }
    });

    reasoning.push(`Cibler ${bestTarget} réduirait la menace de ${Math.round(bestImpact)}%`);
    reasoning.push(`L'adversaire est un ${opponentRole}, vulnérable aux debuffs de ${targets.join(", ")}`);

    // Recommander des moves de debuff
    const recommendedMoves: string[] = [];
    switch (bestTarget) {
      case "attack":
        recommendedMoves.push("Intimidate", "Charm", "Growl");
        break;
      case "defense":
        recommendedMoves.push("Screech", "Leer", "Tail Whip");
        break;
      case "specialAttack":
        recommendedMoves.push("Confide", "Noble Roar");
        break;
      case "specialDefense":
        recommendedMoves.push("Fake Tears", "Metal Sound");
        break;
      case "speed":
        recommendedMoves.push("Scary Face", "Cotton Spore", "Icy Wind");
        break;
    }

    breakdown.push(`\n🎯 Meilleure cible: ${bestTarget}`);
    breakdown.push(`📉 Impact potentiel: -${Math.round(bestImpact)}%`);

    return {
      bestDebuffTarget: bestTarget,
      reasoning,
      impactScore: Math.round(bestImpact),
      recommendedMoves,
      breakdown
    };
  }
}
