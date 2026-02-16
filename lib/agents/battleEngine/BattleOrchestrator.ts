/**
 * BattleOrchestrator
 * 
 * Orchestrateur principal du système multi-agents de combat.
 * Coordonne les 5 agents pour prendre les meilleures décisions:
 * 
 * 1. DamageCalculationAgent - Calcul précis des dégâts
 * 2. SpeedOrderAgent - Détermination de l'ordre des tours
 * 3. StatModifierAgent - Gestion des boosts/debuffs
 * 4. StatusEffectAgent - Gestion des statuts
 * 5. BattleDecisionAgent - Prise de décision finale
 */

import { 
  DamageCalculationAgent, 
  DamageAnalysisResult 
} from "./agents/DamageCalculationAgent";
import { 
  SpeedOrderAgent, 
  SpeedAnalysisResult,
  TeamSpeedAnalysis 
} from "./agents/SpeedOrderAgent";
import { 
  StatModifierAgent,
  StatStateAnalysis,
  SetupRecommendation
} from "./agents/StatModifierAgent";
import { 
  StatusEffectAgent,
  StatusStrategyResult,
  TurnProcessingResult
} from "./agents/StatusEffectAgent";
import { 
  BattleDecisionAgent,
  BattleDecisionResult,
  TacticalAnalysis
} from "./agents/BattleDecisionAgent";
import { BattlePokemon, BattleState, BattleAction } from "./tools/BattleDecisionTool";
import { StatusState, PrimaryStatus } from "./tools/StatusEffectTool";
import { MoveForDamage } from "./tools/DamageCalculatorTool";

export interface OrchestratorConfig {
  logLevel: "none" | "minimal" | "detailed" | "debug";
  aggressiveness: "defensive" | "balanced" | "aggressive";
  considerSetup: boolean;
  considerSwitch: boolean;
}

export interface TurnResult {
  // Décision prise
  decision: BattleAction;
  confidence: number;
  
  // Analyses des agents
  speedAnalysis: SpeedAnalysisResult;
  damageAnalysis: DamageAnalysisResult;
  statusAnalysis?: StatusStrategyResult;
  statAnalysis?: StatStateAnalysis;
  
  // Résultat final
  fullDecision: BattleDecisionResult;
  
  // Logs
  agentLogs: string[];
  summary: string;
}

export interface BattleSimulationResult {
  winner: "player" | "opponent";
  turns: number;
  turnHistory: TurnResult[];
  finalState: BattleState;
}

export class BattleOrchestrator {
  private damageAgent: DamageCalculationAgent;
  private speedAgent: SpeedOrderAgent;
  private statAgent: StatModifierAgent;
  private statusAgent: StatusEffectAgent;
  private decisionAgent: BattleDecisionAgent;
  
  private config: OrchestratorConfig;
  private logs: string[] = [];

  constructor(config?: Partial<OrchestratorConfig>) {
    // Initialiser les agents
    this.damageAgent = new DamageCalculationAgent();
    this.speedAgent = new SpeedOrderAgent();
    this.statAgent = new StatModifierAgent();
    this.statusAgent = new StatusEffectAgent();
    this.decisionAgent = new BattleDecisionAgent();

    // Configuration par défaut
    this.config = {
      logLevel: config?.logLevel ?? "minimal",
      aggressiveness: config?.aggressiveness ?? "balanced",
      considerSetup: config?.considerSetup ?? true,
      considerSwitch: config?.considerSwitch ?? true
    };
  }

  /**
   * Log avec niveau
   */
  private log(message: string, level: "minimal" | "detailed" | "debug" = "minimal") {
    const levels = { none: 0, minimal: 1, detailed: 2, debug: 3 };
    if (levels[this.config.logLevel] >= levels[level]) {
      this.logs.push(message);
      console.log(message);
    }
  }

  /**
   * Réinitialise les logs
   */
  clearLogs(): void {
    this.logs = [];
  }

