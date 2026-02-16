/**
 * Stat Modifier Tool
 * 
 * Gère les modifications de stats en combat:
 * - Boost/Debuff (+6 à -6 stages)
 * - Reset des stats
 * - Calcul des stats effectives
 * - Prédiction de l'impact des boosts
 */

export interface StatStages {
  attack: number;
  defense: number;
  specialAttack: number;
  specialDefense: number;
  speed: number;
  accuracy: number;
  evasion: number;
}

export interface BaseStats {
  hp: number;
  attack: number;
  defense: number;
  specialAttack: number;
  specialDefense: number;
  speed: number;
}

export interface StatModificationResult {
  success: boolean;
  stat: keyof StatStages;
  previousStage: number;
  newStage: number;
  actualChange: number;
  message: string;
  isMaxed: boolean;
  isBottomed: boolean;
}

export interface MultiStatModificationResult {
  modifications: StatModificationResult[];
  summary: string;
  breakdown: string[];
}

export interface StatAnalysis {
  stat: keyof StatStages;
  baseStat: number;
  currentStage: number;
  effectiveValue: number;
  maxPossibleValue: number; // Avec +6
  minPossibleValue: number; // Avec -6
  stagesUntilMax: number;
  stagesUntilMin: number;
}

// Multiplicateurs pour stages -6 à +6
const STAGE_MULTIPLIERS: Record<number, number> = {
  [-6]: 2/8,
  [-5]: 2/7,
  [-4]: 2/6,
  [-3]: 2/5,
  [-2]: 2/4,
  [-1]: 2/3,
  [0]: 1,
  [1]: 3/2,
  [2]: 4/2,
  [3]: 5/2,
  [4]: 6/2,
  [5]: 7/2,
  [6]: 8/2
};

// Multiplicateurs pour accuracy/evasion (différents)
const ACC_EVA_MULTIPLIERS: Record<number, number> = {
  [-6]: 3/9,
  [-5]: 3/8,
  [-4]: 3/7,
  [-3]: 3/6,
  [-2]: 3/5,
  [-1]: 3/4,
  [0]: 1,
  [1]: 4/3,
  [2]: 5/3,
  [3]: 6/3,
  [4]: 7/3,
  [5]: 8/3,
  [6]: 9/3
};

export class StatModifierTool {
  /**
   * Crée un objet StatStages avec toutes les stats à 0
   */
  createDefaultStatStages(): StatStages {
    return {
      attack: 0,
      defense: 0,
      specialAttack: 0,
      specialDefense: 0,
      speed: 0,
      accuracy: 0,
      evasion: 0
    };
  }

  /**
   * Applique une modification de stat
   */
  modifyStat(
    currentStages: StatStages,
    stat: keyof StatStages,
    change: number
  ): { newStages: StatStages; result: StatModificationResult } {
    const previousStage = currentStages[stat];
    let newStage = previousStage + change;
    
    // Clamper entre -6 et +6
    newStage = Math.max(-6, Math.min(6, newStage));
    
    const actualChange = newStage - previousStage;
    const isMaxed = newStage === 6;
    const isBottomed = newStage === -6;
    
    let message: string;
    if (actualChange === 0) {
      message = change > 0 
        ? `${stat} ne peut pas monter plus haut !` 
        : `${stat} ne peut pas descendre plus bas !`;
    } else if (Math.abs(actualChange) !== Math.abs(change)) {
      message = `${stat} ${actualChange > 0 ? "monte" : "descend"} de ${Math.abs(actualChange)} (limité)`;
    } else {
      const verb = actualChange > 0 ? "monte" : "descend";
      const intensity = Math.abs(actualChange) === 1 ? "" 
        : Math.abs(actualChange) === 2 ? " fortement" 
        : " drastiquement";
      message = `${stat} ${verb}${intensity} !`;
    }

    const newStages = { ...currentStages, [stat]: newStage };
    
    return {
      newStages,
      result: {
        success: actualChange !== 0,
        stat,
        previousStage,
        newStage,
        actualChange,
        message,
        isMaxed,
        isBottomed
      }
    };
  }

