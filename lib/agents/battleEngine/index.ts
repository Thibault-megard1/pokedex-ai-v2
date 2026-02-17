/**
 * Battle Engine Index
 * 
 * Point d'entrée du moteur de combat.
 * Architecture: MasterAgent → BattleAgent (SubAgent) → Tools
 * 
 * Les Tools sont utilisés directement par BattleAgent.
 */

// Tools (utilisés par BattleAgent)
export * from "./tools";

// Helper pour génération d'équipes
export { EnemyTeamGeneratorAgent } from "./agents/EnemyTeamGeneratorAgent";
export type { 
  TeamGenerationRequest, 
  GeneratedTeamMember,
  PokemonCandidate,
  PlayerPokemonInfo 
} from "./agents/EnemyTeamGeneratorAgent";
