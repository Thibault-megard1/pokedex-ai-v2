/**
 * Master Agent - Multi-Agent Principal
 * 
 * Orchestrateur intelligent qui utilise Ollama ou Mistral pour la réflexion
 * et décide quel sous-agent utiliser selon le contexte.
 * 
 * Architecture:
 * - MasterAgent (réflexion LLM)
 *   ├── TeamBuildingAgent (génération d'équipes)
 *   │   ├── OurTeamAgent (optimisation de notre équipe)
 *   │   └── OpponentTeamAgent (analyse/génération équipe adverse)
 *   └── BattleAgent (décisions de combat)
 */

import { OllamaClient } from "@/lib/llm/ollama";
import { MistralClient } from "@/lib/llm/mistral-client";
import { 
  TeamBuildingAgent, 
  TeamBuildingRequest, 
  TeamBuildingResponse 
} from "./subAgents";
import { 
  BattleAgent, 
  BattleRequest, 
  BattleResponse 
} from "./subAgents";

// Type pour un client LLM générique (Ollama ou Mistral)
type LLMClient = OllamaClient | MistralClient;

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
  // Specific sub-agent data
  teamBuildingRequest?: TeamBuildingRequest;
  battleRequest?: BattleRequest;
}

export interface ReflectionResult {
  task: AgentTask;
  reasoning: string;
  confidence: number;
  suggestedActions: string[];
}

export interface MasterAgentResponse {
  success: boolean;
  task: AgentTask;
  reflection?: ReflectionResult;
  teamBuildingResponse?: TeamBuildingResponse;
  battleResponse?: BattleResponse;
  error?: string;
}

// ============================================================================
// MASTER AGENT
// ============================================================================

export class MasterAgent {
  private llmClient: LLMClient;
  private teamBuildingAgent: TeamBuildingAgent;
  private battleAgent: BattleAgent;
  private reflectionEnabled: boolean;

  constructor(options: { 
    enableReflection?: boolean;
    llmClient?: LLMClient;
  } = {}) {
    // Utiliser le client fourni ou créer un selon la config
    this.llmClient = options.llmClient || this.createDefaultLLMClient();
    this.teamBuildingAgent = new TeamBuildingAgent();
    this.battleAgent = new BattleAgent();
    this.reflectionEnabled = options.enableReflection ?? true;
  }

  /**
   * Crée un client LLM par défaut selon la variable d'environnement
   */
  private createDefaultLLMClient(): LLMClient {
    const provider = process.env.LLM_PROVIDER || "ollama";
    
    if (provider === "mistral") {
      const apiKey = process.env.MISTRAL_API_KEY;
      const model = process.env.MISTRAL_MODEL;
      
      if (!apiKey) {
        console.warn("[MasterAgent] MISTRAL_API_KEY not found, falling back to Ollama");
        return new OllamaClient();
      }
      
      return new MistralClient(apiKey, model);
    }
    
    // Par défaut: Ollama
    return new OllamaClient(
      process.env.OLLAMA_BASE_URL,
      process.env.OLLAMA_MODEL
    );
  }

  /**
   * Point d'entrée principal
   * Analyse la requête, réfléchit via LLM, et délègue au bon sous-agent
   */
  async process(request: MasterAgentRequest): Promise<MasterAgentResponse> {
    try {
      // 1. Déterminer la tâche (si pas explicite, utiliser LLM pour réfléchir)
      let task = request.task;
      let reflection: ReflectionResult | undefined;

      if (!task || task === "unknown") {
        if (this.reflectionEnabled) {
          reflection = await this.reflect(request);
          task = reflection.task;
        } else {
          task = this.inferTask(request);
        }
      }

      // 2. Déléguer au sous-agent approprié
      switch (task) {
        case "team_building":
          return await this.handleTeamBuilding(request, reflection);
        
        case "battle":
          return await this.handleBattle(request, reflection);
        
        case "analysis":
          return await this.handleAnalysis(request, reflection);
        
        default:
          return {
            success: false,
            task: "unknown",
            reflection,
            error: "Impossible de déterminer la tâche à effectuer"
          };
      }
    } catch (error: any) {
      return {
        success: false,
        task: request.task || "unknown",
        error: error.message || "Erreur inconnue"
      };
    }
  }

