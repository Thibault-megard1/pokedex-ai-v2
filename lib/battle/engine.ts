/**
 * Battle System - Core Engine
 * 
 * Orchestrates battle turns and determines winner
 */

import type { BattleState, BattleTeam, BattleTurn, BattlePokemon, BattleMove } from "./types";
import { calculateDamage, applyDamage } from "./damage";
import { validateBattle } from "./validation";
import { applyEvolutionPoints } from "./evolution";
import { chooseMove } from "./ai";

/**
 * Initializes a new battle
 */
export function initializeBattle(
  team1: BattleTeam,
  team2: BattleTeam,
  battleId: string = `battle-${Date.now()}`
): BattleState {
  // Validate teams
  const validation = validateBattle(team1, team2);
  if (!validation.valid) {
    throw new Error(`Battle validation failed: ${validation.errors.map(e => e.message).join(", ")}`);
  }

  // Apply evolution points to both teams
  applyEvolutionPoints(team1.pokemon, team1.evolutionPoints);
  applyEvolutionPoints(team2.pokemon, team2.evolutionPoints);

  // Set starting active Pokémon (first in team)
  team1.activeIndex = 0;
  team2.activeIndex = 0;

  return {
    battleId,
    team1,
    team2,
    currentTurn: 0,
    turnHistory: [],
    isFinished: false,
    winner: null
  };
}

/**
 * Gets the next available (non-fainted) Pokémon for a team
 * Returns index or -1 if all fainted
 */
function getNextActivePokemon(team: BattleTeam): number {
  for (let i = 0; i < team.pokemon.length; i++) {
    if (!team.pokemon[i].isFainted) {
      return i;
    }
  }
  return -1;
}

/**
 * Checks if a team has any remaining Pokémon
 */
function hasRemainingPokemon(team: BattleTeam): boolean {
  return team.pokemon.some(p => !p.isFainted);
}

/**
 * Determines turn order based on Speed stat
 * Returns [firstTeam, secondTeam] where firstTeam attacks first
 */
function determineTurnOrder(
  team1: BattleTeam,
  team2: BattleTeam
): [BattleTeam, BattleTeam] {
  const pokemon1 = team1.pokemon[team1.activeIndex];
  const pokemon2 = team2.pokemon[team2.activeIndex];

  if (pokemon1.currentStats.speed >= pokemon2.currentStats.speed) {
    return [team1, team2];
  } else {
    return [team2, team1];
  }
}

/**
 * Executes a single attack
 */
function executeAttack(
  attackerTeam: BattleTeam,
  defenderTeam: BattleTeam,
  move: BattleMove,
  turnNumber: number
): BattleTurn {
  const attacker = attackerTeam.pokemon[attackerTeam.activeIndex];
  const defender = defenderTeam.pokemon[defenderTeam.activeIndex];

  const hpBefore = defender.currentHp;
  
  const damageResult = calculateDamage(attacker, defender, move);
  const actualDamage = applyDamage(defender, damageResult.damage);
  
  const hpAfter = defender.currentHp;
  const fainted = defender.isFainted;

  return {
    turnNumber,
    attacker: {
      teamId: attackerTeam.teamId,
      pokemonIndex: attackerTeam.activeIndex,
      pokemonName: attacker.name,
      move
    },
    defender: {
      teamId: defenderTeam.teamId,
      pokemonIndex: defenderTeam.activeIndex,
      pokemonName: defender.name
    },
    damage: actualDamage,
    effectiveness: damageResult.effectiveness,
    isCritical: damageResult.isCritical,
    hpBefore,
    hpAfter,
    fainted
  };
}

/**
 * Executes a single battle turn
 * Both Pokémon attack (unless one faints)
 */
