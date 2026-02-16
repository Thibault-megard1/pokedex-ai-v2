/**
 * SpeedOrderAgent
 * 
 * Agent spécialisé dans l'analyse de l'ordre des tours.
 * Utilise SpeedComparatorTool pour:
 * - Déterminer qui attaque en premier
 * - Analyser l'impact de la paralysie/boosts
 * - Conseiller sur les stratégies de vitesse
 */

import { SpeedComparatorTool, PokemonForSpeed, MoveForSpeed, SpeedComparisonResult, TurnOrderResult } from "../tools/SpeedComparatorTool";

export interface SpeedAnalysisRequest {
  playerPokemon: PokemonForSpeed;
  opponentPokemon: PokemonForSpeed;
  playerMove?: MoveForSpeed;
  opponentMove?: MoveForSpeed;
}

export interface SpeedAnalysisResult {
  // Qui attaque en premier
  firstAttacker: "player" | "opponent";
  firstPokemonName: string;
  
  // Détails
  playerSpeed: number;
  opponentSpeed: number;
  speedDifference: number;
  isPriorityBased: boolean;
  wasTieBreaker: boolean;
  
  // Analyse stratégique
  canOutspeedWithBoost: boolean;
  requiredBoostToOutspeed: number;
  paralysisWouldHelp: boolean;
  
  // Recommandation
  recommendation: string;
  breakdown: string[];
  confidence: number;
}

export interface TeamSpeedAnalysis {
  fastestPokemon: PokemonForSpeed;
  slowestPokemon: PokemonForSpeed;
  averageSpeed: number;
  speedTier: "fast" | "medium" | "slow";
  breakdown: string[];
}

export class SpeedOrderAgent {
  private tool: SpeedComparatorTool;
  private name = "SpeedOrderAgent";

  constructor() {
    this.tool = new SpeedComparatorTool();
  }

  /**
   * Analyse l'ordre des tours entre deux Pokémon
   */
  analyze(request: SpeedAnalysisRequest): SpeedAnalysisResult {
    const breakdown: string[] = [];
    breakdown.push(`\n🏃 ${this.name} - Analyse de vitesse`);
    breakdown.push(`⚔️ ${request.playerPokemon.name} vs ${request.opponentPokemon.name}`);

    // Comparer les vitesses
    const comparison: SpeedComparisonResult = this.tool.compareSpeed(
      request.playerPokemon,
      request.opponentPokemon,
      request.playerMove,
      request.opponentMove
    );

    breakdown.push(...comparison.breakdown);

    // Déterminer qui est le joueur
    const firstAttacker = comparison.firstPokemon.team;
    const playerSpeed = this.tool.calculateEffectiveSpeed(request.playerPokemon).speed;
    const opponentSpeed = this.tool.calculateEffectiveSpeed(request.opponentPokemon).speed;

    // Analyser les possibilités de dépassement
    const outspeedAnalysis = this.tool.canOutspeedWith(
      firstAttacker === "opponent" ? request.playerPokemon : request.opponentPokemon,
      firstAttacker === "opponent" ? request.opponentPokemon : request.playerPokemon,
      { withAgility: true }
    );

    const canOutspeedWithBoost = outspeedAnalysis.canOutspeed;
    const requiredBoostToOutspeed = outspeedAnalysis.requiredBoost;

    // Vérifier si paralysie aiderait
    const paralysisAnalysis = this.tool.canOutspeedWith(
      request.playerPokemon,
      request.opponentPokemon,
      { withParalysis: true }
    );
    const paralysisWouldHelp = paralysisAnalysis.canOutspeed && firstAttacker === "opponent";

    // Générer recommandation
    let recommendation = "";
    let confidence = 70;

    if (firstAttacker === "player") {
      recommendation = `${request.playerPokemon.name} attaque en premier (${playerSpeed} > ${opponentSpeed})`;
      confidence = comparison.wasTieBreaker ? 50 : 90;
    } else {
      recommendation = `${request.opponentPokemon.name} est plus rapide (${opponentSpeed} > ${playerSpeed})`;
      
      if (canOutspeedWithBoost && requiredBoostToOutspeed <= 2) {
        recommendation += `. Un boost +${requiredBoostToOutspeed} pourrait inverser`;
      }
      if (paralysisWouldHelp) {
        recommendation += `. Thunder Wave/Glare pourrait aider`;
      }
      confidence = 85;
    }

    // Vérifier si la priorité a joué
    const isPriorityBased = (request.playerMove?.priority !== request.opponentMove?.priority) &&
      (request.playerMove?.priority !== undefined || request.opponentMove?.priority !== undefined);

    if (isPriorityBased) {
      const highPrioMove = (request.playerMove?.priority || 0) > (request.opponentMove?.priority || 0) 
        ? request.playerMove 
        : request.opponentMove;
      breakdown.push(`⚡ La priorité du move ${highPrioMove?.name} a déterminé l'ordre`);
    }

    breakdown.push(`\n💡 ${recommendation}`);

    return {
      firstAttacker,
      firstPokemonName: comparison.firstPokemon.name,
      playerSpeed,
      opponentSpeed,
      speedDifference: Math.abs(playerSpeed - opponentSpeed),
      isPriorityBased,
      wasTieBreaker: comparison.wasTieBreaker,
      canOutspeedWithBoost,
      requiredBoostToOutspeed,
      paralysisWouldHelp,
      recommendation,
      breakdown,
      confidence
    };
  }

