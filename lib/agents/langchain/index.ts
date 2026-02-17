/**
 * LangChain Agents - Module Principal
 * 
 * Export de tous les agents et tools LangChain pour le Pokédex AI.
 * 
 * Architecture:
 * - MasterAgent: Orchestrateur principal avec ChatMistralAI
 *   - TeamBuildingAgent: Expert en construction d'équipes
 *   - BattleAgent: Expert en décisions de combat
 * 
 * Usage:
 * ```typescript
 * import { MasterAgent, createMasterAgent } from '@/lib/agents/langchain';
 * 
 * // Créer un agent
 * const agent = await createMasterAgent();
 * 
 * // Traiter une requête
 * const result = await agent.process({
 *   task: 'team_building',
 *   teamBuildingRequest: {
 *     mode: 'analyze',
 *     currentTeam: [...]
 *   }
 * });
 * ```
 */

// ============================================================================
// MASTER AGENT
// ============================================================================

export { 
  MasterAgent, 
  createMasterAgent,
  type MasterAgentRequest,
  type MasterAgentResponse,
  type AgentTask
} from './MasterAgent';

// ============================================================================
// SUB-AGENTS
// ============================================================================

export { 
  TeamBuildingAgent, 
  createTeamBuildingAgent,
  type TeamBuildingRequest,
  type TeamBuildingResponse,
  type TeamBuildingMode
} from './TeamBuildingAgent';

export { 
  BattleAgent, 
  createBattleAgent,
  type BattleRequest,
  type BattleResponse,
  type BattleState,
  type BattlePokemon,
  type BattleDecision
} from './BattleAgent';

// ============================================================================
// TOOLS
// ============================================================================

export { 
  teamBuildingTools,
  typeAnalysisTool,
  roleClassifierTool,
  synergyTool,
  teamScorerTool,
  pokemonSuggesterTool
} from './teamBuildingTools';

export { 
  battleTools,
  damageCalculatorTool,
  speedComparatorTool,
  statusEffectTool,
  battleDecisionTool,
  winProbabilityTool
} from './battleTools';
