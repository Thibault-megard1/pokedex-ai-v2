/**
 * Battle Decision Tool
 * 
 * Outil de prise de décision stratégique:
 * - Choix d'attaque optimal
 * - Décision de switch
 * - Anticipation de l'adversaire
 * - Calcul de probabilité de victoire
 */

import { DamageCalculatorTool, DamageCalculationResult, MoveForDamage, BattlePokemonForDamage } from "./DamageCalculatorTool";
import { SpeedComparatorTool, PokemonForSpeed } from "./SpeedComparatorTool";
import { StatusEffectTool, PrimaryStatus } from "./StatusEffectTool";
import { StatModifierTool } from "./StatModifierTool";

export interface BattlePokemon {
  name: string;
  types: string[];
  level: number;
  baseStats: {
    hp: number;
    attack: number;
    defense: number;
    specialAttack: number;
    specialDefense: number;
    speed: number;
  };
  currentStats: {
    attack: number;
    defense: number;
    specialAttack: number;
    specialDefense: number;
    speed: number;
  };
  statStages: {
    attack: number;
    defense: number;
    specialAttack: number;
    specialDefense: number;
    speed: number;
    accuracy: number;
    evasion: number;
  };
  currentHp: number;
  maxHp: number;
  moves: MoveForDamage[];
  statusCondition: PrimaryStatus;
  team: "player" | "opponent";
}

export interface BattleAction {
  type: "attack" | "switch" | "item";
  move?: MoveForDamage;
  switchTo?: BattlePokemon;
  itemId?: string;
}

export interface ActionScore {
  action: BattleAction;
  score: number;
  expectedDamage?: number;
  koChance?: number;
  reasoning: string[];
  breakdown: string[];
}

export interface BattleState {
  playerActive: BattlePokemon;
  opponentActive: BattlePokemon;
  playerTeam: BattlePokemon[];
  opponentTeam: BattlePokemon[];
  turn: number;
  weather?: "sun" | "rain" | "sand" | "hail" | null;
}

export interface WinProbability {
  playerWinChance: number;
  opponentWinChance: number;
  factors: {
    hpAdvantage: number;
    pokemonCountAdvantage: number;
    typeMatchup: number;
    speedAdvantage: number;
    statusAdvantage: number;
  };
  breakdown: string[];
}

export interface SwitchDecision {
  shouldSwitch: boolean;
  bestSwitchTarget?: BattlePokemon;
  reasons: string[];
  risk: number; // 0-100
  breakdown: string[];
}

export interface OpponentPrediction {
  likelyAction: "attack" | "switch" | "setup";
  expectedMove?: string;
  confidence: number;
  reasoning: string[];
}

export class BattleDecisionTool {
  private damageCalc: DamageCalculatorTool;
  private speedComp: SpeedComparatorTool;
  private statusTool: StatusEffectTool;
  private statMod: StatModifierTool;

  constructor() {
    this.damageCalc = new DamageCalculatorTool();
    this.speedComp = new SpeedComparatorTool();
    this.statusTool = new StatusEffectTool();
    this.statMod = new StatModifierTool();
  }