  /**
   * Applique plusieurs modifications de stats à la fois
   */
  modifyMultipleStats(
    currentStages: StatStages,
    modifications: Array<{ stat: keyof StatStages; change: number }>
  ): { newStages: StatStages; results: MultiStatModificationResult } {
    let stages = { ...currentStages };
    const allResults: StatModificationResult[] = [];
    const breakdown: string[] = [];

    modifications.forEach(({ stat, change }) => {
      const { newStages, result } = this.modifyStat(stages, stat, change);
      stages = newStages;
      allResults.push(result);
      
      const arrow = change > 0 ? "↑" : "↓";
      const emoji = result.success ? (change > 0 ? "📈" : "📉") : "⚠️";
      breakdown.push(`${emoji} ${stat}: ${result.previousStage} ${arrow} ${result.newStage} (${result.message})`);
    });

    const successCount = allResults.filter(r => r.success).length;
    const summary = `${successCount}/${modifications.length} modifications appliquées`;

    return {
      newStages: stages,
      results: {
        modifications: allResults,
        summary,
        breakdown
      }
    };
  }

  /**
   * Reset toutes les stats à 0 (ou seulement certaines)
   */
  resetStats(
    currentStages: StatStages,
    statsToReset?: (keyof StatStages)[]
  ): { newStages: StatStages; breakdown: string[] } {
    const breakdown: string[] = [];
    const newStages = { ...currentStages };
    const stats = statsToReset || (Object.keys(currentStages) as (keyof StatStages)[]);

    stats.forEach(stat => {
      const old = currentStages[stat];
      if (old !== 0) {
        breakdown.push(`🔄 ${stat}: ${old} → 0`);
        newStages[stat] = 0;
      }
    });

    if (breakdown.length === 0) {
      breakdown.push("Aucune stat à réinitialiser");
    }

    return { newStages, breakdown };
  }

  /**
   * Calcule la valeur effective d'une stat
   */
  calculateEffectiveStat(
    baseStat: number,
    stage: number,
    isAccuracyOrEvasion: boolean = false
  ): number {
    const multipliers = isAccuracyOrEvasion ? ACC_EVA_MULTIPLIERS : STAGE_MULTIPLIERS;
    const multiplier = multipliers[Math.max(-6, Math.min(6, stage))] || 1;
    return Math.floor(baseStat * multiplier);
  }

  /**
   * Analyse complète d'une stat
   */
  analyzeStat(
    baseStat: number,
    currentStage: number,
    stat: keyof StatStages
  ): StatAnalysis {
    const isAccEva = stat === "accuracy" || stat === "evasion";
    
    return {
      stat,
      baseStat,
      currentStage,
      effectiveValue: this.calculateEffectiveStat(baseStat, currentStage, isAccEva),
      maxPossibleValue: this.calculateEffectiveStat(baseStat, 6, isAccEva),
      minPossibleValue: this.calculateEffectiveStat(baseStat, -6, isAccEva),
      stagesUntilMax: 6 - currentStage,
      stagesUntilMin: currentStage + 6
    };
  }

  /**
   * Analyse toutes les stats d'un Pokémon
   */
  analyzeAllStats(
    baseStats: BaseStats,
    currentStages: StatStages
  ): { analyses: Map<string, StatAnalysis>; breakdown: string[] } {
    const analyses = new Map<string, StatAnalysis>();
    const breakdown: string[] = ["📊 Analyse des stats:"];

    const statMapping: Array<{ statKey: keyof StatStages; baseStat: number }> = [
      { statKey: "attack", baseStat: baseStats.attack },
      { statKey: "defense", baseStat: baseStats.defense },
      { statKey: "specialAttack", baseStat: baseStats.specialAttack },
      { statKey: "specialDefense", baseStat: baseStats.specialDefense },
      { statKey: "speed", baseStat: baseStats.speed }
    ];

    statMapping.forEach(({ statKey, baseStat }) => {
      const analysis = this.analyzeStat(baseStat, currentStages[statKey], statKey);
      analyses.set(statKey, analysis);

      const stageStr = analysis.currentStage >= 0 ? `+${analysis.currentStage}` : `${analysis.currentStage}`;
      const percentChange = Math.round((analysis.effectiveValue / baseStat - 1) * 100);
      const percentStr = percentChange >= 0 ? `+${percentChange}%` : `${percentChange}%`;
      
      breakdown.push(`   ${statKey}: ${baseStat} (stage ${stageStr}) → ${analysis.effectiveValue} (${percentStr})`);
    });

    return { analyses, breakdown };
  }

