/**
 * LangChain Master Agent
 * 
 * Orchestrateur principal qui utilise ChatMistralAI pour analyser les requêtes
 * et déléguer aux sub-agents appropriés (TeamBuildingAgent, BattleAgent).
 * 
 * Architecture LangChain:
 * MasterAgent (ChatMistralAI)
 *   ├── TeamBuildingAgent (tools: type_analysis, role_classifier, synergy, team_scorer, pokemon_suggester)
 *   └── BattleAgent (tools: damage_calculator, speed_comparator, status_effect, battle_decision, win_probability)
 */

import { ChatMistralAI } from "@langchain/mistralai";
import { tool } from "@langchain/core/tools";
import { AgentExecutor, createToolCallingAgent } from "langchain/agents";
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import { z } from "zod";

import { TeamBuildingAgent, TeamBuildingRequest, TeamBuildingResponse } from "./TeamBuildingAgent";
import { BattleAgent, BattleRequest, BattleResponse } from "./BattleAgent";

// ============================================================================
// TYPES
// ============================================================================

export type AgentTask = "team_building" | "battle" | "analysis" | "unknown";

export interface MasterAgentRequest {
  task?: AgentTask;
  message?: string;
  context?: {
    currentTeam?: any[];
    opponentTeam?: any[];
    battleState?: any;
  };
  teamBuildingRequest?: TeamBuildingRequest;
  battleRequest?: BattleRequest;
}

export interface MasterAgentResponse {
  success: boolean;
  task: AgentTask;
  teamBuildingResponse?: TeamBuildingResponse;
  battleResponse?: BattleResponse;
  reasoning?: string;
  error?: string;
}

// ============================================================================
// SYSTEM PROMPT
// ============================================================================

const MASTER_AGENT_SYSTEM_PROMPT = `Tu es le MasterAgent, un orchestrateur intelligent pour un assistant Pokémon.

Tu as deux sub-agents à ta disposition:
1. team_building_agent: Pour construire, analyser et optimiser des équipes Pokémon
2. battle_agent: Pour prendre des décisions de combat stratégiques

ANALYSE DE REQUÊTE:
- Si la requête concerne la construction/analyse d'équipe → team_building_agent
- Si la requête concerne un combat/stratégie de combat → battle_agent

RÈGLES:
1. Analyse toujours la requête avant de déléguer
2. Utilise le sub-agent approprié
3. Combine les résultats si nécessaire
4. Réponds toujours en français

FORMAT OUTPUT:
{
  "task": "team_building" | "battle",
  "reasoning": "explication de ton choix",
  "delegate_to": "team_building_agent" | "battle_agent"
}`;

// ============================================================================
// MASTER AGENT CLASS
// ============================================================================

export class MasterAgent {
  private model: ChatMistralAI;
  private teamBuildingAgent: TeamBuildingAgent;
  private battleAgent: BattleAgent;
  private agent: AgentExecutor | null = null;
  private tools: any[];

  constructor(options?: { 
    apiKey?: string; 
    model?: string;
    enableReflection?: boolean;
  }) {
    const apiKey = options?.apiKey || process.env.MISTRAL_API_KEY;
    const modelName = options?.model || process.env.MISTRAL_MODEL || "mistral-large-latest";

    if (!apiKey) {
      throw new Error("MISTRAL_API_KEY is required for MasterAgent");
    }

    // Initialiser le modèle Mistral
    this.model = new ChatMistralAI({
      apiKey,
      model: modelName,
      temperature: 0.1,
    });

    // Initialiser les sub-agents
    this.teamBuildingAgent = new TeamBuildingAgent({ apiKey, model: modelName });
    this.battleAgent = new BattleAgent({ apiKey, model: modelName });

    // Créer les tools pour le MasterAgent
    this.tools = this.createMasterTools();
  }

  /**
   * Crée les tools du MasterAgent qui délèguent aux sub-agents
   */
  private createMasterTools() {
    const teamAgent = this.teamBuildingAgent;
    const battleAgent = this.battleAgent;

    // Tool pour le TeamBuildingAgent
    const teamBuildingTool = tool(
      async (input: { mode: string; team: string; opponentTeam?: string; candidatePool?: string }) => {
        try {
          const currentTeam = JSON.parse(input.team);
          const opponentTeam = input.opponentTeam ? JSON.parse(input.opponentTeam) : undefined;
          const candidatePool = input.candidatePool ? JSON.parse(input.candidatePool) : undefined;

          const request: TeamBuildingRequest = {
            mode: input.mode as any,
            currentTeam,
            opponentTeam,
            candidatePool,
          };

          const result = await teamAgent.process(request);
          return JSON.stringify(result);
        } catch (error: any) {
          return JSON.stringify({ error: error.message });
        }
      },
      {
        name: "team_building_agent",
        description: `Délègue une tâche de construction d'équipe au TeamBuildingAgent.
Modes disponibles: "suggest" (suggérer), "analyze" (analyser), "counter" (contrer), "generate" (générer)`,
        schema: z.object({
          mode: z.enum(["suggest", "analyze", "counter", "generate"]).describe("Le mode d'opération"),
          team: z.string().describe("L'équipe actuelle au format JSON"),
          opponentTeam: z.string().optional().describe("L'équipe adverse au format JSON (pour counter)"),
          candidatePool: z.string().optional().describe("Pool de Pokémon candidats au format JSON"),
        }),
      }
    );

    // Tool pour le BattleAgent
    const battleTool = tool(
      async (input: { state: string; mode?: string }) => {
        try {
          const state = JSON.parse(input.state);
          
          const request: BattleRequest = {
            state,
            side: "player",
            mode: (input.mode as any) || "single_decision",
          };

          const result = await battleAgent.process(request);
          return JSON.stringify(result);
        } catch (error: any) {
          return JSON.stringify({ error: error.message });
        }
      },
      {
        name: "battle_agent",
        description: `Délègue une décision de combat au BattleAgent.
Modes: "single_decision" (une décision), "analyze" (analyse complète), "full_battle" (simulation)`,
        schema: z.object({
          state: z.string().describe("L'état du combat au format JSON (myTeam, opponentTeam, etc.)"),
          mode: z.enum(["single_decision", "analyze", "full_battle"]).optional().describe("Le mode d'opération"),
        }),
      }
    );

    return [teamBuildingTool, battleTool];
  }

