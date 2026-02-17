/**
 * Battle Agent (SubAgent)
 * 
 * Sous-agent qui gère les décisions de combat en utilisant directement les Tools.
 * 
 * Architecture: MasterAgent → BattleAgent (SubAgent) → Tools
 * 
 * Tools utilisés:
 * - BattleDecisionTool: Décisions d'attaque, switch, prédictions
 * - DamageCalculatorTool: Calcul précis des dégâts
 * - SpeedComparatorTool: Ordre des tours
 * - StatusEffectTool: Gestion des statuts
 * - StatModifierTool: Gestion des boosts
 */

import {
  BattleDecisionTool,
  BattleState,
  BattleAction,
  BattlePokemon,
  ActionScore,
  WinProbability,
  SwitchDecision,
  OpponentPrediction,
} from "../battleEngine/tools/BattleDecisionTool";
import {
  DamageCalculatorTool,
  DamageCalculationResult,
  MoveForDamage,
} from "../battleEngine/tools/DamageCalculatorTool";
import {
  SpeedComparatorTool,
  SpeedComparisonResult,
} from "../battleEngine/tools/SpeedComparatorTool";
import { StatusEffectTool } from "../battleEngine/tools/StatusEffectTool";
import { StatModifierTool } from "../battleEngine/tools/StatModifierTool";

// ============================================================================
// TYPES
// ============================================================================

export interface BattleRequest {
  battleState: BattleState;
  ourTeam: BattlePokemon[];
  opponentTeam: BattlePokemon[];
  options?: {
    logLevel?: "none" | "minimal" | "detailed";
    aggressiveness?: "defensive" | "balanced" | "aggressive";
  };
}

export interface BattleResponse {
  success: boolean;
  action?: BattleAction;
  reasoning?: string;
  confidence?: number;
  analysis?: {
    moveOptions: ActionScore[];
    switchAnalysis: SwitchDecision;
    prediction: OpponentPrediction;
    winProbability: WinProbability;
  };
  error?: string;
}

export interface TurnResult {
  decision: BattleAction;
  confidence: number;
  summary: string;
  breakdown: string[];
}

export interface BattleSimulationResult {
  winner: "player" | "opponent";
  turns: number;
  turnHistory: TurnResult[];
  summary: string;
}

// ============================================================================
// BATTLE AGENT
// ============================================================================

export class BattleAgent {
  // === TOOLS ===
  private decisionTool: BattleDecisionTool;
  private damageTool: DamageCalculatorTool;
  private speedTool: SpeedComparatorTool;
  private statusTool: StatusEffectTool;
  private statTool: StatModifierTool;

  // === CONFIG ===
  private logLevel: "none" | "minimal" | "detailed";
  private aggressiveness: "defensive" | "balanced" | "aggressive";

  constructor(options?: BattleRequest["options"]) {
    // Initialiser les Tools
    this.decisionTool = new BattleDecisionTool();
    this.damageTool = new DamageCalculatorTool();
    this.speedTool = new SpeedComparatorTool();
    this.statusTool = new StatusEffectTool();
    this.statTool = new StatModifierTool();

    // Config
    this.logLevel = options?.logLevel ?? "minimal";
    this.aggressiveness = options?.aggressiveness ?? "balanced";
  }

