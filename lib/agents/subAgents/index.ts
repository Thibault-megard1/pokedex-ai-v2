/**
 * Sub-Agents Index
 * 
 * Exports des 2 sous-agents principaux utilisés par le MasterAgent:
 * - TeamBuildingAgent: Construction et analyse d'équipes
 * - BattleAgent: Décisions de combat
 */

// Team Building Agent
export { TeamBuildingAgent } from "./TeamBuildingAgent";
export type { 
  TeamBuildingRequest, 
  TeamBuildingResponse,
  TeamBuildingMode,
  TeamSuggestion,
  TeamAnalysis
} from "./TeamBuildingAgent";

// Battle Agent
export { BattleAgent } from "./BattleAgent";
export type { 
  BattleRequest, 
  BattleResponse,
  TurnResult,
  BattleSimulationResult
} from "./BattleAgent";

// Re-export types from Tools for convenience
export type {
  BattleState,
  BattleAction,
  BattlePokemon,
  ActionScore,
  WinProbability,
  SwitchDecision,
  OpponentPrediction
} from "./BattleAgent";
