/**
 * Master Agent - Multi-Agent Principal
 * 
 * Orchestrateur intelligent qui utilise Ollama pour la réflexion
 * et décide quel sous-agent utiliser selon le contexte.
 * 
 * Architecture:
 * - MasterAgent (réflexion Ollama)
 *   ├── TeamBuildingAgent (génération d'équipes)
 *   │   ├── OurTeamAgent (optimisation de notre équipe)
 *   │   └── OpponentTeamAgent (analyse/génération équipe adverse)
 *   └── BattleAgent (décisions de combat)
 */

import { OllamaClient } from "@/lib/llm/ollama";
import { TeamBuildingAgent, TeamBuildingRequest, TeamBuildingResponse } from "./subAgents/TeamBuildingAgent";
import { BattleAgent, BattleRequest, BattleResponse } from "./subAgents/BattleAgent";

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
  private ollama: OllamaClient;
  private teamBuildingAgent: TeamBuildingAgent;
  private battleAgent: BattleAgent;
  private reflectionEnabled: boolean;

  constructor(options: { enableReflection?: boolean } = {}) {
    this.ollama = new OllamaClient();
    this.teamBuildingAgent = new TeamBuildingAgent();
    this.battleAgent = new BattleAgent();
    this.reflectionEnabled = options.enableReflection ?? true;
  }

  /**
   * Point d'entrée principal
   * Analyse la requête, réfléchit via Ollama, et délègue au bon sous-agent
   */
  async process(request: MasterAgentRequest): Promise<MasterAgentResponse> {
    try {
      // 1. Déterminer la tâche (si pas explicite, utiliser Ollama pour réfléchir)
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
        error: error.message || "Erreur inconnue dans MasterAgent"
      };
    }
  }

  /**
   * Réflexion via Ollama
   * Analyse le contexte et détermine la meilleure action
   */
  private async reflect(request: MasterAgentRequest): Promise<ReflectionResult> {
    const systemPrompt = `Tu es un assistant Pokémon expert. Analyse la requête et détermine quelle action effectuer.

Tâches possibles:
- "team_building": Construire/optimiser une équipe Pokémon
- "battle": Prendre une décision en combat (attaque, switch)
- "analysis": Analyser une situation sans action immédiate

Réponds en JSON avec ce format:
{
  "task": "team_building" | "battle" | "analysis",
  "reasoning": "Explication courte de ton choix",
  "confidence": 0.0-1.0,
  "suggestedActions": ["action1", "action2"]
}`;

    const userMessage = this.buildReflectionPrompt(request);

    try {
      const response = await this.ollama.chat(
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
      // Fallback si Ollama échoue
      console.warn("[MasterAgent] Reflection failed, using inference fallback");
      return {
        task: this.inferTask(request),
        reasoning: "Inférence locale (Ollama indisponible)",
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
   * Inférence locale sans Ollama
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
    // Pour l'analyse, on peut utiliser les deux agents
    const analysisResults: any = {};

    if (request.context?.currentTeam) {
      const teamAnalysis = await this.teamBuildingAgent.analyzeTeam(
        request.context.currentTeam
      );
      analysisResults.teamAnalysis = teamAnalysis;
    }

    return {
      success: true,
      task: "analysis",
      reflection,
      teamBuildingResponse: {
        success: true,
        mode: "analyze",
        analysis: analysisResults
      }
    };
  }

  // ============================================================================
  // MÉTHODES UTILITAIRES
  // ============================================================================

  /**
   * Vérifie si Ollama est disponible
   */
  async checkOllamaHealth(): Promise<{ healthy: boolean; error?: string }> {
    return this.ollama.healthCheck();
  }

  /**
   * Active/désactive la réflexion Ollama
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