  /**
   * Point d'entrée principal - Prend une décision de combat
   */
  async process(request: BattleRequest): Promise<BattleResponse> {
    try {
      // Valider la requête
      if (!request.battleState) {
        return { success: false, error: "État de combat manquant" };
      }

      if (!request.battleState.playerActive || !request.battleState.opponentActive) {
        return { success: false, error: "Pokémon actifs manquants" };
      }

      // Utiliser le BattleDecisionTool pour la décision
      const decision = this.decisionTool.makeDecision(request.battleState);

      // Construire le raisonnement
      const reasoning = this.buildReasoning(decision);

      // Calculer la confiance basée sur le score et la probabilité de victoire
      const confidence = Math.round(
        (decision.allOptions[0]?.score ?? 50) * 0.6 +
        decision.winProbability.playerWinChance * 0.4
      );

      return {
        success: true,
        action: decision.bestAction,
        reasoning,
        confidence: Math.min(100, Math.max(0, confidence)),
        analysis: {
          moveOptions: decision.allOptions,
          switchAnalysis: decision.switchAnalysis,
          prediction: decision.prediction,
          winProbability: decision.winProbability,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Erreur dans BattleAgent",
      };
    }
  }

  /**
   * Exécute un tour de combat et retourne le résultat détaillé
   */
  executeTurn(state: BattleState): TurnResult {
    const decision = this.decisionTool.makeDecision(state);

    // Résumé de la décision
    let summary: string;
    if (decision.bestAction.type === "attack" && decision.bestAction.move) {
      summary = `${state.playerActive.name} utilise ${decision.bestAction.move.name}`;
    } else if (decision.bestAction.type === "switch" && decision.bestAction.switchTo) {
      summary = `Switch vers ${decision.bestAction.switchTo.name}`;
    } else {
      summary = "Action inconnue";
    }

    return {
      decision: decision.bestAction,
      confidence: decision.winProbability.playerWinChance,
      summary,
      breakdown: decision.breakdown,
    };
  }

  /**
   * Évalue toutes les actions possibles et les ordonne par score
   */
  evaluateAllActions(battleState: BattleState): ActionScore[] {
    const playerPokemon = battleState.playerActive;
    if (!playerPokemon) return [];

    // Évaluer les moves via le Tool
    const moveScores = this.decisionTool.evaluateMoves(
      battleState.playerActive,
      battleState.opponentActive
    );

    // Évaluer les switches possibles
    const switchAnalysis = this.decisionTool.evaluateSwitch(battleState);

    // Combiner les résultats
    const allActions = [...moveScores];

    // Ajouter le switch si recommandé
    if (switchAnalysis.shouldSwitch && switchAnalysis.bestSwitchTarget) {
      allActions.push({
        action: { type: "switch", switchTo: switchAnalysis.bestSwitchTarget },
        score: 100 - switchAnalysis.risk,
        reasoning: switchAnalysis.reasons,
        breakdown: switchAnalysis.breakdown,
      });
    }

    return allActions.sort((a, b) => b.score - a.score);
  }

  /**
   * Analyse l'état actuel du combat
   */
  analyzeCurrentState(battleState: BattleState): {
    advantage: "player" | "opponent" | "even";
    momentum: "player" | "opponent" | "neutral";
    criticalFactors: string[];
    recommendations: string[];
  } {
    const player = battleState.playerActive;
    const opponent = battleState.opponentActive;

    if (!player || !opponent) {
      return {
        advantage: "even",
        momentum: "neutral",
        criticalFactors: [],
        recommendations: [],
      };
    }

    const criticalFactors: string[] = [];
    const recommendations: string[] = [];

    // Utiliser les Tools pour l'analyse
    const winProb = this.decisionTool.calculateWinProbability(battleState);
    const speedResult = this.speedTool.compareSpeed(
      {
        name: player.name,
        currentStats: { speed: player.currentStats.speed },
        statStages: { speed: player.statStages.speed },
        statusCondition: player.statusCondition,
        team: "player",
      },
      {
        name: opponent.name,
        currentStats: { speed: opponent.currentStats.speed },
        statStages: { speed: opponent.statStages.speed },
        statusCondition: opponent.statusCondition,
        team: "opponent",
      }
    );

    // Analyser les HP
    const playerHpPercent = player.currentHp / player.maxHp;
    const opponentHpPercent = opponent.currentHp / opponent.maxHp;

    if (playerHpPercent > opponentHpPercent + 0.3) {
      criticalFactors.push(`Avantage HP (+${Math.round((playerHpPercent - opponentHpPercent) * 100)}%)`);
    } else if (opponentHpPercent > playerHpPercent + 0.3) {
      criticalFactors.push(`Désavantage HP (${Math.round((playerHpPercent - opponentHpPercent) * 100)}%)`);
    }

    // Analyser la vitesse
    if (speedResult.firstPokemon.team === "player") {
      criticalFactors.push("Plus rapide que l'adversaire");
    } else {
      criticalFactors.push("Plus lent que l'adversaire");
    }

    // Recommandations basées sur la probabilité de victoire
    if (winProb.playerWinChance > 70) {
      recommendations.push("Position avantageuse - attaquez agressivement");
    } else if (winProb.playerWinChance < 30) {
      recommendations.push("Position difficile - considérez un switch défensif");
    }

    if (playerHpPercent < 0.3 && battleState.playerTeam.length > 1) {
      recommendations.push("Considérez un switch pour préserver ce Pokémon");
    }

    if (opponentHpPercent < 0.25) {
      recommendations.push("L'adversaire est faible - finissez-le!");
    }

    // Déterminer l'avantage
    let advantage: "player" | "opponent" | "even" = "even";
    if (winProb.playerWinChance > 60) advantage = "player";
    else if (winProb.playerWinChance < 40) advantage = "opponent";

    // Déterminer le momentum
    let momentum: "player" | "opponent" | "neutral" = "neutral";
    if (playerHpPercent > 0.7 && speedResult.firstPokemon.team === "player") {
      momentum = "player";
    } else if (opponentHpPercent > 0.7 && speedResult.firstPokemon.team === "opponent") {
      momentum = "opponent";
    }

    return { advantage, momentum, criticalFactors, recommendations };
  }

  /**
   * Prédit l'action probable de l'adversaire
   */
  predictOpponentAction(battleState: BattleState): OpponentPrediction {
    return this.decisionTool.predictOpponentAction(battleState);
  }

  /**
   * Calcule les dégâts d'un move spécifique
   */
  calculateDamage(
    attacker: BattlePokemon,
    defender: BattlePokemon,
    move: MoveForDamage
  ): DamageCalculationResult {
    return this.damageTool.calculateDamage(
      {
        name: attacker.name,
        types: attacker.types,
        level: attacker.level,
        currentStats: {
          attack: attacker.currentStats.attack,
          defense: attacker.currentStats.defense,
          specialAttack: attacker.currentStats.specialAttack,
          specialDefense: attacker.currentStats.specialDefense,
        },
        statStages: {
          attack: attacker.statStages.attack,
          defense: attacker.statStages.defense,
          specialAttack: attacker.statStages.specialAttack,
          specialDefense: attacker.statStages.specialDefense,
        },
        statusCondition: attacker.statusCondition,
      },
      {
        name: defender.name,
        types: defender.types,
        level: defender.level,
        currentStats: {
          attack: defender.currentStats.attack,
          defense: defender.currentStats.defense,
          specialAttack: defender.currentStats.specialAttack,
          specialDefense: defender.currentStats.specialDefense,
        },
        statStages: {
          attack: defender.statStages.attack,
          defense: defender.statStages.defense,
          specialAttack: defender.statStages.specialAttack,
          specialDefense: defender.statStages.specialDefense,
        },
        statusCondition: defender.statusCondition,
      },
      move,
      defender.currentHp,
      defender.maxHp
    );
  }

  /**
   * Compare la vitesse de deux Pokémon
   */
  compareSpeed(pokemon1: BattlePokemon, pokemon2: BattlePokemon): SpeedComparisonResult {
    return this.speedTool.compareSpeed(
      {
        name: pokemon1.name,
        currentStats: { speed: pokemon1.currentStats.speed },
        statStages: { speed: pokemon1.statStages.speed },
        statusCondition: pokemon1.statusCondition,
        team: pokemon1.team,
      },
      {
        name: pokemon2.name,
        currentStats: { speed: pokemon2.currentStats.speed },
        statStages: { speed: pokemon2.statStages.speed },
        statusCondition: pokemon2.statusCondition,
        team: pokemon2.team,
      }
    );
  }

  // ============================================================================
  // COMBAT 6v6 AUTOMATIQUE
  // ============================================================================

  /**
   * Simule un combat complet 6v6 de manière automatique
   */
  autoBattle(
    playerTeam: BattlePokemon[],
    opponentTeam: BattlePokemon[],
    options?: { maxTurns?: number }
  ): BattleSimulationResult {
    const maxTurns = options?.maxTurns ?? 100;
    const turnHistory: TurnResult[] = [];
    
    // Copier les équipes pour ne pas modifier les originales
    const pTeam = playerTeam.map((p) => ({ ...p, team: "player" as const }));
    const oTeam = opponentTeam.map((p) => ({ ...p, team: "opponent" as const }));

    let currentState: BattleState = {
      playerActive: pTeam[0],
      opponentActive: oTeam[0],
      playerTeam: pTeam,
      opponentTeam: oTeam,
      turn: 1,
      weather: null,
    };

    for (let turn = 1; turn <= maxTurns; turn++) {
      currentState.turn = turn;

      // Vérifier les conditions de victoire
      const playerAlive = pTeam.filter((p) => p.currentHp > 0).length;
      const opponentAlive = oTeam.filter((p) => p.currentHp > 0).length;

      if (playerAlive === 0) {
        return {
          winner: "opponent",
          turns: turn,
          turnHistory,
          summary: `Combat terminé en ${turn} tours. Adversaire gagne.`,
        };
      }
      if (opponentAlive === 0) {
        return {
          winner: "player",
          turns: turn,
          turnHistory,
          summary: `Combat terminé en ${turn} tours. Joueur gagne.`,
        };
      }

      // Tour du joueur
      const playerTurn = this.executeTurn(currentState);
      turnHistory.push(playerTurn);

      // Appliquer l'action du joueur (simulation simplifiée)
      this.applyAction(currentState, playerTurn.decision, "player");

      // Tour de l'adversaire (IA inverse)
      const invertedState = this.invertState(currentState);
      const opponentDecision = this.decisionTool.makeDecision(invertedState);
      this.applyAction(currentState, opponentDecision.bestAction, "opponent");

      // Mettre à jour les Pokémon actifs si KO
      this.updateActiveIfKO(currentState);
    }

    // Timeout - déterminer le gagnant par HP restants
    const playerTotalHp = pTeam.reduce((sum, p) => sum + p.currentHp, 0);
    const opponentTotalHp = oTeam.reduce((sum, p) => sum + p.currentHp, 0);

    return {
      winner: playerTotalHp > opponentTotalHp ? "player" : "opponent",
      turns: maxTurns,
      turnHistory,
      summary: `Combat terminé après ${maxTurns} tours (timeout). Vainqueur: ${playerTotalHp > opponentTotalHp ? "Joueur" : "Adversaire"}`,
    };
  }

  // ============================================================================
  // MÉTHODES UTILITAIRES PRIVÉES
  // ============================================================================

  private buildReasoning(decision: ReturnType<BattleDecisionTool["makeDecision"]>): string {
    const parts: string[] = [];

    if (decision.bestAction.type === "attack" && decision.bestAction.move) {
      parts.push(`Utilise ${decision.bestAction.move.name}`);
      const topOption = decision.allOptions[0];
      if (topOption) {
        parts.push(`Score: ${topOption.score}`);
        if (topOption.koChance && topOption.koChance > 50) {
          parts.push(`Chance de KO: ${Math.round(topOption.koChance)}%`);
        }
      }
    } else if (decision.bestAction.type === "switch" && decision.bestAction.switchTo) {
      parts.push(`Switch vers ${decision.bestAction.switchTo.name}`);
      parts.push(...decision.switchAnalysis.reasons.slice(0, 2));
    }

    parts.push(`Prob. victoire: ${decision.winProbability.playerWinChance}%`);

    return parts.join(". ");
  }

  private invertState(state: BattleState): BattleState {
    return {
      playerActive: { ...state.opponentActive, team: "player" },
      opponentActive: { ...state.playerActive, team: "opponent" },
      playerTeam: state.opponentTeam.map((p) => ({ ...p, team: "player" as const })),
      opponentTeam: state.playerTeam.map((p) => ({ ...p, team: "opponent" as const })),
      turn: state.turn,
      weather: state.weather,
    };
  }

  private applyAction(
    state: BattleState,
    action: BattleAction,
    side: "player" | "opponent"
  ): void {
    const attacker = side === "player" ? state.playerActive : state.opponentActive;
    const defender = side === "player" ? state.opponentActive : state.playerActive;

    if (action.type === "attack" && action.move) {
      // Calculer et appliquer les dégâts
      const damage = this.calculateDamage(attacker, defender, action.move);
      defender.currentHp = Math.max(0, defender.currentHp - damage.damage);
    } else if (action.type === "switch" && action.switchTo) {
      // Effectuer le switch
      const team = side === "player" ? state.playerTeam : state.opponentTeam;
      const idx = team.findIndex((p) => p.name === action.switchTo!.name);
      if (idx !== -1) {
        if (side === "player") {
          state.playerActive = team[idx];
        } else {
          state.opponentActive = team[idx];
        }
      }
    }
  }

  private updateActiveIfKO(state: BattleState): void {
    // Remplacer le Pokémon joueur si KO
    if (state.playerActive.currentHp <= 0) {
      const alive = state.playerTeam.find((p) => p.currentHp > 0);
      if (alive) state.playerActive = alive;
    }

    // Remplacer le Pokémon adversaire si KO
    if (state.opponentActive.currentHp <= 0) {
      const alive = state.opponentTeam.find((p) => p.currentHp > 0);
      if (alive) state.opponentActive = alive;
    }
  }

  // ============================================================================
  // HELPER STATIQUE
  // ============================================================================

  /**
   * Crée un BattlePokemon à partir de données de base
   */
  static createBattlePokemon(
    name: string,
    types: string[],
    level: number,
    baseStats: {
      hp: number;
      attack: number;
      defense: number;
      specialAttack: number;
      specialDefense: number;
      speed: number;
    },
    moves: MoveForDamage[],
    team: "player" | "opponent"
  ): BattlePokemon {
    const calculateStat = (base: number, isHp: boolean = false) => {
      if (isHp) {
        return Math.floor(((2 * base + 31 + 252 / 4) * level) / 100) + level + 10;
      }
      return Math.floor(((2 * base + 31 + 252 / 4) * level) / 100 + 5);
    };

    const maxHp = calculateStat(baseStats.hp, true);

    return {
      name,
      types,
      level,
      baseStats,
      currentStats: {
        attack: calculateStat(baseStats.attack),
        defense: calculateStat(baseStats.defense),
        specialAttack: calculateStat(baseStats.specialAttack),
        specialDefense: calculateStat(baseStats.specialDefense),
        speed: calculateStat(baseStats.speed),
      },
      statStages: {
        attack: 0,
        defense: 0,
        specialAttack: 0,
        specialDefense: 0,
        speed: 0,
        accuracy: 0,
        evasion: 0,
      },
      currentHp: maxHp,
      maxHp,
      moves,
      statusCondition: null,
      team,
    };
  }
}

export default BattleAgent;

// Re-export des types depuis les Tools pour faciliter l'utilisation
export type {
  BattleState,
  BattleAction,
  BattlePokemon,
  ActionScore,
  WinProbability,
  SwitchDecision,
  OpponentPrediction,
} from "../battleEngine/tools/BattleDecisionTool";

export type {
  MoveForDamage,
  DamageCalculationResult,
} from "../battleEngine/tools/DamageCalculatorTool";

export type { SpeedComparisonResult } from "../battleEngine/tools/SpeedComparatorTool";
