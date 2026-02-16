/**
 * DamageCalculationAgent
 * 
 * Agent spécialisé dans le calcul précis des dégâts.
 * Utilise DamageCalculatorTool pour:
 * - Calculer les dégâts exacts avec tous les modificateurs
 * - Évaluer les chances de KO
 * - Comparer l'efficacité des moves
 */

import { DamageCalculatorTool, DamageCalculationResult, MoveForDamage, BattlePokemonForDamage } from "../tools/DamageCalculatorTool";

export interface DamageAnalysisRequest {
  attacker: BattlePokemonForDamage;
  defender: BattlePokemonForDamage;
  defenderCurrentHp: number;
  defenderMaxHp: number;
  moves?: MoveForDamage[]; // Si fourni, analyse tous les moves
  specificMove?: MoveForDamage; // Si fourni, analyse un move spécifique
}

export interface DamageAnalysisResult {
  // Résultats principaux
  bestMove?: { move: MoveForDamage; result: DamageCalculationResult };
  allMoveResults?: Map<string, DamageCalculationResult>;
  singleMoveResult?: DamageCalculationResult;
  
  // Analyse
  canKoInOneTurn: boolean;
  turnsToKo: number;
  recommendation: string;
  
  // Logs
  breakdown: string[];
  confidence: number; // 0-100
}

export class DamageCalculationAgent {
  private tool: DamageCalculatorTool;
  private name = "DamageCalculationAgent";

  constructor() {
    this.tool = new DamageCalculatorTool();
  }

  /**
   * Analyse les dégâts pour une situation donnée
   */
  analyze(request: DamageAnalysisRequest): DamageAnalysisResult {
    const breakdown: string[] = [];
    breakdown.push(`\n🔬 ${this.name} - Analyse de dégâts`);
    breakdown.push(`⚔️ ${request.attacker.name} → ${request.defender.name}`);
    breakdown.push(`❤️ HP cible: ${request.defenderCurrentHp}/${request.defenderMaxHp}`);

    let bestMove: { move: MoveForDamage; result: DamageCalculationResult } | undefined;
    let allMoveResults: Map<string, DamageCalculationResult> | undefined;
    let singleMoveResult: DamageCalculationResult | undefined;

    // Analyser un move spécifique
    if (request.specificMove) {
      singleMoveResult = this.tool.calculateDamage(
        request.attacker,
        request.defender,
        request.specificMove,
        request.defenderCurrentHp,
        request.defenderMaxHp,
        { randomRoll: false }
      );
      breakdown.push(`\n📋 Analyse de ${request.specificMove.name}:`);
      breakdown.push(...singleMoveResult.breakdown.map(b => `   ${b}`));
    }

    // Analyser tous les moves
    if (request.moves && request.moves.length > 0) {
      allMoveResults = this.tool.evaluateAllMoves(
        request.attacker,
        request.defender,
        request.moves,
        request.defenderCurrentHp,
        request.defenderMaxHp
      );

      const best = this.tool.findBestDamagingMove(
        request.attacker,
        request.defender,
        request.moves,
        request.defenderCurrentHp,
        request.defenderMaxHp
      );
      bestMove = best || undefined;

      breakdown.push(`\n📊 Comparaison des moves:`);
      
      // Trier par dégâts
      const sortedMoves = Array.from(allMoveResults.entries())
        .sort((a, b) => b[1].damage - a[1].damage);

      sortedMoves.forEach(([moveName, result], index) => {
        const emoji = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : "📌";
        const koStr = result.koChance > 0 ? ` (KO: ${Math.round(result.koChance)}%)` : "";
        breakdown.push(`   ${emoji} ${moveName}: ${result.damage} dmg (${result.damagePercent}%)${koStr}`);
      });
    }

    // Déterminer les métriques clés
    const relevantResult = singleMoveResult || bestMove?.result;
    const canKoInOneTurn = relevantResult ? relevantResult.koChance >= 100 : false;
    const turnsToKo = relevantResult ? relevantResult.turnsToKo : Infinity;

    // Générer une recommandation
    let recommendation = "";
    let confidence = 50;

    if (bestMove) {
      if (bestMove.result.koChance >= 100) {
        recommendation = `Utilisez ${bestMove.move.name} pour un KO garanti!`;
        confidence = 95;
      } else if (bestMove.result.koChance >= 50) {
        recommendation = `${bestMove.move.name} a de bonnes chances de KO (${Math.round(bestMove.result.koChance)}%)`;
        confidence = 75;
      } else if (bestMove.result.effectiveness >= 2) {
        recommendation = `${bestMove.move.name} est super efficace, bon choix`;
        confidence = 70;
      } else {
        recommendation = `${bestMove.move.name} est le meilleur disponible (${bestMove.result.turnsToKo} tours pour KO)`;
        confidence = 60;
      }
    } else if (singleMoveResult) {
      recommendation = `Le move inflige ${singleMoveResult.damagePercent}% de dégâts`;
      confidence = 80;
    } else {
      recommendation = "Aucun move analysable";
      confidence = 10;
    }

    breakdown.push(`\n💡 Recommandation: ${recommendation}`);
    breakdown.push(`📊 Confiance: ${confidence}%`);

    return {
      bestMove,
      allMoveResults,
      singleMoveResult,
      canKoInOneTurn,
      turnsToKo,
      recommendation,
      breakdown,
      confidence
    };
  }

  /**
   * Calcul rapide des dégâts pour un move
   */
  quickCalculate(
    attacker: BattlePokemonForDamage,
    defender: BattlePokemonForDamage,
    move: MoveForDamage,
    defenderCurrentHp: number,
    defenderMaxHp: number
  ): DamageCalculationResult {
    return this.tool.calculateDamage(
      attacker, 
      defender, 
      move, 
      defenderCurrentHp, 
      defenderMaxHp,
      { randomRoll: true }
    );
  }

  /**
   * Simule plusieurs lancers pour obtenir une distribution
   */
  simulateDamageDistribution(
    attacker: BattlePokemonForDamage,
    defender: BattlePokemonForDamage,
    move: MoveForDamage,
    defenderCurrentHp: number,
    defenderMaxHp: number,
    simulations: number = 100
  ): {
    averageDamage: number;
    critRate: number;
    koRate: number;
    minDamage: number;
    maxDamage: number;
  } {
    let totalDamage = 0;
    let critCount = 0;
    let koCount = 0;
    let minDamage = Infinity;
    let maxDamage = -Infinity;

    for (let i = 0; i < simulations; i++) {
      const result = this.tool.calculateDamage(
        attacker,
        defender,
        move,
        defenderCurrentHp,
        defenderMaxHp,
        { randomRoll: true }
      );

      totalDamage += result.damage;
      if (result.isCritical) critCount++;
      if (result.damage >= defenderCurrentHp) koCount++;
      minDamage = Math.min(minDamage, result.damage);
      maxDamage = Math.max(maxDamage, result.damage);
    }

    return {
      averageDamage: Math.round(totalDamage / simulations),
      critRate: Math.round((critCount / simulations) * 100),
      koRate: Math.round((koCount / simulations) * 100),
      minDamage,
      maxDamage
    };
  }
}
