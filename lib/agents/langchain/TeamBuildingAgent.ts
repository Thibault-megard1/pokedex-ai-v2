/**
 * LangChain Team Building Agent
 * 
 * Agent spécialisé dans la construction et l'analyse d'équipes Pokémon.
 * Utilise ChatMistralAI avec les tools de team building.
 */

import { ChatMistralAI } from "@langchain/mistralai";
import { AgentExecutor, createToolCallingAgent } from "langchain/agents";
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import { AIMessage, HumanMessage, SystemMessage } from "@langchain/core/messages";
import { 
  teamBuildingTools, 
  typeAnalysisTool, 
  roleClassifierTool, 
  synergyTool, 
  teamScorerTool,
  pokemonSuggesterTool 
} from "./teamBuildingTools";
import { Pokemon } from "../shared/types";

// ============================================================================
// TYPES
// ============================================================================

export type TeamBuildingMode = "suggest" | "analyze" | "counter" | "generate";

export interface TeamBuildingRequest {
  mode: TeamBuildingMode;
  currentTeam: Pokemon[];
  opponentTeam?: Pokemon[];
  theme?: string;
  candidatePool?: Pokemon[];
  question?: string;
}

export interface TeamBuildingResponse {
  success: boolean;
  mode: TeamBuildingMode;
  result: any;
  reasoning: string;
  toolsUsed: string[];
  error?: string;
}

// ============================================================================
// SYSTEM PROMPT
// ============================================================================

const TEAM_BUILDING_SYSTEM_PROMPT = `Tu es un expert Pokémon spécialisé dans la construction d'équipes compétitives.

Tu as accès aux outils suivants:
- type_analysis: Analyse les types d'une équipe (faiblesses, résistances, couverture)
- role_classifier: Classifie les rôles des Pokémon (sweeper, wall, tank, etc.)
- synergy_analysis: Analyse la synergie entre les Pokémon
- team_scorer: Calcule un score global pour l'équipe
- pokemon_suggester: Suggère des Pokémon pour compléter une équipe

RÈGLES:
1. Utilise TOUJOURS les tools pour analyser avant de répondre
2. Base tes recommandations sur les données des tools
3. Explique ton raisonnement clairement
4. Donne des conseils pratiques et actionnables

FORMATS DE RÉPONSE:
- Pour SUGGEST: Utilise pokemon_suggester puis team_scorer
- Pour ANALYZE: Utilise type_analysis, role_classifier, synergy_analysis, team_scorer
- Pour COUNTER: Analyse l'équipe adverse puis suggère des counters
- Pour GENERATE: Génère une équipe équilibrée avec synergy_analysis

Réponds toujours en français.`;

// ============================================================================
// TEAM BUILDING AGENT CLASS
// ============================================================================

export class TeamBuildingAgent {
  private model: ChatMistralAI;
  private agent: AgentExecutor | null = null;
  private tools = teamBuildingTools;

  constructor(options?: { apiKey?: string; model?: string }) {
    const apiKey = options?.apiKey || process.env.MISTRAL_API_KEY;
    const modelName = options?.model || process.env.MISTRAL_MODEL || "mistral-large-latest";

    if (!apiKey) {
      throw new Error("MISTRAL_API_KEY is required for TeamBuildingAgent");
    }

    this.model = new ChatMistralAI({
      apiKey,
      model: modelName,
      temperature: 0.1, // Faible pour des réponses cohérentes
    });
  }

  /**
   * Initialise l'agent avec les tools
   */
  private async initAgent(): Promise<AgentExecutor> {
    if (this.agent) return this.agent;

    const prompt = ChatPromptTemplate.fromMessages([
      ["system", TEAM_BUILDING_SYSTEM_PROMPT],
      new MessagesPlaceholder("chat_history"),
      ["human", "{input}"],
      new MessagesPlaceholder("agent_scratchpad"),
    ]);

    const agent = await createToolCallingAgent({
      llm: this.model,
      tools: this.tools,
      prompt,
    });

    this.agent = new AgentExecutor({
      agent,
      tools: this.tools,
      verbose: process.env.NODE_ENV === "development",
      maxIterations: 5,
    });

    return this.agent;
  }