  /**
   * Récupère tous les logs
   */
  getLogs(): string[] {
    return [...this.logs];
  }

  /**
   * Exécute un tour de combat complet
   */
  executeTurn(state: BattleState): TurnResult {
    const agentLogs: string[] = [];
    
    this.log(`\n${"═".repeat(60)}`, "minimal");
    this.log(`🎮 TOUR ${state.turn}`, "minimal");
    this.log(`${"═".repeat(60)}`, "minimal");
    this.log(`⚔️ ${state.playerActive.name} vs ${state.opponentActive.name}`, "minimal");

    // === PHASE 1: Analyse de vitesse ===
    this.log(`\n[1/5] 🏃 SpeedOrderAgent`, "detailed");
    const speedAnalysis = this.speedAgent.analyze({
      playerPokemon: {
        name: state.playerActive.name,
        currentStats: { speed: state.playerActive.currentStats.speed },
        statStages: { speed: state.playerActive.statStages.speed },
        statusCondition: state.playerActive.statusCondition,
        team: "player"
      },
      opponentPokemon: {
        name: state.opponentActive.name,
        currentStats: { speed: state.opponentActive.currentStats.speed },
        statStages: { speed: state.opponentActive.statStages.speed },
        statusCondition: state.opponentActive.statusCondition,
        team: "opponent"
      }
    });
    agentLogs.push(...speedAnalysis.breakdown);
    this.log(`   → ${speedAnalysis.firstPokemonName} est plus rapide`, "minimal");

    // === PHASE 2: Analyse des dégâts ===
    this.log(`\n[2/5] 💥 DamageCalculationAgent`, "detailed");
    const damageAnalysis = this.damageAgent.analyze({
      attacker: {
        name: state.playerActive.name,
        types: state.playerActive.types,
        level: state.playerActive.level,
        currentStats: state.playerActive.currentStats,
        statStages: state.playerActive.statStages,
        statusCondition: state.playerActive.statusCondition
      },
      defender: {
        name: state.opponentActive.name,
        types: state.opponentActive.types,
        level: state.opponentActive.level,
        currentStats: state.opponentActive.currentStats,
        statStages: state.opponentActive.statStages,
        statusCondition: state.opponentActive.statusCondition
      },
      defenderCurrentHp: state.opponentActive.currentHp,
      defenderMaxHp: state.opponentActive.maxHp,
      moves: state.playerActive.moves
    });
    agentLogs.push(...damageAnalysis.breakdown);
    
    if (damageAnalysis.bestMove) {
      this.log(`   → Meilleur move: ${damageAnalysis.bestMove.move.name} (${damageAnalysis.bestMove.result.damage} dmg)`, "minimal");
    }

    // === PHASE 3: Analyse des stats ===
    this.log(`\n[3/5] 📊 StatModifierAgent`, "detailed");
    const statAnalysis = this.statAgent.analyzeStatState({
      baseStats: state.playerActive.baseStats,
      currentStages: state.playerActive.statStages
    });
    agentLogs.push(...statAnalysis.breakdown);
    this.log(`   → Puissance: ${statAnalysis.overallPower}/100, Boosts: +${statAnalysis.totalBoostStages}`, "detailed");

    // === PHASE 4: Analyse des statuts ===
    this.log(`\n[4/5] ☠️ StatusEffectAgent`, "detailed");
    let statusAnalysis: StatusStrategyResult | undefined;
    
    if (state.opponentActive.statusCondition === null) {
      statusAnalysis = this.statusAgent.recommendStatus({
        targetTypes: state.opponentActive.types,
        targetRole: this.inferRole(state.opponentActive),
        targetCurrentHpPercent: (state.opponentActive.currentHp / state.opponentActive.maxHp) * 100,
        targetCurrentStatus: state.opponentActive.statusCondition
      });
      agentLogs.push(...statusAnalysis.breakdown);
      
      if (statusAnalysis.bestStatus) {
        this.log(`   → Statut recommandé: ${statusAnalysis.bestStatus} (valeur: ${statusAnalysis.statusValue})`, "detailed");
      }
    } else {
      this.log(`   → Adversaire déjà affecté par ${state.opponentActive.statusCondition}`, "detailed");
    }

    // === PHASE 5: Décision finale ===
    this.log(`\n[5/5] 🧠 BattleDecisionAgent`, "detailed");
    const riskTolerance = this.config.aggressiveness === "aggressive" ? "high" 
      : this.config.aggressiveness === "defensive" ? "low" 
      : "medium";
    
    const fullDecision = this.decisionAgent.makeDecision({
      state,
      options: {
        considerSetup: this.config.considerSetup,
        considerSwitch: this.config.considerSwitch,
        riskTolerance
      }
    });
    agentLogs.push(...fullDecision.breakdown);

    // Résumé de la décision
    let summary: string;
    if (fullDecision.decision.type === "attack" && fullDecision.decision.move) {
      summary = `🎯 ${state.playerActive.name} utilise ${fullDecision.decision.move.name}`;
    } else if (fullDecision.decision.type === "switch" && fullDecision.decision.switchTo) {
      summary = `🔄 Switch vers ${fullDecision.decision.switchTo.name}`;
    } else {
      summary = "❓ Décision inconnue";
    }

    this.log(`\n${"─".repeat(60)}`, "minimal");
    this.log(`✅ DÉCISION: ${summary}`, "minimal");
    this.log(`📊 Confiance: ${fullDecision.confidence}%`, "minimal");
    this.log(`💡 ${fullDecision.mainReason}`, "minimal");
    this.log(`${"─".repeat(60)}`, "minimal");

    return {
      decision: fullDecision.decision,
      confidence: fullDecision.confidence,
      speedAnalysis,
      damageAnalysis,
      statusAnalysis,
      statAnalysis,
      fullDecision,
      agentLogs,
      summary
    };
  }

