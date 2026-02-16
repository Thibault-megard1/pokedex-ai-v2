/**
 * Moteur de combat (coeur).
 * Cette section n'utilise pas d'intelligence artificielle.
 * Entree: equipes + moves. Sortie: etat de combat et historique.
 * Liens cours IA: agent-like behavior (decision) via module AI externe.
 */

import type { BattleState, BattleTeam, BattleTurn, BattlePokemon, BattleMove } from "./types";
import { calculateDamage, applyDamage } from "./damage";
import { validateBattle } from "./validation";
import { applyEvolutionPoints } from "./evolution";
import { chooseMove } from "./ai";
import { 
  initializeStatStages, 
  applyMoveEffects, 
  MOVE_EFFECTS_DATABASE,
  type EffectLog 
} from "./effects";

/**
 * Initialise un combat.
 * Cette fonction n'utilise pas d'intelligence artificielle.
 * Processus: validation, evolution, init des stats et etats.
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

  // Initialize stat stages, status, and move history for all Pokémon
  for (const pokemon of [...team1.pokemon, ...team2.pokemon]) {
    if (!pokemon.statStages) {
      pokemon.statStages = initializeStatStages();
    }
    if (pokemon.statusCondition === undefined) {
      pokemon.statusCondition = null;
    }
    if (!pokemon.lastUsedMoves) {
      pokemon.lastUsedMoves = [];
    }
  }

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
 * Donne le prochain Pokemon non KO.
 * Cette fonction n'utilise pas d'intelligence artificielle.
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
 * Verifie si une equipe a encore des Pokemon actifs.
 * Cette fonction n'utilise pas d'intelligence artificielle.
 */
function hasRemainingPokemon(team: BattleTeam): boolean {
  return team.pokemon.some(p => !p.isFainted);
}

/**
 * Determine l'ordre des attaques selon la vitesse.
 * Cette fonction n'utilise pas d'intelligence artificielle.
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
 * Execute une attaque et applique les effets.
 * Cette fonction n'utilise pas d'intelligence artificielle.
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
  
  // Calculate and apply damage
  const damageResult = calculateDamage(attacker, defender, move);
  const actualDamage = applyDamage(defender, damageResult.damage);
  
  // Add move effects from database if available
  if (!move.effects && MOVE_EFFECTS_DATABASE[move.name]) {
    move.effects = MOVE_EFFECTS_DATABASE[move.name];
  }
  
  // Apply move effects (recoil, drain, stat changes, etc.)
  const effectLogs = applyMoveEffects(attacker, defender, move, actualDamage);
  
  const hpAfter = defender.currentHp;
  const fainted = defender.isFainted;

  // Create turn record with effect logs
  const turn: BattleTurn & { effectLogs?: EffectLog[] } = {
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
    fainted,
    effectLogs: effectLogs.length > 0 ? effectLogs : undefined
  };

  return turn as BattleTurn;
}

/**
 * Execute un tour complet.
 * Cette fonction n'utilise pas d'intelligence artificielle generative.
 * L'IA rule-based est utilisee via chooseMove (module AI).
 */
export function executeTurn(
  state: BattleState,
  team1Move: BattleMove | null = null,
  team2Move: BattleMove | null = null
): BattleState {
  if (state.isFinished) {
    return state;
  }

  // SANITY CHECK: Ensure active Pokemon are not fainted
  const team1Active = state.team1.pokemon[state.team1.activeIndex];
  const team2Active = state.team2.pokemon[state.team2.activeIndex];
  
  if (team1Active.isFainted || team1Active.currentHp <= 0) {
    console.error("CRITICAL: Team 1 active Pokemon is fainted!", team1Active.name);
    const nextIndex = getNextActivePokemon(state.team1);
    if (nextIndex === -1) {
      state.isFinished = true;
      state.winner = state.team2.teamId;
      return state;
    }
    state.team1.activeIndex = nextIndex;
  }
  
  if (team2Active.isFainted || team2Active.currentHp <= 0) {
    console.error("CRITICAL: Team 2 active Pokemon is fainted!", team2Active.name);
    const nextIndex = getNextActivePokemon(state.team2);
    if (nextIndex === -1) {
      state.isFinished = true;
      state.winner = state.team1.teamId;
      return state;
    }
    state.team2.activeIndex = nextIndex;
  }

  const [firstTeam, secondTeam] = determineTurnOrder(state.team1, state.team2);
  
  // Double-check that active Pokemon can act
  const firstAttacker = firstTeam.pokemon[firstTeam.activeIndex];
  const secondAttacker = secondTeam.pokemon[secondTeam.activeIndex];
  
  if (firstAttacker.isFainted || firstAttacker.currentHp <= 0) {
    console.error("First attacker is fainted, ending turn");
    return state;
  }
  
  if (secondAttacker.isFainted || secondAttacker.currentHp <= 0) {
    console.error("Second attacker is fainted, ending turn");
    return state;
  }
  
  // Select moves (AI if not provided)
  const firstMove = (firstTeam === state.team1 && team1Move) || 
                    (firstTeam === state.team2 && team2Move) ||
                    firstAttacker.moves[
                      chooseMove(
                        firstAttacker,
                        secondAttacker
                      ).moveIndex
                    ];

  const secondMove = (secondTeam === state.team1 && team1Move) ||
                     (secondTeam === state.team2 && team2Move) ||
                     secondAttacker.moves[
                       chooseMove(
                         secondAttacker,
                         firstAttacker
                       ).moveIndex
                     ];

  state.currentTurn++;

  // First attacker
  const turn1 = executeAttack(firstTeam, secondTeam, firstMove, state.currentTurn);
  state.turnHistory.push(turn1);

  // IMMEDIATE faint check and switching
  const defenderAfterTurn1 = secondTeam.pokemon[secondTeam.activeIndex];
  if (defenderAfterTurn1.currentHp <= 0 && !defenderAfterTurn1.isFainted) {
    defenderAfterTurn1.isFainted = true;
  }
  
  if (turn1.fainted || defenderAfterTurn1.isFainted) {
    const nextIndex = getNextActivePokemon(secondTeam);
    if (nextIndex === -1) {
      // All Pokémon fainted, battle over
      state.isFinished = true;
      state.winner = firstTeam.teamId;
      return state;
    }
    secondTeam.activeIndex = nextIndex;
  }

  // Second attacker (only if first attacker is still alive)
  const firstAttackerAfterTurn1 = firstTeam.pokemon[firstTeam.activeIndex];
  if (!firstAttackerAfterTurn1.isFainted && firstAttackerAfterTurn1.currentHp > 0) {
    const turn2 = executeAttack(secondTeam, firstTeam, secondMove, state.currentTurn);
    state.turnHistory.push(turn2);

    // IMMEDIATE faint check and switching
    const defenderAfterTurn2 = firstTeam.pokemon[firstTeam.activeIndex];
    if (defenderAfterTurn2.currentHp <= 0 && !defenderAfterTurn2.isFainted) {
      defenderAfterTurn2.isFainted = true;
    }
    
    if (turn2.fainted || defenderAfterTurn2.isFainted) {
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