  /**
   * Traite une requête de team building
   */
  async process(request: TeamBuildingRequest): Promise<TeamBuildingResponse> {
    try {
      const executor = await this.initAgent();
      
      // Construire le prompt selon le mode
      const input = this.buildPrompt(request);
      
      // Exécuter l'agent
      const result = await executor.invoke({
        input,
        chat_history: [],
      });

      // Parser le résultat
      return {
        success: true,
        mode: request.mode,
        result: result.output,
        reasoning: this.extractReasoning(result),
        toolsUsed: this.extractToolsUsed(result),
      };

    } catch (error: any) {
      console.error("[TeamBuildingAgent] Error:", error);
      return {
        success: false,
        mode: request.mode,
        result: null,
        reasoning: "",
        toolsUsed: [],
        error: error.message,
      };
    }
  }

  /**
   * Construit le prompt selon le mode
   */
  private buildPrompt(request: TeamBuildingRequest): string {
    const teamJson = JSON.stringify(request.currentTeam.map(p => ({
      id: p.id,
      name: p.name,
      types: p.types,
      stats: p.stats
    })));

    switch (request.mode) {
      case "suggest":
        const poolJson = request.candidatePool 
          ? JSON.stringify(request.candidatePool.map(p => ({
              id: p.id,
              name: p.name,
              types: p.types,
              stats: p.stats
            })))
          : "[]";
        return `Mon équipe actuelle: ${teamJson}
        
Pool de candidats: ${poolJson}

Suggère-moi les 5 meilleurs Pokémon pour compléter mon équipe. 
Analyse d'abord les types de mon équipe actuelle, puis utilise pokemon_suggester.`;

      case "analyze":
        return `Analyse complète de mon équipe: ${teamJson}

Utilise TOUS les tools d'analyse:
1. type_analysis pour les faiblesses et couverture
2. role_classifier pour les rôles
3. synergy_analysis pour la synergie
4. team_scorer pour le score global

Donne-moi un rapport complet avec des recommandations.`;

      case "counter":
        const oppJson = JSON.stringify(request.opponentTeam || []);
        return `Équipe adverse à counter: ${oppJson}

Mon équipe actuelle: ${teamJson}

Analyse l'équipe adverse et recommande-moi comment la contrer efficacement.`;

      case "generate":
        return `Génère une équipe complète de 6 Pokémon.
${request.theme ? `Thème: ${request.theme}` : ""}

Utilise synergy_analysis et team_scorer pour valider l'équipe générée.`;

      default:
        return request.question || `Analyse cette équipe: ${teamJson}`;
    }
  }

  /**
   * Extrait le raisonnement du résultat
   */
  private extractReasoning(result: any): string {
    if (typeof result.output === "string") {
      return result.output;
    }
    return JSON.stringify(result.output);
  }

  /**
   * Extrait les tools utilisés
   */
  private extractToolsUsed(result: any): string[] {
    const tools: string[] = [];
    if (result.intermediateSteps) {
      for (const step of result.intermediateSteps) {
        if (step.action?.tool) {
          tools.push(step.action.tool);
        }
      }
    }
    return [...new Set(tools)];
  }

  /**
   * Méthodes directes pour appeler les tools
   */
  async analyzeTypes(team: Pokemon[]) {
    return await typeAnalysisTool.invoke({ team });
  }

  async classifyRoles(team: Pokemon[]) {
    return await roleClassifierTool.invoke({ team });
  }

  async analyzeSynergy(team: Pokemon[]) {
    return await synergyTool.invoke({ team });
  }

  async scoreTeam(team: Pokemon[]) {
    return await teamScorerTool.invoke({ team });
  }

  async suggestPokemon(currentTeam: Pokemon[], candidatePool: Pokemon[], count = 5) {
    return await pokemonSuggesterTool.invoke({ currentTeam, candidatePool, count });
  }
}

// ============================================================================
// STANDALONE FUNCTIONS (pour compatibilité)
// ============================================================================

/**
 * Crée et retourne un agent de team building configuré
 */
export async function createTeamBuildingAgent(options?: { 
  apiKey?: string; 
  model?: string 
}): Promise<TeamBuildingAgent> {
  return new TeamBuildingAgent(options);
}

export { teamBuildingTools };
