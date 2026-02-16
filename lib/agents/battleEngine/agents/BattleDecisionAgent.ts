/**
 * BattleDecisionAgent
 * 
 * Agent principal de prise de décision en combat.
 * Utilise BattleDecisionTool pour:
 * - Choisir la meilleure action (attaque, switch, item)
 * - Anticiper les actions de l'adversaire
 * - Calculer la probabilité de victoire
 * - Coordonner avec les autres agents
 */

import { 
  BattleDecisionTool, 
  BattlePokemon, 
  BattleAction, 
  ActionScore, 
  BattleState,
  WinProbability,
  SwitchDecision,
  OpponentPrediction
} from "../tools/BattleDecisionTool";
import { DamageCalculationAgent } from "./DamageCalculationAgent";
import { SpeedOrderAgent } from "./SpeedOrderAgent";
import { StatModifierAgent } from "./StatModifierAgent";
import { StatusEffectAgent } from "./StatusEffectAgent";

export interface BattleDecisionRequest {
  state: BattleState;
  options?: {
    considerSetup?: boolean;
    considerSwitch?: boolean;
    riskTolerance?: "low" | "medium" | "high";
  };
}

export interface BattleDecisionResult {
  // Décision finale
  decision: BattleAction;
  confidence: number;
  
  // Analyse détaillée
  moveAnalysis: ActionScore[];
  switchAnalysis: SwitchDecision;
  opponentPrediction: OpponentPrediction;
  winProbability: WinProbability;
  
  // Reasoning
  reasoning: string[];
  mainReason: string;
  
  // Logs complets
  breakdown: string[];
}

export interface TacticalAnalysis {
  bestOffensiveOption: BattleAction;
  bestDefensiveOption: BattleAction;
  bestSetupOption?: BattleAction;
  recommendedStrategy: "offense" | "defense" | "setup" | "pivot";
  strategyReasoning: string[];
  breakdown: string[];
}

export class BattleDecisionAgent {
  private tool: BattleDecisionTool;
  private damageAgent: DamageCalculationAgent;
  private speedAgent: SpeedOrderAgent;
  private statAgent: StatModifierAgent;
  private statusAgent: StatusEffectAgent;
  private name = "BattleDecisionAgent";

  constructor() {
    this.tool = new BattleDecisionTool();
    this.damageAgent = new DamageCalculationAgent();
    this.speedAgent = new SpeedOrderAgent();
    this.statAgent = new StatModifierAgent();
    this.statusAgent = new StatusEffectAgent();
  }