  /**
   * Évalue tous les moves possibles et renvoie un score
   */
  evaluateMoves(
    attacker: BattlePokemon,
    defender: BattlePokemon
  ): ActionScore[] {
    const scores: ActionScore[] = [];

    for (const move of attacker.moves) {
      const action: BattleAction = { type: "attack", move };
      const reasoning: string[] = [];
      const breakdown: string[] = [];
      let score = 0;

      // Calculer les dégâts
      const damageResult = this.damageCalc.calculateDamage(
        this.toBattlePokemonForDamage(attacker),
        this.toBattlePokemonForDamage(defender),
        move,
        defender.currentHp,
        defender.maxHp,
        { randomRoll: false }
      );

      if (move.damageClass === "status") {
        // Évaluer les moves de statut différemment
        score = this.evaluateStatusMove(move, attacker, defender, reasoning, breakdown);
      } else {
        // Score basé sur les dégâts
        score = damageResult.damage * 0.5;
        reasoning.push(`Dégâts: ${damageResult.damage} (${damageResult.damagePercent}%)`);

        // Bonus si KO possible
        if (damageResult.koChance > 0) {
          score += damageResult.koChance * 0.5;
          reasoning.push(`Chance de KO: ${Math.round(damageResult.koChance)}%`);
        }

        // Bonus efficacité de type
        if (damageResult.effectiveness >= 2) {
          score += 30;
          reasoning.push(`Super efficace (x${damageResult.effectiveness})`);
        } else if (damageResult.effectiveness < 1) {
          score -= 20;
          reasoning.push(`Peu efficace (x${damageResult.effectiveness})`);
        }

        // Malus si l'adversaire nous KO avant
        const counterDamage = this.calculateCounterThreat(defender, attacker);
        if (counterDamage.koChance > 50 && damageResult.koChance < 50) {
          const speedResult = this.speedComp.compareSpeed(
            this.toPokemonForSpeed(attacker),
            this.toPokemonForSpeed(defender)
          );
          if (speedResult.firstPokemon.name !== attacker.name) {
            score -= 30;
            reasoning.push(`⚠️ L'adversaire est plus rapide et peut KO`);
          }
        }

        // Prendre en compte la précision
        score *= (move.accuracy / 100);
        reasoning.push(`Précision: ${move.accuracy}%`);
      }

      breakdown.push(`📊 ${move.name}: Score ${Math.round(score)}`);
      breakdown.push(...reasoning.map(r => `   - ${r}`));
      breakdown.push(...damageResult.breakdown.map(b => `   ${b}`));

      scores.push({
        action,
        score: Math.round(score),
        expectedDamage: damageResult.damage,
        koChance: damageResult.koChance,
        reasoning,
        breakdown
      });
    }

    // Trier par score décroissant
    scores.sort((a, b) => b.score - a.score);
    return scores;
  }

  /**
   * Évalue un move de statut (non-damaging)
   */
  private evaluateStatusMove(
    move: MoveForDamage,
    attacker: BattlePokemon,
    defender: BattlePokemon,
    reasoning: string[],
    breakdown: string[]
  ): number {
    let score = 0;
    const moveName = move.name.toLowerCase();

    // Moves de setup (boost)
    if (moveName.includes("swords dance") || moveName.includes("dragon dance") || 
        moveName.includes("calm mind") || moveName.includes("nasty plot")) {
      // Valeur dépend si on peut survivre un tour
      const counterThreat = this.calculateCounterThreat(defender, attacker);
      if (counterThreat.koChance < 50) {
        score = 60;
        reasoning.push("Move de setup sûr");
      } else {
        score = 20;
        reasoning.push("Setup risqué - menace de KO");
      }
    }

    // Moves de status
    if (moveName.includes("thunder wave") || moveName.includes("toxic") || 
        moveName.includes("will-o-wisp") || moveName.includes("sleep powder")) {
      if (defender.statusCondition === null) {
        score = 50;
        reasoning.push("L'adversaire peut recevoir un statut");
      } else {
        score = 0;
        reasoning.push("L'adversaire a déjà un statut");
      }
    }

    // Recovery moves
    if (moveName.includes("recover") || moveName.includes("roost") || 
        moveName.includes("soft-boiled") || moveName.includes("synthesis")) {
      const hpPercent = (attacker.currentHp / attacker.maxHp) * 100;
      if (hpPercent < 50) {
        score = 70;
        reasoning.push(`HP bas (${Math.round(hpPercent)}%) - heal nécessaire`);
      } else {
        score = 20;
        reasoning.push(`HP corrects - heal optionnel`);
      }
    }

    return score;
  }