export function executeTurn(
  state: BattleState,
  team1Move: BattleMove | null = null,
  team2Move: BattleMove | null = null
): BattleState {
  if (state.isFinished) {
    return state;
  }

  const [firstTeam, secondTeam] = determineTurnOrder(state.team1, state.team2);
  
  // Select moves (AI if not provided)
  const firstMove = (firstTeam === state.team1 && team1Move) || 
                    (firstTeam === state.team2 && team2Move) ||
                    firstTeam.pokemon[firstTeam.activeIndex].moves[
                      chooseMove(
                        firstTeam.pokemon[firstTeam.activeIndex],
                        secondTeam.pokemon[secondTeam.activeIndex]
                      ).moveIndex
                    ];

  const secondMove = (secondTeam === state.team1 && team1Move) ||
                     (secondTeam === state.team2 && team2Move) ||
                     secondTeam.pokemon[secondTeam.activeIndex].moves[
                       chooseMove(
                         secondTeam.pokemon[secondTeam.activeIndex],
                         firstTeam.pokemon[firstTeam.activeIndex]
                       ).moveIndex
                     ];

  state.currentTurn++;

  // First attacker
  const turn1 = executeAttack(firstTeam, secondTeam, firstMove, state.currentTurn);
  state.turnHistory.push(turn1);

  // Check if defender fainted
  if (turn1.fainted) {
    const nextIndex = getNextActivePokemon(secondTeam);
    if (nextIndex === -1) {
      // All Pokémon fainted, battle over
      state.isFinished = true;
      state.winner = firstTeam.teamId;
      return state;
    }
    secondTeam.activeIndex = nextIndex;
  }

  // Second attacker (if still alive)
  if (!firstTeam.pokemon[firstTeam.activeIndex].isFainted) {
    const turn2 = executeAttack(secondTeam, firstTeam, secondMove, state.currentTurn);
    state.turnHistory.push(turn2);

    // Check if defender fainted
    if (turn2.fainted) {
      const nextIndex = getNextActivePokemon(firstTeam);
      if (nextIndex === -1) {
        // All Pokémon fainted, battle over
        state.isFinished = true;
        state.winner = secondTeam.teamId;
        return state;
      }
      firstTeam.activeIndex = nextIndex;
    }
  }

  // Check for battle end (shouldn't happen here but safety check)
  if (!hasRemainingPokemon(state.team1)) {
    state.isFinished = true;
    state.winner = state.team2.teamId;
  } else if (!hasRemainingPokemon(state.team2)) {
    state.isFinished = true;
    state.winner = state.team1.teamId;
  }

  return state;
}

/**
 * Runs an entire battle to completion (auto-battle with AI)
 */
export function runFullBattle(state: BattleState, maxTurns: number = 100): BattleState {
  let turnCount = 0;

  while (!state.isFinished && turnCount < maxTurns) {
    executeTurn(state);
    turnCount++;
  }

  // Timeout: Determine winner by remaining HP
  if (!state.isFinished) {
    const team1TotalHp = state.team1.pokemon.reduce((sum, p) => sum + p.currentHp, 0);
    const team2TotalHp = state.team2.pokemon.reduce((sum, p) => sum + p.currentHp, 0);

    state.isFinished = true;
    state.winner = team1TotalHp > team2TotalHp ? state.team1.teamId : state.team2.teamId;
  }

  return state;
}

/**
 * Gets battle summary for display
 */
export function getBattleSummary(state: BattleState): {
  winner: string | null;
  totalTurns: number;
  team1RemainingPokemon: number;
  team2RemainingPokemon: number;
  team1RemainingHp: number;
  team2RemainingHp: number;
} {
  return {
    winner: state.winner,
    totalTurns: state.currentTurn,
    team1RemainingPokemon: state.team1.pokemon.filter(p => !p.isFainted).length,
    team2RemainingPokemon: state.team2.pokemon.filter(p => !p.isFainted).length,
    team1RemainingHp: state.team1.pokemon.reduce((sum, p) => sum + p.currentHp, 0),
    team2RemainingHp: state.team2.pokemon.reduce((sum, p) => sum + p.currentHp, 0)
  };
}