  /**
   * Calcule l'impact d'un boost potentiel
   */
  calculateBoostImpact(
    baseStat: number,
    currentStage: number,
    boostAmount: number,
    stat: keyof StatStages
  ): {
    currentValue: number;
    boostedValue: number;
    increase: number;
    percentIncrease: number;
    wouldBeCapped: boolean;
    breakdown: string[];
  } {
    const isAccEva = stat === "accuracy" || stat === "evasion";
    const currentValue = this.calculateEffectiveStat(baseStat, currentStage, isAccEva);
    
    const newStage = Math.max(-6, Math.min(6, currentStage + boostAmount));
    const boostedValue = this.calculateEffectiveStat(baseStat, newStage, isAccEva);
    
    const increase = boostedValue - currentValue;
    const percentIncrease = Math.round((increase / currentValue) * 100);
    const wouldBeCapped = currentStage + boostAmount !== newStage;

    const breakdown = [
      `📈 Impact du boost ${boostAmount >= 0 ? "+" : ""}${boostAmount} sur ${stat}:`,
      `   Actuel: ${currentValue} (stage ${currentStage >= 0 ? "+" : ""}${currentStage})`,
      `   Après boost: ${boostedValue} (stage ${newStage >= 0 ? "+" : ""}${newStage})`,
      `   Gain: +${increase} (${percentIncrease >= 0 ? "+" : ""}${percentIncrease}%)`,
      wouldBeCapped ? "   ⚠️ Boost partiellement limité" : ""
    ].filter(Boolean);

    return {
      currentValue,
      boostedValue,
      increase,
      percentIncrease,
      wouldBeCapped,
      breakdown
    };
  }

  /**
   * Recommande les meilleurs boosts à utiliser
   */
  recommendBoosts(
    baseStats: BaseStats,
    currentStages: StatStages,
    role: "attacker" | "defender" | "sweeper" | "tank" | "support"
  ): {
    recommendations: Array<{ stat: keyof StatStages; priority: number; reason: string }>;
    breakdown: string[];
  } {
    const recommendations: Array<{ stat: keyof StatStages; priority: number; reason: string }> = [];
    const breakdown: string[] = [`💡 Recommandations pour le rôle: ${role}`];

    // Priorités selon le rôle
    const priorities: Record<string, Partial<Record<keyof StatStages, { base: number; reason: string }>>> = {
      attacker: {
        attack: { base: 90, reason: "Maximiser les dégâts physiques" },
        specialAttack: { base: 85, reason: "Maximiser les dégâts spéciaux" },
        speed: { base: 60, reason: "Attaquer en premier" }
      },
      defender: {
        defense: { base: 90, reason: "Réduire les dégâts physiques" },
        specialDefense: { base: 85, reason: "Réduire les dégâts spéciaux" },
        attack: { base: 30, reason: "Maintenir une menace" }
      },
      sweeper: {
        speed: { base: 95, reason: "Garantir la première attaque" },
        attack: { base: 80, reason: "KO rapide physique" },
        specialAttack: { base: 80, reason: "KO rapide spécial" }
      },
      tank: {
        defense: { base: 85, reason: "Absorber les coups physiques" },
        specialDefense: { base: 85, reason: "Absorber les coups spéciaux" },
        attack: { base: 40, reason: "Riposte efficace" }
      },
      support: {
        speed: { base: 70, reason: "Appliquer les effets avant l'ennemi" },
        defense: { base: 60, reason: "Survivre pour supporter" },
        specialDefense: { base: 60, reason: "Survivre pour supporter" }
      }
    };

    const rolePriorities = priorities[role] || priorities.attacker;

    (Object.entries(rolePriorities) as [keyof StatStages, { base: number; reason: string }][]).forEach(([stat, { base, reason }]) => {
      const stage = currentStages[stat] || 0;
      
      // Réduire la priorité si déjà boosté
      const stageReduction = stage * 10;
      const priority = Math.max(0, base - stageReduction);
      
      if (stage < 6) {
        recommendations.push({ stat, priority, reason });
        const urgency = priority > 70 ? "🔴" : priority > 40 ? "🟡" : "🟢";
        breakdown.push(`   ${urgency} ${stat}: priorité ${priority} - ${reason} (actuel: ${stage >= 0 ? "+" : ""}${stage})`);
      }
    });

    // Trier par priorité
    recommendations.sort((a, b) => b.priority - a.priority);

    return { recommendations, breakdown };
  }
}