  /**
   * Évalue si un switch est judicieux
   */
  evaluateSwitch(
    state: BattleState
  ): SwitchDecision {
    const breakdown: string[] = [];
    const reasons: string[] = [];
    let shouldSwitch = false;
    let risk = 0;
    let bestSwitch: BattlePokemon | undefined;
    let bestSwitchScore = -Infinity;

    const current = state.playerActive;
    const opponent = state.opponentActive;

    // Raison 1: Type matchup défavorable
    const currentBestMove = this.evaluateMoves(current, opponent)[0];
    const opponentBestMove = this.evaluateMoves(opponent, current)[0];

    if (currentBestMove && opponentBestMove) {
      const oppKoChance = opponentBestMove.koChance || 0;
      const ourKoChance = currentBestMove.koChance || 0;
      if (oppKoChance > 80 && ourKoChance < 30) {
        shouldSwitch = true;
        reasons.push("Matchup très défavorable - risque de KO");
        breakdown.push(`⚠️ L'adversaire a ${Math.round(oppKoChance)}% de KO, nous seulement ${Math.round(ourKoChance)}%`);
      }
    }

    // Trouver le meilleur switch
    const availableSwitches = state.playerTeam.filter(p => 
      p.name !== current.name && p.currentHp > 0
    );

    for (const candidate of availableSwitches) {
      let switchScore = 0;

      // Évaluer le type matchup du switch
      const candidateMoves = this.evaluateMoves(candidate, opponent);
      const opponentVsCandidate = this.evaluateMoves(opponent, candidate);

      if (candidateMoves[0]) {
        switchScore += candidateMoves[0].score;
      }
      if (opponentVsCandidate[0]) {
        switchScore -= opponentVsCandidate[0].score * 0.5;
      }

      // Bonus si le switch a un avantage de type
      const candidateBestMove = candidateMoves[0];
      if (candidateBestMove && (candidateBestMove.koChance || 0) > (currentBestMove?.koChance || 0)) {
        switchScore += 30;
      }

      breakdown.push(`📋 ${candidate.name}: Switch score ${Math.round(switchScore)}`);

      if (switchScore > bestSwitchScore) {
        bestSwitchScore = switchScore;
        bestSwitch = candidate;
      }
    }

    // Calculer le risque du switch (dégâts pendant le switch)
    if (opponentBestMove) {
      const switchInDamage = this.damageCalc.calculateDamage(
        this.toBattlePokemonForDamage(opponent),
        this.toBattlePokemonForDamage(bestSwitch!),
        opponentBestMove.action.move!,
        bestSwitch?.currentHp || 0,
        bestSwitch?.maxHp || 1,
        { randomRoll: false }
      );
      risk = Math.min(100, switchInDamage.damagePercent);
      breakdown.push(`🎯 Risque de dégâts au switch: ${Math.round(risk)}%`);
    }

    // Décision finale
    if (bestSwitch && bestSwitchScore > (currentBestMove?.score || 0) + 20) {
      shouldSwitch = true;
      reasons.push(`${bestSwitch.name} a un meilleur matchup`);
    }

    return {
      shouldSwitch,
      bestSwitchTarget: bestSwitch,
      reasons,
      risk,
      breakdown
    };
  }

  /**
   * Prédit l'action probable de l'adversaire
   */
  predictOpponentAction(
    state: BattleState
  ): OpponentPrediction {
    const reasoning: string[] = [];
    const opponent = state.opponentActive;
    const player = state.playerActive;

    // Évaluer les options de l'adversaire
    const opponentMoves = this.evaluateMoves(opponent, player);
    const counterThreat = this.calculateCounterThreat(player, opponent);

    // Si l'adversaire peut KO, il va probablement attaquer
    if ((opponentMoves[0]?.koChance || 0) > 70) {
      reasoning.push(`Forte chance de KO avec ${opponentMoves[0].action.move?.name}`);
      return {
        likelyAction: "attack",
        expectedMove: opponentMoves[0].action.move?.name,
        confidence: 85,
        reasoning
      };
    }

    // Si le matchup est défavorable, il pourrait switch
    if (counterThreat.koChance > 60) {
      // L'adversaire risque de se faire KO
      const hasGoodSwitches = state.opponentTeam.filter(p => 
        p.name !== opponent.name && p.currentHp > 0
      ).length > 0;

      if (hasGoodSwitches) {
        reasoning.push(`Matchup défavorable, switch probable`);
        return {
          likelyAction: "switch",
          confidence: 60,
          reasoning
        };
      }
    }

    // Par défaut, attaque avec le meilleur move
    reasoning.push(`Action par défaut: attaque avec ${opponentMoves[0]?.action.move?.name || "move inconnu"}`);
    return {
      likelyAction: "attack",
      expectedMove: opponentMoves[0]?.action.move?.name,
      confidence: 50,
      reasoning
    };
  }

