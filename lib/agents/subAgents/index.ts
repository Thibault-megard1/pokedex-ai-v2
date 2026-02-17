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
  ActionEvaluation
} from "./BattleAgent";