  /**
   * Analyse la vitesse d'une équipe entière
   */
  analyzeTeamSpeed(team: PokemonForSpeed[]): TeamSpeedAnalysis {
    const breakdown: string[] = [];
    breakdown.push(`\n📊 Analyse de vitesse de l'équipe`);

    // Calculer les vitesses effectives
    const speedData = team.map(p => ({
      pokemon: p,
      speed: this.tool.calculateEffectiveSpeed(p).speed
    }));

    // Trier par vitesse
    speedData.sort((a, b) => b.speed - a.speed);

    const fastestPokemon = speedData[0].pokemon;
    const slowestPokemon = speedData[speedData.length - 1].pokemon;
    const averageSpeed = speedData.reduce((sum, d) => sum + d.speed, 0) / speedData.length;

    // Déterminer le tier de vitesse
    let speedTier: "fast" | "medium" | "slow";
    if (averageSpeed >= 100) {
      speedTier = "fast";
    } else if (averageSpeed >= 70) {
      speedTier = "medium";
    } else {
      speedTier = "slow";
    }

    breakdown.push(`🥇 Plus rapide: ${fastestPokemon.name} (${speedData[0].speed})`);
    breakdown.push(`🐢 Plus lent: ${slowestPokemon.name} (${speedData[speedData.length - 1].speed})`);
    breakdown.push(`📈 Vitesse moyenne: ${Math.round(averageSpeed)}`);
    breakdown.push(`🏷️ Catégorie: ${speedTier}`);

    // Détail de chaque Pokémon
    breakdown.push(`\n📋 Détail:`);
    speedData.forEach((d, i) => {
      const statusStr = d.pokemon.statusCondition ? ` [${d.pokemon.statusCondition}]` : "";
      breakdown.push(`   ${i + 1}. ${d.pokemon.name}: ${d.speed}${statusStr}`);
    });

    return {
      fastestPokemon,
      slowestPokemon,
      averageSpeed,
      speedTier,
      breakdown
    };
  }