  /**
   * Calcule la probabilité de victoire globale
   */
  calculateWinProbability(state: BattleState): WinProbability {
    const breakdown: string[] = [];
    const factors = {
      hpAdvantage: 0,
      pokemonCountAdvantage: 0,
      typeMatchup: 0,
      speedAdvantage: 0,
      statusAdvantage: 0
    };

    // 1. Avantage en nombre de Pokémon
    const playerAlive = state.playerTeam.filter(p => p.currentHp > 0).length;
    const opponentAlive = state.opponentTeam.filter(p => p.currentHp > 0).length;
    factors.pokemonCountAdvantage = (playerAlive - opponentAlive) * 10;
    breakdown.push(`📊 Pokémon restants: ${playerAlive} vs ${opponentAlive}`);

    // 2. Avantage en HP total
    const playerTotalHp = state.playerTeam.reduce((sum, p) => sum + (p.currentHp / p.maxHp), 0) / state.playerTeam.length;
    const opponentTotalHp = state.opponentTeam.reduce((sum, p) => sum + (p.currentHp / p.maxHp), 0) / state.opponentTeam.length;
    factors.hpAdvantage = (playerTotalHp - opponentTotalHp) * 30;
    breakdown.push(`❤️ HP moyen: ${Math.round(playerTotalHp * 100)}% vs ${Math.round(opponentTotalHp * 100)}%`);

    // 3. Matchup actuel
    const currentMatchup = this.evaluateMoves(state.playerActive, state.opponentActive)[0];
    const opponentMatchup = this.evaluateMoves(state.opponentActive, state.playerActive)[0];
    if (currentMatchup && opponentMatchup) {
      factors.typeMatchup = (currentMatchup.score - opponentMatchup.score) * 0.2;
    }

    // 4. Avantage de vitesse
    const speedResult = this.speedComp.compareSpeed(
      this.toPokemonForSpeed(state.playerActive),
      this.toPokemonForSpeed(state.opponentActive)
    );
    factors.speedAdvantage = speedResult.firstPokemon.team === "player" ? 5 : -5;

    // 5. Avantage de statut
    if (state.opponentActive.statusCondition && !state.playerActive.statusCondition) {
      factors.statusAdvantage = 10;
    } else if (state.playerActive.statusCondition && !state.opponentActive.statusCondition) {
      factors.statusAdvantage = -10;
    }

    // Calculer la probabilité finale
    const totalAdvantage = Object.values(factors).reduce((sum, v) => sum + v, 0);
    const playerWinChance = Math.max(5, Math.min(95, 50 + totalAdvantage));
    const opponentWinChance = 100 - playerWinChance;

    breakdown.push(`\n🎲 Probabilité de victoire: ${Math.round(playerWinChance)}%`);

    return {
      playerWinChance: Math.round(playerWinChance),
      opponentWinChance: Math.round(opponentWinChance),
      factors,
      breakdown
    };
  }