  /**
   * Prend la décision optimale pour le tour actuel
   */
  makeDecision(request: BattleDecisionRequest): BattleDecisionResult {
    const breakdown: string[] = [];
    const reasoning: string[] = [];
    
    breakdown.push(`\n${"=".repeat(50)}`);
    breakdown.push(`🧠 ${this.name} - Analyse du tour ${request.state.turn}`);
    breakdown.push(`${"=".repeat(50)}`);
    breakdown.push(`\n⚔️ ${request.state.playerActive.name} vs ${request.state.opponentActive.name}`);
    
    const playerHpPercent = Math.round((request.state.playerActive.currentHp / request.state.playerActive.maxHp) * 100);
    const opponentHpPercent = Math.round((request.state.opponentActive.currentHp / request.state.opponentActive.maxHp) * 100);
    breakdown.push(`❤️ HP: ${playerHpPercent}% vs ${opponentHpPercent}%`);

    // Options par défaut
    const options = {
      considerSetup: request.options?.considerSetup ?? true,
      considerSwitch: request.options?.considerSwitch ?? true,
      riskTolerance: request.options?.riskTolerance ?? "medium"
    };

    // 1. Analyse de vitesse
    breakdown.push(`\n📊 ANALYSE DE VITESSE`);
    const speedAnalysis = this.speedAgent.analyze({
      playerPokemon: this.toBattlePokemonForSpeed(request.state.playerActive),
      opponentPokemon: this.toBattlePokemonForSpeed(request.state.opponentActive)
    });
    breakdown.push(...speedAnalysis.breakdown.slice(0, 5));
    
    if (speedAnalysis.firstAttacker === "player") {
      reasoning.push(`Nous sommes plus rapides (${speedAnalysis.playerSpeed} > ${speedAnalysis.opponentSpeed})`);
    } else {
      reasoning.push(`L'adversaire est plus rapide (${speedAnalysis.opponentSpeed} > ${speedAnalysis.playerSpeed})`);
    }

    // 2. Utiliser l'outil de décision principal
    const coreDecision = this.tool.makeDecision(request.state);
    
    breakdown.push(`\n📋 ANALYSE DES MOVES`);
    coreDecision.allOptions.slice(0, 4).forEach((opt, i) => {
      const move = opt.action.move;
      const koStr = opt.koChance && opt.koChance > 0 ? ` | KO: ${Math.round(opt.koChance)}%` : "";
      breakdown.push(`   ${i + 1}. ${move?.name}: Score ${opt.score}${koStr}`);
    });

    // 3. Analyse de switch si activée
    breakdown.push(`\n🔄 ANALYSE DE SWITCH`);
    if (options.considerSwitch) {
      breakdown.push(...coreDecision.switchAnalysis.breakdown.slice(0, 4));
      
      if (coreDecision.switchAnalysis.shouldSwitch) {
        reasoning.push(`Switch recommandé vers ${coreDecision.switchAnalysis.bestSwitchTarget?.name}`);
      }
    } else {
      breakdown.push(`   Switch non considéré (désactivé)`);
    }

    // 4. Prédiction de l'adversaire
    breakdown.push(`\n🔮 PRÉDICTION ADVERSAIRE`);
    breakdown.push(`   Action probable: ${coreDecision.prediction.likelyAction}`);
    if (coreDecision.prediction.expectedMove) {
      breakdown.push(`   Move attendu: ${coreDecision.prediction.expectedMove}`);
    }
    breakdown.push(`   Confiance: ${coreDecision.prediction.confidence}%`);

    // 5. Probabilité de victoire
    breakdown.push(`\n🎲 PROBABILITÉ DE VICTOIRE`);
    breakdown.push(`   Joueur: ${coreDecision.winProbability.playerWinChance}%`);
    breakdown.push(`   Adversaire: ${coreDecision.winProbability.opponentWinChance}%`);

    // 6. Ajuster la décision selon la tolérance au risque
    let finalDecision = coreDecision.bestAction;
    let mainReason = "";

    const bestMove = coreDecision.allOptions[0];
    
    if (options.riskTolerance === "low") {
      // Préférer les options sûres
      if (bestMove && bestMove.koChance && bestMove.koChance < 50 && speedAnalysis.firstAttacker === "opponent") {
        // Considérer le switch si on risque de se faire KO
        if (coreDecision.switchAnalysis.shouldSwitch && coreDecision.switchAnalysis.risk < 40) {
          finalDecision = { type: "switch", switchTo: coreDecision.switchAnalysis.bestSwitchTarget };
          mainReason = "Switch sûr car matchup défavorable";
        }
      }
    } else if (options.riskTolerance === "high") {
      // Préférer l'attaque même risquée
      if (bestMove && bestMove.koChance && bestMove.koChance > 30) {
        finalDecision = bestMove.action;
        mainReason = "Attaque agressive pour maximiser les dégâts";
      }
    }

    // Décision par défaut
    if (!mainReason) {
      if (finalDecision.type === "attack" && finalDecision.move) {
        mainReason = `${finalDecision.move.name} est le move optimal (Score: ${bestMove?.score})`;
      } else if (finalDecision.type === "switch" && finalDecision.switchTo) {
        mainReason = `Switch vers ${finalDecision.switchTo.name} pour meilleur matchup`;
      }
    }

    // Calculer la confiance
    let confidence = 70;
    if (bestMove) {
      if (bestMove.koChance && bestMove.koChance >= 80) confidence = 95;
      else if (bestMove.score > 80) confidence = 85;
      else if (coreDecision.switchAnalysis.shouldSwitch && finalDecision.type !== "switch") {
        confidence = 60; // On n'a pas suivi la recommandation de switch
      }
    }

    breakdown.push(`\n${"=".repeat(50)}`);
    breakdown.push(`✅ DÉCISION FINALE: ${finalDecision.type === "attack" ? finalDecision.move?.name : `Switch → ${finalDecision.switchTo?.name}`}`);
    breakdown.push(`💡 Raison: ${mainReason}`);
    breakdown.push(`📊 Confiance: ${confidence}%`);
    breakdown.push(`${"=".repeat(50)}`);

    return {
      decision: finalDecision,
      confidence,
      moveAnalysis: coreDecision.allOptions,
      switchAnalysis: coreDecision.switchAnalysis,
      opponentPrediction: coreDecision.prediction,
      winProbability: coreDecision.winProbability,
      reasoning,
      mainReason,
      breakdown
    };
  }