  /**
   * Trouve le meilleur Pokémon pour outspeed un adversaire
   */
  findBestMatchupForSpeed(
    playerTeam: PokemonForSpeed[],
    opponent: PokemonForSpeed
  ): {
    bestCounter: PokemonForSpeed | null;
    allCanOutspeed: PokemonForSpeed[];
    recommendation: string;
  } {
    const opponentSpeed = this.tool.calculateEffectiveSpeed(opponent).speed;
    const canOutspeed: PokemonForSpeed[] = [];

    playerTeam.forEach(p => {
      const playerSpeed = this.tool.calculateEffectiveSpeed(p).speed;
      if (playerSpeed > opponentSpeed) {
        canOutspeed.push(p);
      }
    });

    // Trier par marge de vitesse (le plus proche mais toujours plus rapide)
    canOutspeed.sort((a, b) => {
      const speedA = this.tool.calculateEffectiveSpeed(a).speed;
      const speedB = this.tool.calculateEffectiveSpeed(b).speed;
      return speedA - speedB; // Le plus proche d'abord (économiser les rapides)
    });

    const bestCounter = canOutspeed.length > 0 ? canOutspeed[0] : null;

    let recommendation: string;
    if (canOutspeed.length === 0) {
      recommendation = `Aucun Pokémon ne peut outspeed ${opponent.name} (${opponentSpeed} speed)`;
    } else if (canOutspeed.length === 1) {
      recommendation = `Seul ${bestCounter!.name} peut outspeed ${opponent.name}`;
    } else {
      recommendation = `${canOutspeed.length} Pokémon peuvent outspeed ${opponent.name}. ${bestCounter!.name} est le choix le plus économique.`;
    }

    return {
      bestCounter,
      allCanOutspeed: canOutspeed,
      recommendation
    };
  }

  /**
   * Prédit l'ordre des tours pour le prochain tour
   */
  predictTurnOrder(
    playerPokemon: PokemonForSpeed,
    opponentPokemon: PokemonForSpeed,
    playerMoveOptions: MoveForSpeed[],
    opponentLikelyMoves: MoveForSpeed[]
  ): {
    predictions: Array<{
      playerMove: MoveForSpeed;
      opponentMove: MoveForSpeed;
      playerFirst: boolean;
      probability: number;
    }>;
    safestPlayerMove: MoveForSpeed | null;
    breakdown: string[];
  } {
    const breakdown: string[] = [];
    const predictions: Array<{
      playerMove: MoveForSpeed;
      opponentMove: MoveForSpeed;
      playerFirst: boolean;
      probability: number;
    }> = [];

    breakdown.push(`\n🔮 Prédiction d'ordre des tours`);

    // Probabilité égale pour chaque move adverse
    const opponentMoveProbability = 1 / opponentLikelyMoves.length;

    playerMoveOptions.forEach(pMove => {
      opponentLikelyMoves.forEach(oMove => {
        const comparison = this.tool.compareSpeed(
          playerPokemon,
          opponentPokemon,
          pMove,
          oMove
        );

        predictions.push({
          playerMove: pMove,
          opponentMove: oMove,
          playerFirst: comparison.firstPokemon.team === "player",
          probability: opponentMoveProbability * 100
        });
      });
    });

    // Trouver le move le plus sûr (celui qui garantit le plus souvent d'aller en premier)
    const playerFirstCount = new Map<string, number>();
    playerMoveOptions.forEach(move => {
      const count = predictions.filter(p => 
        p.playerMove.name === move.name && p.playerFirst
      ).length;
      playerFirstCount.set(move.name, count);
    });

    let safestPlayerMove: MoveForSpeed | null = null;
    let maxFirstCount = 0;
    for (const move of playerMoveOptions) {
      const count = playerFirstCount.get(move.name) || 0;
      if (count > maxFirstCount) {
        maxFirstCount = count;
        safestPlayerMove = move;
      }
    }

    // Summary
    breakdown.push(`📊 Résumé des prédictions:`);
    playerMoveOptions.forEach(move => {
      const firstCount = playerFirstCount.get(move.name) || 0;
      const totalScenarios = opponentLikelyMoves.length;
      const percentage = Math.round((firstCount / totalScenarios) * 100);
      breakdown.push(`   ${move.name}: ${percentage}% chance d'aller en premier`);
    });

    if (safestPlayerMove) {
      breakdown.push(`\n💡 Move le plus sûr: ${(safestPlayerMove as MoveForSpeed).name}`);
    }

    return {
      predictions,
      safestPlayerMove,
      breakdown
    };
  }
}
