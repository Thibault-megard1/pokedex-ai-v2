/**
 * Battle Agent
 * 
 * Sous-agent qui gère les décisions de combat.
 * Wrapper autour du BattleOrchestrator existant pour l'intégrer
 * dans l'architecture MasterAgent.
 * 
 * Responsabilités:
 * - Prendre des décisions de combat (attaque, switch)
 * - Analyser l'état du combat
 * - Prédire les actions adverses
 */

import { BattleOrchestrator, TurnResult, OrchestratorConfig } from "../battleEngine/BattleOrchestrator";
import { BattlePokemon, BattleState, BattleAction } from "../battleEngine/tools/BattleDecisionTool";

// ============================================================================
// TYPES
// ============================================================================

export interface BattleRequest {
  battleState: BattleState;
  ourTeam: any[];
  opponentTeam: any[];
  options?: Partial<OrchestratorConfig>;
}

export interface BattleResponse {
  success: boolean;
  action?: BattleAction;
  reasoning?: string;
  confidence?: number;
  turnResult?: TurnResult;
  error?: string;
}

export interface ActionEvaluation {
  action: BattleAction;
  score: number;
  reasoning: string;
  riskLevel: "low" | "medium" | "high";
  expectedOutcome: {
    damageDealt?: number;
    damageReceived?: number;
    koChance?: number;
    statusEffects?: string[];
  };
}

// ============================================================================
// BATTLE AGENT
// ============================================================================

export class BattleAgent {
  private orchestrator: BattleOrchestrator;

  constructor(config?: Partial<OrchestratorConfig>) {
    this.orchestrator = new BattleOrchestrator(config);
  }

  /**
   * Point d'entrée principal
   * Délègue au BattleOrchestrator pour la décision
   */
  async process(request: BattleRequest): Promise<BattleResponse> {
    try {
      // Valider la requête
      if (!request.battleState) {
        return {
          success: false,
          error: "État de combat manquant"
        };
      }

      if (!request.battleState.playerActive || !request.battleState.opponentActive) {
        return {
          success: false,
          error: "Pokémon actifs manquants dans l'état de combat"
        };
      }

      // Appeler l'orchestrateur
      const turnResult = this.orchestrator.executeTurn(request.battleState);

      return {
        success: true,
        action: turnResult.decision,
        reasoning: turnResult.summary,
        confidence: turnResult.confidence,
        turnResult
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Erreur dans BattleAgent"
      };
    }
  }