  /**
   * Prend la meilleure décision globale
   */
  makeDecision(state: BattleState): {
    bestAction: BattleAction;
    allOptions: ActionScore[];
    switchAnalysis: SwitchDecision;
    prediction: OpponentPrediction;
    winProbability: WinProbability;
    breakdown: string[];
  } {
    const breakdown: string[] = [];
    breakdown.push(`\n🧠 ANALYSE DE DÉCISION - Tour ${state.turn}`);
    breakdown.push(`⚔️ ${state.playerActive.name} vs ${state.opponentActive.name}`);

    // 1. Évaluer tous les moves
    const moveOptions = this.evaluateMoves(state.playerActive, state.opponentActive);
    breakdown.push(`\n📋 Options d'attaque:`);
    moveOptions.slice(0, 3).forEach((opt, i) => {
      breakdown.push(`   ${i + 1}. ${opt.action.move?.name}: Score ${opt.score}`);
    });

    // 2. Évaluer le switch
    const switchAnalysis = this.evaluateSwitch(state);
    breakdown.push(`\n🔄 Analyse de switch:`);
    breakdown.push(`   Devrait switch: ${switchAnalysis.shouldSwitch ? "Oui" : "Non"}`);
    if (switchAnalysis.bestSwitchTarget) {
      breakdown.push(`   Meilleur switch: ${switchAnalysis.bestSwitchTarget.name}`);
    }

    // 3. Prédire l'adversaire
    const prediction = this.predictOpponentAction(state);
    breakdown.push(`\n🔮 Prédiction adversaire:`);
    breakdown.push(`   Action probable: ${prediction.likelyAction}`);
    if (prediction.expectedMove) {
      breakdown.push(`   Move attendu: ${prediction.expectedMove}`);
    }
    breakdown.push(`   Confiance: ${prediction.confidence}%`);

    // 4. Calculer la probabilité de victoire
    const winProbability = this.calculateWinProbability(state);
    breakdown.push(...winProbability.breakdown);

    // 5. Décision finale
    let bestAction: BattleAction;
    
    if (switchAnalysis.shouldSwitch && switchAnalysis.bestSwitchTarget && switchAnalysis.risk < 60) {
      bestAction = { type: "switch", switchTo: switchAnalysis.bestSwitchTarget };
      breakdown.push(`\n✅ DÉCISION: Switch vers ${switchAnalysis.bestSwitchTarget.name}`);
    } else if (moveOptions.length > 0) {
      bestAction = moveOptions[0].action;
      breakdown.push(`\n✅ DÉCISION: ${moveOptions[0].action.move?.name} (Score: ${moveOptions[0].score})`);
    } else {
      bestAction = { type: "attack", move: state.playerActive.moves[0] };
      breakdown.push(`\n✅ DÉCISION: Défaut - ${state.playerActive.moves[0]?.name}`);
    }

    return {
      bestAction,
      allOptions: moveOptions,
      switchAnalysis,
      prediction,
      winProbability,
      breakdown
    };
  }

  // === UTILITAIRES DE CONVERSION ===

  private toBattlePokemonForDamage(p: BattlePokemon): BattlePokemonForDamage {
    return {
      name: p.name,
      types: p.types,
      level: p.level,
      currentStats: {
        attack: p.currentStats.attack,
        defense: p.currentStats.defense,
        specialAttack: p.currentStats.specialAttack,
        specialDefense: p.currentStats.specialDefense
      },
      statStages: {
        attack: p.statStages.attack,
        defense: p.statStages.defense,
        specialAttack: p.statStages.specialAttack,
        specialDefense: p.statStages.specialDefense
      },
      statusCondition: p.statusCondition
    };
  }

  private toPokemonForSpeed(p: BattlePokemon): PokemonForSpeed {
    return {
      name: p.name,
      currentStats: { speed: p.currentStats.speed },
      statStages: { speed: p.statStages.speed },
      statusCondition: p.statusCondition,
      team: p.team
    };
  }

  private calculateCounterThreat(
    attacker: BattlePokemon,
    defender: BattlePokemon
  ): { koChance: number; bestMove?: MoveForDamage } {
    const moves = this.evaluateMoves(attacker, defender);
    if (moves.length === 0) return { koChance: 0 };
    
    return {
      koChance: moves[0].koChance || 0,
      bestMove: moves[0].action.move
    };
  }
}
