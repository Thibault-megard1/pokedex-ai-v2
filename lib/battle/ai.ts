/**
 * Battle System - AI Logic
 * 
 * Decision-making for AI opponents
 */

import type { BattlePokemon, BattleMove, AIDecision } from "./types";
import { applyStatStageMultiplier } from "./effects";

/**
 * Evaluates move effectiveness against opponent
 */
function evaluateMoveScore(
  move: BattleMove,
  attacker: BattlePokemon,
  defender: BattlePokemon
): number {
  let score = 0;

  // Skip status moves if already have that status
  if (move.damageClass === "status") {
    if (move.effects) {
      for (const effect of move.effects) {
        if (effect.type === "status" && effect.target === "opponent") {
          if (defender.statusCondition === effect.status) {
            return 0; // Don't use status move if already inflicted
          }
        }
      }
    }
    // Base score for status moves
    score = 40;
  } else {
    // Factor 1: Type effectiveness
    let typeMultiplier = 1;
    for (const defenderType of defender.types) {
      typeMultiplier *= calculateDefensiveMultiplier(move.type, [defenderType]);
    }
    score += typeMultiplier * 50;

    // Factor 2: Move power adjusted by stats
    let effectivePower = move.power;
    
    // Physical moves benefit from Attack stat, Special from Sp. Attack
    if (move.damageClass === "physical") {
      const attackStat = applyStatStageMultiplier(attacker.currentStats.attack, attacker.statStages.attack);
      const defenseStat = applyStatStageMultiplier(defender.currentStats.defense, defender.statStages.defense);
      const statRatio = attackStat / (defenseStat || 1);
      effectivePower *= statRatio * 0.5;
    } else if (move.damageClass === "special") {
      const spAttackStat = applyStatStageMultiplier(attacker.currentStats.specialAttack, attacker.statStages.specialAttack);
      const spDefenseStat = applyStatStageMultiplier(defender.currentStats.specialDefense, defender.statStages.specialDefense);
      const statRatio = spAttackStat / (spDefenseStat || 1);
      effectivePower *= statRatio * 0.5;
    }
    
    score += effectivePower * 0.5;

    // Factor 3: STAB bonus
    if (attacker.types.includes(move.type)) {
      score += 25;
    }

    // Factor 4: Accuracy
    score *= (move.accuracy / 100);

    // Factor 5: Opponent low HP (finish them off)
    const opponentHpPercent = defender.currentHp / defender.maxHp;
    if (opponentHpPercent < 0.3) {
      score *= 1.5;
    }
  }

  // Factor 6: Penalize recently used moves to encourage variety
  if (attacker.lastUsedMoves && attacker.lastUsedMoves.includes(move.name)) {
    const timesUsed = attacker.lastUsedMoves.filter(m => m === move.name).length;
    score *= Math.pow(0.7, timesUsed); // 30% reduction per recent use
  }

  // Factor 7: Bonus for moves with secondary effects
  if (move.effects && move.effects.length > 0) {
    score *= 1.1; // 10% bonus for moves with effects
  }

  return score;
}

/**
 * AI chooses best move based on game state with variety
 */
export function chooseMove(
  attacker: BattlePokemon,
  defender: BattlePokemon
): AIDecision {
  // Initialize move history if not present
  if (!attacker.lastUsedMoves) {
    attacker.lastUsedMoves = [];
  }

  const scores = attacker.moves.map((move, index) => ({
    index,
    move,
    score: evaluateMoveScore(move, attacker, defender)
  }));

  // Sort by score descending
  scores.sort((a, b) => b.score - a.score);

  // Add some randomness: 80% chance to pick best, 20% chance for 2nd best (if exists)
  let selectedMove = scores[0];
  if (scores.length > 1 && Math.random() < 0.2) {
    selectedMove = scores[1];
  }

  // Update move history (keep last 3 moves)
  attacker.lastUsedMoves.push(selectedMove.move.name);
  if (attacker.lastUsedMoves.length > 3) {
    attacker.lastUsedMoves.shift();
  }

  return {
    moveIndex: selectedMove.index,
    reasoning: `Selected ${selectedMove.move.name} (score: ${selectedMove.score.toFixed(2)})`
  };
}

/**
 * AI evaluates if it should switch Pokémon (advanced logic)
 * For now: never switch (always use active Pokémon)
 */
export function shouldSwitch(
  activePokemon: BattlePokemon,
  opponentPokemon: BattlePokemon,
  availablePokemon: BattlePokemon[]
): boolean {
  // Simplified: No switching logic yet
  // Future: Consider type disadvantages, low HP, etc.
  return false;
}

export function calculateDefensiveMultiplier(attackType: string, defenderTypes: string[]): number {
  // Dummy implementation for type multiplier calculation
  // TODO: Replace with real type effectiveness logic
  return defenderTypes.includes(attackType) ? 0.5 : 1;
}