  /**
   * Génère une action pour l'IA adverse
   */
  generateOpponentAction(state: BattleState): BattleAction {
    // Créer un état inversé pour l'adversaire
    const invertedState: BattleState = {
      playerActive: state.opponentActive,
      opponentActive: state.playerActive,
      playerTeam: state.opponentTeam,
      opponentTeam: state.playerTeam,
      turn: state.turn,
      weather: state.weather
    };

    // Ajuster le team pour que l'adversaire soit "player"
    invertedState.playerActive = { ...state.opponentActive, team: "player" };
    invertedState.opponentActive = { ...state.playerActive, team: "opponent" };
    invertedState.playerTeam = state.opponentTeam.map(p => ({ ...p, team: "player" as const }));
    invertedState.opponentTeam = state.playerTeam.map(p => ({ ...p, team: "opponent" as const }));

    this.log(`\n🤖 IA ADVERSE - Tour ${state.turn}`, "detailed");
    
    const decision = this.decisionAgent.makeDecision({
      state: invertedState,
      options: {
        considerSetup: true,
        considerSwitch: true,
        riskTolerance: "medium"
      }
    });

    // Remettre le team correct
    if (decision.decision.type === "switch" && decision.decision.switchTo) {
      decision.decision.switchTo = { ...decision.decision.switchTo, team: "opponent" };
    }

    this.log(`   IA choisit: ${decision.decision.type === "attack" ? decision.decision.move?.name : `Switch → ${decision.decision.switchTo?.name}`}`, "detailed");

    return decision.decision;
  }

  /**
   * Analyse tactique complète
   */
  getTacticalAnalysis(state: BattleState): TacticalAnalysis {
    return this.decisionAgent.analyzeTactics(state);
  }

  /**
   * Calcule la probabilité de victoire
   */
  getWinProbability(state: BattleState) {
    return this.decisionAgent.calculateDetailedWinProbability(state);
  }