  /**
   * Évalue toutes les actions possibles et les ordonne par score
   */
  async evaluateAllActions(battleState: BattleState): Promise<ActionEvaluation[]> {
    const evaluations: ActionEvaluation[] = [];
    const playerPokemon = battleState.playerActive;

    if (!playerPokemon) {
      return evaluations;
    }

    // Évaluer chaque move
    if (playerPokemon.moves) {
      for (const move of playerPokemon.moves) {
        // Les moves de dégâts sont toujours disponibles dans cette implémentation
        const evaluation = await this.evaluateMove(battleState, move);
        evaluations.push(evaluation);
      }
    }

    // Évaluer chaque switch possible
    if (battleState.playerTeam) {
      for (let i = 0; i < battleState.playerTeam.length; i++) {
        const pokemon = battleState.playerTeam[i];
        if (pokemon.currentHp > 0 && pokemon.name !== playerPokemon.name) {
          const evaluation = this.evaluateSwitch(battleState, pokemon, i);
          evaluations.push(evaluation);
        }
      }
    }

    // Trier par score décroissant
    return evaluations.sort((a, b) => b.score - a.score);
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
        recommendations: []
      };
    }

    const criticalFactors: string[] = [];
    const recommendations: string[] = [];

    // Analyser les HP
    const playerHpPercent = player.currentHp / player.maxHp;
    const opponentHpPercent = opponent.currentHp / opponent.maxHp;

    let advantageScore = 0;

    if (playerHpPercent > opponentHpPercent + 0.3) {
      advantageScore += 30;
      criticalFactors.push(`Avantage HP (+${Math.round((playerHpPercent - opponentHpPercent) * 100)}%)`);
    } else if (opponentHpPercent > playerHpPercent + 0.3) {
      advantageScore -= 30;
      criticalFactors.push(`Désavantage HP (${Math.round((playerHpPercent - opponentHpPercent) * 100)}%)`);
    }

    // Analyser la vitesse
    const playerSpeed = this.getEffectiveSpeed(player);
    const opponentSpeed = this.getEffectiveSpeed(opponent);

    if (playerSpeed > opponentSpeed) {
      advantageScore += 15;
      criticalFactors.push("Plus rapide que l'adversaire");
    } else {
      advantageScore -= 15;
      criticalFactors.push("Plus lent que l'adversaire");
    }

    // Analyser les boosts
    const playerBoosts = this.sumBoosts(player.statStages || {});
    const opponentBoosts = this.sumBoosts(opponent.statStages || {});

    if (playerBoosts > opponentBoosts + 2) {
      advantageScore += 20;
      criticalFactors.push(`Boosts avantageux (+${playerBoosts - opponentBoosts})`);
    } else if (opponentBoosts > playerBoosts + 2) {
      advantageScore -= 20;
      criticalFactors.push(`Boosts désavantageux (${playerBoosts - opponentBoosts})`);
    }

    // Recommandations
    if (playerHpPercent < 0.3 && battleState.playerTeam && battleState.playerTeam.length > 1) {
      recommendations.push("Considérez un switch pour préserver ce Pokémon");
    }

    if (playerBoosts >= 2) {
      recommendations.push("Profitez de vos boosts pour attaquer agressivement");
    }

    if (opponentHpPercent < 0.25) {
      recommendations.push("L'adversaire est faible - finissez-le!");
    }

    // Déterminer l'avantage et le momentum
    let advantage: "player" | "opponent" | "even" = "even";
    if (advantageScore > 25) advantage = "player";
    else if (advantageScore < -25) advantage = "opponent";

    let momentum: "player" | "opponent" | "neutral" = "neutral";
    if (playerBoosts > opponentBoosts && playerHpPercent > 0.5) momentum = "player";
    else if (opponentBoosts > playerBoosts || opponentHpPercent > playerHpPercent + 0.2) momentum = "opponent";

    return {
      advantage,
      momentum,
      criticalFactors,
      recommendations
    };
  }

  /**
   * Prédit l'action probable de l'adversaire
   */
  predictOpponentAction(battleState: BattleState): {
    likelyAction: "attack" | "switch" | "setup";
    confidence: number;
    reasoning: string;
  } {
    const opponent = battleState.opponentActive;
    const player = battleState.playerActive;

    if (!opponent || !player) {
      return {
        likelyAction: "attack",
        confidence: 0.3,
        reasoning: "Données insuffisantes"
      };
    }

    const opponentHpPercent = opponent.currentHp / opponent.maxHp;
    const playerHpPercent = player.currentHp / player.maxHp;

    // HP bas → probablement switch
    if (opponentHpPercent < 0.25 && battleState.opponentTeam && battleState.opponentTeam.length > 1) {
      return {
        likelyAction: "switch",
        confidence: 0.7,
        reasoning: "HP faible, l'adversaire va probablement switcher"
      };
    }

    // Notre Pokémon faible → attaque pour KO
    if (playerHpPercent < 0.3) {
      return {
        likelyAction: "attack",
        confidence: 0.85,
        reasoning: "Notre Pokémon est faible, l'adversaire va attaquer pour le KO"
      };
    }

    // Début de combat → possible setup
    if (opponentHpPercent > 0.9 && playerHpPercent > 0.9) {
      return {
        likelyAction: "setup",
        confidence: 0.5,
        reasoning: "Début de combat, possible setup"
      };
    }

    // Par défaut: attaque
    return {
      likelyAction: "attack",
      confidence: 0.6,
      reasoning: "L'adversaire va probablement attaquer"
    };
  }

  // ============================================================================
  // MÉTHODES PRIVÉES
  // ============================================================================

  /**
   * Évalue un move spécifique
   */
  private async evaluateMove(
    battleState: BattleState,
    move: BattlePokemon["moves"][0]
  ): Promise<ActionEvaluation> {
    const player = battleState.playerActive!;
    const opponent = battleState.opponentActive!;

    // Calcul simplifié du score
    let score = 50;
    let riskLevel: ActionEvaluation["riskLevel"] = "medium";
    const reasons: string[] = [];

    // Bonus pour moves STAB
    if (player.types?.includes(move.type)) {
      score += 15;
      reasons.push("STAB");
    }

    // Bonus pour super efficace (simplifié)
    if (this.isSuperEffective(move.type, opponent.types || [])) {
      score += 30;
      reasons.push("Super efficace");
    }

    // Bonus pour puissance élevée
    if (move.power > 100) {
      score += 20;
      reasons.push("High power");
    } else if (move.power > 80) {
      score += 10;
    }

    // Pénalité pour faible précision
    if (move.accuracy < 100 && move.accuracy > 0) {
      score -= (100 - move.accuracy) / 2;
      if (move.accuracy < 80) riskLevel = "high";
      reasons.push(`${move.accuracy}% accuracy`);
    }

    // Si ça peut KO, gros bonus
    const estimatedDamage = this.estimateDamage(player, opponent, move);
    if (estimatedDamage >= opponent.currentHp) {
      score += 40;
      reasons.push("Potentiel KO");
      riskLevel = "low";
    }

    return {
      action: { type: "attack", move: move },
      score: Math.max(0, Math.min(100, score)),
      reasoning: reasons.join(", ") || "Attaque standard",
      riskLevel,
      expectedOutcome: {
        damageDealt: estimatedDamage,
        koChance: estimatedDamage >= opponent.currentHp ? 1 : estimatedDamage / opponent.currentHp
      }
    };
  }

  /**
   * Évalue un switch
   */
  private evaluateSwitch(
    battleState: BattleState,
    targetPokemon: BattlePokemon,
    teamIndex: number
  ): ActionEvaluation {
    const opponent = battleState.opponentActive!;
    let score = 30; // Base pour switch (généralement moins bon qu'attaquer)
    let riskLevel: ActionEvaluation["riskLevel"] = "medium";
    const reasons: string[] = [];

    // Bonus si le switch résiste au type adverse
    if (opponent.types) {
      const resistances = this.countResistances(targetPokemon.types || [], opponent.types);
      if (resistances > 0) {
        score += resistances * 15;
        reasons.push(`Résiste à ${resistances} type(s)`);
        riskLevel = "low";
      }
    }

    // Bonus si le switch est super efficace
    if (targetPokemon.types && opponent.types) {
      for (const type of targetPokemon.types) {
        if (this.isSuperEffective(type, opponent.types)) {
          score += 20;
          reasons.push("Peut attaquer super efficacement");
          break;
        }
      }
    }

    // Pénalité si notre Pokémon actuel va bien
    const currentHp = battleState.playerActive!.currentHp / battleState.playerActive!.maxHp;
    if (currentHp > 0.7) {
      score -= 15;
      reasons.push("Notre Pokémon actuel va bien");
    }

    // Bonus si notre Pokémon actuel est en danger
    if (currentHp < 0.3) {
      score += 25;
      riskLevel = "high";
      reasons.push("Notre Pokémon est faible");
    }

    return {
      action: { type: "switch", switchTo: targetPokemon },
      score: Math.max(0, Math.min(100, score)),
      reasoning: reasons.join(", ") || "Switch tactique",
      riskLevel,
      expectedOutcome: {}
    };
  }

  /**
   * Calcule la vitesse effective
   */
  private getEffectiveSpeed(pokemon: BattlePokemon): number {
    let speed = pokemon.currentStats?.speed || 50;
    
    const stages = pokemon.statStages?.speed || 0;
    const multipliers = [2/8, 2/7, 2/6, 2/5, 2/4, 2/3, 2/2, 3/2, 4/2, 5/2, 6/2, 7/2, 8/2];
    speed = Math.floor(speed * multipliers[stages + 6]);

    // Paralysie divise la vitesse par 2
    if (pokemon.statusCondition === "paralysis") {
      speed = Math.floor(speed / 2);
    }

    return speed;
  }

  /**
   * Somme les boosts d'un Pokémon
   */
  private sumBoosts(statStages: Record<string, number>): number {
    return Object.values(statStages).reduce((sum, val) => sum + Math.max(0, val), 0);
  }

  /**
   * Vérifie si un type est super efficace
   */
  private isSuperEffective(attackType: string, defenderTypes: string[]): boolean {
    const effectiveness: Record<string, string[]> = {
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

    const targets = effectiveness[attackType.toLowerCase()] || [];
    return defenderTypes.some(t => targets.includes(t.toLowerCase()));
  }

  /**
   * Compte les résistances
   */
  private countResistances(defenderTypes: string[], attackerTypes: string[]): number {
    // Simplifié - dans un vrai cas, utiliser le TypeEffectivenessTool
    let count = 0;
    // Approximation basique
    return count;
  }

  /**
   * Estime les dégâts (simplifié)
   */
  private estimateDamage(
    attacker: BattlePokemon,
    defender: BattlePokemon,
    move: BattlePokemon["moves"][0]
  ): number {
    // Formule simplifiée
    const attackStat = move.damageClass === "physical" 
      ? (attacker.currentStats?.attack || 100)
      : (attacker.currentStats?.specialAttack || 100);
    
    const defenseStat = move.damageClass === "physical"
      ? (defender.currentStats?.defense || 100)
      : (defender.currentStats?.specialDefense || 100);

    const power = move.power || 50;
    const level = 50; // Approximation

    let damage = Math.floor((((2 * level / 5 + 2) * power * attackStat / defenseStat) / 50) + 2);

    // STAB
    if (attacker.types?.includes(move.type)) {
      damage = Math.floor(damage * 1.5);
    }

    // Type effectiveness (simplifié)
    if (this.isSuperEffective(move.type, defender.types || [])) {
      damage = Math.floor(damage * 2);
    }

    return damage;
  }

  // ============================================================================
  // COMBAT 6v6 AUTOMATIQUE
  // ============================================================================

  /**
   * Simule un combat complet 6v6 de manière automatique
   * Les deux équipes s'affrontent jusqu'à ce qu'une soit éliminée
   */
  simulateFullBattle(
    battleState: BattleState,
    options?: { maxTurns?: number }
  ): {
    winner: "player" | "opponent";
    turns: number;
    turnHistory: TurnResult[];
    finalState: BattleState;
  } {
    return this.orchestrator.simulateBattle(battleState, options?.maxTurns ?? 100);
  }

  /**
   * Alias pour combat automatique (plus explicite)
   */
  autoBattle(
    playerTeam: BattlePokemon[],
    opponentTeam: BattlePokemon[],
    options?: { maxTurns?: number }
  ): {
    winner: "player" | "opponent";
    turns: number;
    turnHistory: TurnResult[];
    summary: string;
  } {
    // Créer l'état initial
    const initialState: BattleState = {
      playerActive: playerTeam[0],
      opponentActive: opponentTeam[0],
      playerTeam: playerTeam,
      opponentTeam: opponentTeam,
      turn: 1,
      weather: null
    };

    const result = this.orchestrator.simulateBattle(initialState, options?.maxTurns ?? 100);

    return {
      winner: result.winner,
      turns: result.turns,
      turnHistory: result.turnHistory,
      summary: `Combat terminé en ${result.turns} tours. Vainqueur: ${result.winner === "player" ? "Joueur" : "Adversaire"}`
    };
  }

  // ============================================================================
  // ACCÈS À L'ORCHESTRATEUR
  // ============================================================================

  getOrchestrator(): BattleOrchestrator {
    return this.orchestrator;
  }
}

export default BattleAgent;