  /**
   * Analyse tactique approfondie
   */
  analyzeTactics(state: BattleState): TacticalAnalysis {
    const breakdown: string[] = [];
    breakdown.push(`\n🎯 Analyse tactique approfondie`);

    const coreDecision = this.tool.makeDecision(state);
    const strategyReasoning: string[] = [];

    // Meilleure option offensive
    const offensiveMoves = coreDecision.allOptions.filter(opt => 
      opt.action.type === "attack" && 
      opt.action.move?.damageClass !== "status"
    );
    const bestOffensiveOption = offensiveMoves[0]?.action || { 
      type: "attack" as const, 
      move: state.playerActive.moves[0] 
    };

    // Meilleure option défensive (switch + recovery)
    let bestDefensiveOption: BattleAction;
    if (coreDecision.switchAnalysis.bestSwitchTarget) {
      bestDefensiveOption = { type: "switch", switchTo: coreDecision.switchAnalysis.bestSwitchTarget };
    } else {
      // Chercher un move de recovery
      const recoveryMove = state.playerActive.moves.find(m => 
        m.name.toLowerCase().includes("recover") ||
        m.name.toLowerCase().includes("roost") ||
        m.name.toLowerCase().includes("rest")
      );
      bestDefensiveOption = recoveryMove 
        ? { type: "attack", move: recoveryMove }
        : bestOffensiveOption;
    }

    // Meilleure option setup
    let bestSetupOption: BattleAction | undefined;
    const setupMove = state.playerActive.moves.find(m => 
      m.damageClass === "status" && (
        m.name.toLowerCase().includes("dragon dance") ||
        m.name.toLowerCase().includes("swords dance") ||
        m.name.toLowerCase().includes("calm mind") ||
        m.name.toLowerCase().includes("nasty plot")
      )
    );
    if (setupMove) {
      bestSetupOption = { type: "attack", move: setupMove };
    }

    // Déterminer la stratégie recommandée
    let recommendedStrategy: "offense" | "defense" | "setup" | "pivot" = "offense";
    
    const playerHpPercent = (state.playerActive.currentHp / state.playerActive.maxHp) * 100;
    const opponentHpPercent = (state.opponentActive.currentHp / state.opponentActive.maxHp) * 100;
    
    // Check si KO possible
    const canKo = offensiveMoves[0]?.koChance && offensiveMoves[0].koChance >= 70;
    const riskOfKo = coreDecision.switchAnalysis.shouldSwitch;

    if (canKo) {
      recommendedStrategy = "offense";
      strategyReasoning.push("Chance de KO élevée - attaque recommandée");
    } else if (riskOfKo && coreDecision.switchAnalysis.risk < 50) {
      recommendedStrategy = "pivot";
      strategyReasoning.push("Matchup défavorable - pivot recommandé");
    } else if (bestSetupOption && playerHpPercent > 70 && opponentHpPercent > 50) {
      recommendedStrategy = "setup";
      strategyReasoning.push("Situation stable - setup possible");
    } else if (playerHpPercent < 30) {
      recommendedStrategy = "defense";
      strategyReasoning.push("HP critiques - défense recommandée");
    } else {
      recommendedStrategy = "offense";
      strategyReasoning.push("Stratégie par défaut - continuer l'offensive");
    }

    breakdown.push(`\n🎯 Stratégie recommandée: ${recommendedStrategy.toUpperCase()}`);
    strategyReasoning.forEach(r => breakdown.push(`   - ${r}`));

    breakdown.push(`\n📋 Options par catégorie:`);
    breakdown.push(`   Offensive: ${bestOffensiveOption.move?.name}`);
    breakdown.push(`   Défensive: ${bestDefensiveOption.type === "switch" ? `Switch → ${bestDefensiveOption.switchTo?.name}` : bestDefensiveOption.move?.name}`);
    if (bestSetupOption) {
      breakdown.push(`   Setup: ${bestSetupOption.move?.name}`);
    }

    return {
      bestOffensiveOption,
      bestDefensiveOption,
      bestSetupOption,
      recommendedStrategy,
      strategyReasoning,
      breakdown
    };
  }