  /**
   * Analyse la vitesse d'une équipe complète
   */
  analyzeTeamSpeed(team: BattlePokemon[]): TeamSpeedAnalysis {
    const pokemonForSpeed = team.map(p => ({
      name: p.name,
      currentStats: { speed: p.currentStats.speed },
      statStages: { speed: p.statStages.speed },
      statusCondition: p.statusCondition,
      team: p.team
    }));
    
    return this.speedAgent.analyzeTeamSpeed(pokemonForSpeed);
  }

  /**
   * Simule un combat complet (utile pour les tests)
   */
  simulateBattle(
    initialState: BattleState,
    maxTurns: number = 100
  ): BattleSimulationResult {
    const turnHistory: TurnResult[] = [];
    let currentState = { ...initialState };
    let turn = 1;

    this.log(`\n${"═".repeat(60)}`, "minimal");
    this.log(`🏟️ SIMULATION DE COMBAT`, "minimal");
    this.log(`${"═".repeat(60)}`, "minimal");

    while (turn <= maxTurns) {
      currentState.turn = turn;

      // Vérifier les conditions de victoire
      const playerAlive = currentState.playerTeam.filter(p => p.currentHp > 0).length;
      const opponentAlive = currentState.opponentTeam.filter(p => p.currentHp > 0).length;

      if (playerAlive === 0) {
        return {
          winner: "opponent",
          turns: turn,
          turnHistory,
          finalState: currentState
        };
      }
      if (opponentAlive === 0) {
        return {
          winner: "player",
          turns: turn,
          turnHistory,
          finalState: currentState
        };
      }

      // Exécuter le tour du joueur
      const playerTurn = this.executeTurn(currentState);
      turnHistory.push(playerTurn);

      // Note: Dans une simulation réelle, il faudrait appliquer les actions
      // et mettre à jour l'état. Ici on simule juste la prise de décision.

      turn++;
    }

    // Match nul si on atteint le max de tours
    return {
      winner: "player", // Par défaut
      turns: maxTurns,
      turnHistory,
      finalState: currentState
    };
  }

  /**
   * Infère le rôle d'un Pokémon selon ses stats
   */
  private inferRole(pokemon: BattlePokemon): "attacker" | "defender" | "sweeper" | "tank" | "support" {
    const { attack, defense, specialAttack, specialDefense, speed } = pokemon.baseStats;
    const hp = pokemon.baseStats.hp;

    const offensiveTotal = attack + specialAttack;
    const defensiveTotal = defense + specialDefense + hp;
    const isfast = speed > 90;

    if (isfast && offensiveTotal > defensiveTotal) {
      return "sweeper";
    } else if (offensiveTotal > defensiveTotal * 1.2) {
      return "attacker";
    } else if (defensiveTotal > offensiveTotal * 1.3) {
      if (hp > 90) return "tank";
      return "defender";
    }
    return "attacker";
  }

  /**
   * Crée un BattlePokemon à partir de données de base
   */
  static createBattlePokemon(
    name: string,
    types: string[],
    level: number,
    baseStats: { hp: number; attack: number; defense: number; specialAttack: number; specialDefense: number; speed: number },
    moves: MoveForDamage[],
    team: "player" | "opponent"
  ): BattlePokemon {
    // Calculer les stats réelles (formule simplifiée)
    const calculateStat = (base: number, isHp: boolean = false) => {
      if (isHp) {
        return Math.floor((2 * base + 31 + 252/4) * level / 100) + level + 10;
      }
      return Math.floor(((2 * base + 31 + 252/4) * level / 100) + 5);
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
        speed: calculateStat(baseStats.speed)
      },
      statStages: {
        attack: 0,
        defense: 0,
        specialAttack: 0,
        specialDefense: 0,
        speed: 0,
        accuracy: 0,
        evasion: 0
      },
      currentHp: maxHp,
      maxHp,
      moves,
      statusCondition: null,
      team
    };
  }
}
