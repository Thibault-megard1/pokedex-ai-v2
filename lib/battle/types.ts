/**
 * Battle System - Type Definitions
 * 
 * Deterministic 6v6 Pokémon battle system with evolution points
 */

// ============================================================================
// POKEMON & STATS
// ============================================================================

export interface BattlePokemonStats {
  hp: number;
  attack: number;
  defense: number;
  specialAttack: number;
  specialDefense: number;
  speed: number;
}

export interface BattleMove {
  name: string;
  type: string;
  power: number;
  damageClass: "physical" | "special" | "status";
  accuracy: number;
}

export interface BattlePokemon {
  id: number;
  name: string;
  types: string[];
  baseStats: BattlePokemonStats;
  currentStats: BattlePokemonStats;
  moves: BattleMove[];
  currentHp: number;
  maxHp: number;
  evolutionStage: number; // 0 = base, 1 = stage 1, 2 = stage 2
  evolutionChain: string[]; // ["bulbasaur", "ivysaur", "venusaur"]
  isFainted: boolean;
}

// ============================================================================
// TEAM & EVOLUTION POINTS
// ============================================================================

export interface EvolutionAllocation {
  pokemonIndex: number; // 0-5
  points: number; // Evolution points allocated
}

export interface BattleTeam {
  teamId: string;
  name: string;
  pokemon: BattlePokemon[]; // Exactly 6
  evolutionPoints: EvolutionAllocation[];
  totalEvolutionPointsUsed: number; // Must be ≤ 6
  activeIndex: number; // Current active Pokémon (0-5)
}

// ============================================================================
// BATTLE STATE
// ============================================================================

export interface BattleTurn {
  turnNumber: number;
  attacker: {
    teamId: string;
    pokemonIndex: number;
    pokemonName: string;
    move: BattleMove;
  };
  defender: {
    teamId: string;
    pokemonIndex: number;
    pokemonName: string;
  };
  damage: number;
  effectiveness: number; // 0, 0.5, 1, 2, 4
  isCritical: boolean;
  hpBefore: number;
  hpAfter: number;
  fainted: boolean;
}

export interface BattleState {
  battleId: string;
  team1: BattleTeam;
  team2: BattleTeam;
  currentTurn: number;
  turnHistory: BattleTurn[];
  isFinished: boolean;
  winner: string | null; // teamId or null
}

// ============================================================================
// VALIDATION RESULTS
// ============================================================================

export interface ValidationError {
  field: string;
  message: string;
}

export interface TeamValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

// ============================================================================
// AI DECISION
// ============================================================================

export interface AIDecision {
  moveIndex: number; // Which move to use (0-3)
  reasoning: string; // Debug info
}