  /**
   * Initialise l'agent principal
   */
  private async initAgent(): Promise<AgentExecutor> {
    if (this.agent) return this.agent;

    const prompt = ChatPromptTemplate.fromMessages([
      ["system", MASTER_AGENT_SYSTEM_PROMPT],
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
   * Point d'entrée principal - traite une requête
   */
  async process(request: MasterAgentRequest): Promise<MasterAgentResponse> {
    try {
      // Si la tâche est explicite, déléguer directement
      if (request.task === "team_building" && request.teamBuildingRequest) {
        const result = await this.teamBuildingAgent.process(request.teamBuildingRequest);
        return {
          success: result.success,
          task: "team_building",
          teamBuildingResponse: result,
          reasoning: "Tâche team_building explicite",
        };
      }

      if (request.task === "battle" && request.battleRequest) {
        const result = await this.battleAgent.process(request.battleRequest);
        return {
          success: result.success,
          task: "battle",
          battleResponse: result,
          reasoning: "Tâche battle explicite",
        };
      }

      // Sinon, utiliser l'agent pour analyser et router
      const executor = await this.initAgent();
      
      const input = this.buildInput(request);
      
      const result = await executor.invoke({
        input,
        chat_history: [],
      });

      // Parser le résultat
      return this.parseResult(result);

    } catch (error: any) {
      console.error("[MasterAgent] Error:", error);
      return {
        success: false,
        task: "unknown",
        error: error.message,
      };
    }
  }

  /**
   * Construit l'input pour l'agent
   */
  private buildInput(request: MasterAgentRequest): string {
    let input = request.message || "";

    if (request.context?.currentTeam) {
      input += `\n\nÉquipe actuelle: ${JSON.stringify(request.context.currentTeam)}`;
    }

    if (request.context?.opponentTeam) {
      input += `\n\nÉquipe adverse: ${JSON.stringify(request.context.opponentTeam)}`;
    }

    if (request.context?.battleState) {
      input += `\n\nÉtat du combat: ${JSON.stringify(request.context.battleState)}`;
    }

    return input || "Que puis-je faire pour toi?";
  }

  /**
   * Parse le résultat de l'agent
   */
  private parseResult(result: any): MasterAgentResponse {
    try {
      const output = result.output;
      
      // Vérifier si c'est du JSON
      if (typeof output === "string") {
        const jsonMatch = output.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          
          // Si c'est une réponse de sub-agent
          if (parsed.success !== undefined) {
            if (parsed.mode) {
              return {
                success: parsed.success,
                task: "team_building",
                teamBuildingResponse: parsed,
                reasoning: parsed.reasoning,
              };
            }
            if (parsed.decision) {
              return {
                success: parsed.success,
                task: "battle",
                battleResponse: parsed,
                reasoning: parsed.analysis,
              };
            }
          }
        }
      }

      // Réponse générique
      return {
        success: true,
        task: "analysis",
        reasoning: typeof output === "string" ? output : JSON.stringify(output),
      };

    } catch (e) {
      return {
        success: true,
        task: "analysis",
        reasoning: String(result.output),
      };
    }
  }

  /**
   * Accès direct aux sub-agents
   */
  getTeamBuildingAgent(): TeamBuildingAgent {
    return this.teamBuildingAgent;
  }

  getBattleAgent(): BattleAgent {
    return this.battleAgent;
  }

  /**
   * Version simple sans agent - appel direct aux sub-agents
   */
  async handleTeamBuilding(request: TeamBuildingRequest): Promise<TeamBuildingResponse> {
    return await this.teamBuildingAgent.process(request);
  }

  async handleBattle(request: BattleRequest): Promise<BattleResponse> {
    return await this.battleAgent.process(request);
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

/**
 * Crée et configure un MasterAgent
 */
export async function createMasterAgent(options?: {
  apiKey?: string;
  model?: string;
  enableReflection?: boolean;
}): Promise<MasterAgent> {
  return new MasterAgent(options);
}

// ============================================================================
// RE-EXPORTS
// ============================================================================

export { TeamBuildingAgent, BattleAgent };
export { teamBuildingTools } from "./TeamBuildingAgent";
export { battleTools } from "./BattleAgent";
