/**
 * Battle System - AI Logic
 * 
 * Decision-making for AI opponents
 */

import type { BattlePokemon, BattleMove, AIDecision } from "./types";

/**
 * Evaluates move effectiveness against opponent
 */
function evaluateMoveScore(
  move: BattleMove,
  attacker: BattlePokemon,
  defender: BattlePokemon
): number {
  let score = 0;

  // Factor 1: Type effectiveness
  let typeMultiplier = 1;
  for (const defenderType of defender.types) {
    typeMultiplier *= calculateDefensiveMultiplier(move.type, [defenderType]);
  }
  score += typeMultiplier * 50;

  // Factor 2: Move power
  score += move.power * 0.5;

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

  return score;
}

/**
 * AI chooses best move based on game state
 */
export function chooseMove(
  attacker: BattlePokemon,
  defender: BattlePokemon
): AIDecision {
  const scores = attacker.moves.map((move, index) => ({
    index,
    move,
    score: evaluateMoveScore(move, attacker, defender)
  }));

  // Sort by score descending
  scores.sort((a, b) => b.score - a.score);

  const best = scores[0];

  return {
    moveIndex: best.index,
    reasoning: `Selected ${best.move.name} (score: ${best.score.toFixed(2)})`
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