  /**
   * Réflexion via LLM (Ollama ou Mistral)
   * Analyse le contexte et détermine quelle tâche effectuer
   */
  private async reflect(request: MasterAgentRequest): Promise<ReflectionResult> {
    const systemPrompt = `Tu es MasterAgent, un orchestrateur intelligent pour une application Pokémon.
Ton rôle est d'analyser les requêtes et de déterminer quelle tâche effectuer:
- "team_building": construction/analyse/suggestion d'équipe
- "battle": décisions de combat, switch, attaques
- "analysis": analyse pure sans action

Réponds en JSON:
{
  "task": "team_building" | "battle" | "analysis",
  "reasoning": "Explication courte de ton choix",
  "confidence": 0.0-1.0,
  "suggestedActions": ["action1", "action2"]
}`;

    const userMessage = this.buildReflectionPrompt(request);

    try {
      const response = await this.llmClient.chat(
        [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage }
        ],
        { temperature: 0.1, jsonMode: true }
      );

      const parsed = JSON.parse(response.content);
      return {
        task: parsed.task || "unknown",
        reasoning: parsed.reasoning || "",
        confidence: parsed.confidence || 0.5,
        suggestedActions: parsed.suggestedActions || []
      };
    } catch (error) {
      // Fallback si LLM échoue
      console.warn("[MasterAgent] Reflection failed, using inference fallback");
      return {
        task: this.inferTask(request),
        reasoning: "Inférence locale (LLM indisponible)",
        confidence: 0.7,
        suggestedActions: []
      };
    }
  }

  /**
   * Construit le prompt pour la réflexion
   */
  private buildReflectionPrompt(request: MasterAgentRequest): string {
    const parts: string[] = [];

    if (request.message) {
      parts.push(`Message utilisateur: "${request.message}"`);
    }

    if (request.context?.currentTeam) {
      parts.push(`Équipe actuelle: ${request.context.currentTeam.length} Pokémon`);
    }

    if (request.context?.opponentTeam) {
      parts.push(`Équipe adverse: ${request.context.opponentTeam.length} Pokémon`);
    }

    if (request.context?.battleState) {
      parts.push(`État de combat présent: oui`);
    }

    if (request.teamBuildingRequest) {
      parts.push(`Requête team building explicite`);
    }

    if (request.battleRequest) {
      parts.push(`Requête battle explicite`);
    }

    return parts.join("\n") || "Requête vide - déterminer l'action par défaut";
  }

  /**
   * Inférence locale sans LLM
   * Utilisé comme fallback ou si reflection désactivée
   */
  private inferTask(request: MasterAgentRequest): AgentTask {
    // Priorité aux requêtes explicites
    if (request.battleRequest || request.context?.battleState) {
      return "battle";
    }

    if (request.teamBuildingRequest) {
      return "team_building";
    }

    // Analyse du message
    if (request.message) {
      const msg = request.message.toLowerCase();
      
      if (msg.includes("attaque") || msg.includes("combat") || msg.includes("switch") || msg.includes("battle")) {
        return "battle";
      }
      
      if (msg.includes("équipe") || msg.includes("team") || msg.includes("suggère") || msg.includes("build")) {
        return "team_building";
      }

      if (msg.includes("analyse") || msg.includes("compare") || msg.includes("stats")) {
        return "analysis";
      }
    }

    // Par défaut: team_building
    return "team_building";
  }

  // ============================================================================
  // HANDLERS POUR CHAQUE TÂCHE
  // ============================================================================

  /**
   * Gère les requêtes de team building
   */
  private async handleTeamBuilding(
    request: MasterAgentRequest,
    reflection?: ReflectionResult
  ): Promise<MasterAgentResponse> {
    const teamRequest: TeamBuildingRequest = request.teamBuildingRequest || {
      mode: "suggest",
      currentTeam: request.context?.currentTeam || [],
      opponentTeam: request.context?.opponentTeam
    };

    const response = await this.teamBuildingAgent.process(teamRequest);

    return {
      success: response.success,
      task: "team_building",
      reflection,
      teamBuildingResponse: response
    };
  }

  /**
   * Gère les requêtes de combat
   */
  private async handleBattle(
    request: MasterAgentRequest,
    reflection?: ReflectionResult
  ): Promise<MasterAgentResponse> {
    if (!request.battleRequest && !request.context?.battleState) {
      return {
        success: false,
        task: "battle",
        reflection,
        error: "Aucun état de combat fourni"
      };
    }

    const battleRequest: BattleRequest = request.battleRequest || {
      battleState: request.context!.battleState,
      ourTeam: request.context?.currentTeam || [],
      opponentTeam: request.context?.opponentTeam || []
    };

    const response = await this.battleAgent.process(battleRequest);

    return {
      success: response.success,
      task: "battle",
      reflection,
      battleResponse: response
    };
  }

  /**
   * Gère les requêtes d'analyse pure
   */
  private async handleAnalysis(
    request: MasterAgentRequest,
    reflection?: ReflectionResult
  ): Promise<MasterAgentResponse> {
    // Pour l'analyse, utiliser le mode "analyze" du TeamBuildingAgent
    if (request.context?.currentTeam) {
      const analysisResponse = await this.teamBuildingAgent.process({
        mode: "analyze",
        currentTeam: request.context.currentTeam,
        opponentTeam: request.context.opponentTeam
      });

      return {
        success: analysisResponse.success,
        task: "analysis",
        reflection,
        teamBuildingResponse: analysisResponse
      };
    }

    return {
      success: false,
      task: "analysis",
      reflection,
      error: "Aucune équipe à analyser"
    };
  }

  // ============================================================================
  // MÉTHODES UTILITAIRES
  // ============================================================================

  /**
   * Vérifie si le client LLM est disponible
   */
  async checkLLMHealth(): Promise<{ healthy: boolean; error?: string }> {
    return this.llmClient.healthCheck();
  }

  /**
   * Active/désactive la réflexion LLM
   */
  setReflectionEnabled(enabled: boolean): void {
    this.reflectionEnabled = enabled;
  }

  /**
   * Accès direct aux sous-agents (pour usage avancé)
   */
  getTeamBuildingAgent(): TeamBuildingAgent {
    return this.teamBuildingAgent;
  }

  getBattleAgent(): BattleAgent {
    return this.battleAgent;
  }
}

export default MasterAgent;
