/**
 * Sub-Agents Index
 * 
 * Exports tous les sous-agents utilisés par le MasterAgent.
 */

// Team Building
export { TeamBuildingAgent } from "./TeamBuildingAgent";
export type { 
  TeamBuildingRequest, 
  TeamBuildingResponse,
  TeamBuildingMode,
  TeamSuggestion,
  TeamAnalysis
} from "./TeamBuildingAgent";

export { OurTeamAgent } from "./OurTeamAgent";
export { OpponentTeamAgent } from "./OpponentTeamAgent";
export type { 
  ThreatAnalysis, 
  MatchupAnalysis, 
  OpponentStrategy 
} from "./OpponentTeamAgent";

// Battle
export { BattleAgent } from "./BattleAgent";
export type { 
  BattleRequest, 
  BattleResponse,
  ActionEvaluation
} from "./BattleAgent";