  /**
   * Calcule la probabilité de victoire détaillée
   */
  calculateDetailedWinProbability(state: BattleState): WinProbability & { 
    detailedFactors: string[];
    criticalWarnings: string[];
  } {
    const winProb = this.tool.calculateWinProbability(state);
    const detailedFactors: string[] = [];
    const criticalWarnings: string[] = [];

    // Analyser chaque facteur
    if (winProb.factors.hpAdvantage > 10) {
      detailedFactors.push(`+${Math.round(winProb.factors.hpAdvantage)} : Avantage HP significatif`);
    } else if (winProb.factors.hpAdvantage < -10) {
      detailedFactors.push(`${Math.round(winProb.factors.hpAdvantage)} : Désavantage HP`);
      criticalWarnings.push("⚠️ HP inférieurs à l'adversaire");
    }

    if (winProb.factors.pokemonCountAdvantage > 0) {
      detailedFactors.push(`+${winProb.factors.pokemonCountAdvantage} : Plus de Pokémon restants`);
    } else if (winProb.factors.pokemonCountAdvantage < 0) {
      criticalWarnings.push("⚠️ Moins de Pokémon que l'adversaire");
    }

    if (winProb.factors.typeMatchup > 5) {
      detailedFactors.push(`+${Math.round(winProb.factors.typeMatchup)} : Matchup de type favorable`);
    }

    if (winProb.factors.speedAdvantage > 0) {
      detailedFactors.push(`+${winProb.factors.speedAdvantage} : Plus rapide`);
    }

    if (winProb.factors.statusAdvantage !== 0) {
      if (winProb.factors.statusAdvantage > 0) {
        detailedFactors.push(`+${winProb.factors.statusAdvantage} : Adversaire affecté par un statut`);
      } else {
        criticalWarnings.push("⚠️ Nous avons un statut handicapant");
      }
    }

    // Alertes critiques
    const playerAlive = state.playerTeam.filter(p => p.currentHp > 0).length;
    if (playerAlive === 1 && state.playerActive.currentHp < state.playerActive.maxHp * 0.3) {
      criticalWarnings.push("🚨 DERNIER POKÉMON EN DANGER!");
    }

    return {
      ...winProb,
      detailedFactors,
      criticalWarnings
    };
  }

  // Utilitaire de conversion
  private toBattlePokemonForSpeed(p: BattlePokemon): any {
    return {
      name: p.name,
      currentStats: { speed: p.currentStats.speed },
      statStages: { speed: p.statStages.speed },
      statusCondition: p.statusCondition,
      team: p.team
    };
  }
}
