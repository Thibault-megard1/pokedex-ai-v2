/**
 * LangChain Battle Agent
 * 
 * Agent spécialisé dans les décisions de combat Pokémon.
 * Utilise ChatMistralAI avec les tools de combat.
 */

import { ChatMistralAI } from "@langchain/mistralai";
import { AgentExecutor, createToolCallingAgent } from "langchain/agents";
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import { 
  battleTools,
  damageCalculatorTool,
  speedComparatorTool,
  statusEffectTool,
  battleDecisionTool,
  winProbabilityTool
} from "./battleTools";

// ============================================================================
// TYPES
// ============================================================================

export interface BattlePokemon {
  id: number;
  name: string;
  types: string[];
  currentHp: number;
  maxHp: number;
  stats: {
    attack: number;
    defense: number;
    spAtk: number;
    spDef: number;
    speed: number;
  };
  moves: Array<{
    name: string;
    type: string;
    power: number;
    accuracy: number;
    category: "physical" | "special" | "status";
    pp?: number;
    effect?: string;
  }>;
  status?: string;
  statStages?: {
    attack: number;
    defense: number;
    spAtk: number;
    spDef: number;
    speed: number;
  };
}

export interface BattleState {
  myTeam: BattlePokemon[];
  opponentTeam: BattlePokemon[];
  myActiveIndex: number;
  opponentActiveIndex: number;
  turn: number;
  weather?: string;
  terrain?: string;
}

export interface BattleRequest {
  state: BattleState;
  side: "player" | "ai";
  mode?: "single_decision" | "analyze" | "full_battle";
  question?: string;
}

export interface BattleDecision {
  action: "attack" | "switch" | "item";
  moveIndex?: number;
  moveName?: string;
  switchTarget?: string;
  itemName?: string;
  reasoning: string;
  confidence: "high" | "medium" | "low";
}

export interface BattleResponse {
  success: boolean;
  decision?: BattleDecision;
  analysis?: any;
  winProbability?: number;
  toolsUsed: string[];
  error?: string;
}

// ============================================================================
// SYSTEM PROMPT
// ============================================================================

const BATTLE_SYSTEM_PROMPT = `Tu es un expert stratège Pokémon spécialisé dans les décisions de combat.

Tu as accès aux outils suivants:
- damage_calculator: Calcule les dégâts d'une attaque
- speed_comparator: Détermine qui attaque en premier
- status_effect: Évalue les effets de statut
- battle_decision: Prend la meilleure décision (attaque ou switch)
- win_probability: Calcule la probabilité de victoire

STRATÉGIE:
1. TOUJOURS utiliser battle_decision pour choisir une action
2. Utiliser damage_calculator pour évaluer les dégâts potentiels
3. Utiliser speed_comparator pour savoir qui attaque en premier
4. Vérifier les status_effect avant de décider

PRIORITÉS:
1. Si je peux KO l'adversaire → ATTAQUER
2. Si l'adversaire peut me KO et j'ai un meilleur matchup → SWITCH
3. Si j'ai un avantage de type → ATTAQUER agressivement
4. Si désavantage de type → Considérer SWITCH

OUTPUT FORMAT:
Retourne TOUJOURS une décision claire:
- action: "attack" ou "switch"
- moveIndex: (si attack) l'index du move (0-3)
- moveName: nom du move
- switchTarget: (si switch) nom du Pokémon
- reasoning: explication de la décision

Réponds en français.`;

// ============================================================================
// BATTLE AGENT CLASS
// ============================================================================

export class BattleAgent {
  private model: ChatMistralAI;
  private agent: AgentExecutor | null = null;
  private tools = battleTools;

  constructor(options?: { apiKey?: string; model?: string }) {
    const apiKey = options?.apiKey || process.env.MISTRAL_API_KEY;
    const modelName = options?.model || process.env.MISTRAL_MODEL || "mistral-large-latest";

    if (!apiKey) {
      throw new Error("MISTRAL_API_KEY is required for BattleAgent");
    }

    this.model = new ChatMistralAI({
      apiKey,
      model: modelName,
      temperature: 0, // Température à 0 pour des décisions déterministes
    });
  }

  /**
   * Initialise l'agent avec les tools
   */
  private async initAgent(): Promise<AgentExecutor> {
    if (this.agent) return this.agent;

    const prompt = ChatPromptTemplate.fromMessages([
      ["system", BATTLE_SYSTEM_PROMPT],
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
      maxIterations: 3, // Moins d'itérations pour la rapidité
    });

    return this.agent;
  }

  /**
   * Traite une requête de combat
   */
  async process(request: BattleRequest): Promise<BattleResponse> {
    try {
      const executor = await this.initAgent();
      const { state, side, mode = "single_decision" } = request;

      // Récupérer les Pokémon actifs
      const myActive = state.myTeam[state.myActiveIndex];
      const oppActive = state.opponentTeam[state.opponentActiveIndex];

      // Construire le prompt
      const input = this.buildPrompt(myActive, oppActive, state, mode);

      // Exécuter l'agent
      const result = await executor.invoke({
        input,
        chat_history: [],
      });

      // Parser la décision
      const decision = this.parseDecision(result.output);

      return {
        success: true,
        decision,
        analysis: result.output,
        winProbability: await this.getWinProbability(state),
        toolsUsed: this.extractToolsUsed(result),
      };

    } catch (error: any) {
      console.error("[BattleAgent] Error:", error);
      return {
        success: false,
        toolsUsed: [],
        error: error.message,
      };
    }
  }

  /**
   * Construit le prompt pour le combat
   */
  private buildPrompt(
    myActive: BattlePokemon,
    oppActive: BattlePokemon,
    state: BattleState,
    mode: string
  ): string {
    const myTeamJson = JSON.stringify(state.myTeam.map(p => ({
      name: p.name,
      types: p.types,
      hp: `${p.currentHp}/${p.maxHp}`,
      status: p.status || "none",
      moves: p.moves.map(m => m.name)
    })));

    const oppTeamJson = JSON.stringify(state.opponentTeam.map(p => ({
      name: p.name,
      types: p.types,
      hp: `${p.currentHp}/${p.maxHp}`,
      status: p.status || "none"
    })));

    switch (mode) {
      case "analyze":
        return `Analyse la situation de combat actuelle:

Mon Pokémon actif: ${myActive.name} (${myActive.types.join("/")}) - HP: ${myActive.currentHp}/${myActive.maxHp}
Moves: ${myActive.moves.map(m => `${m.name} (${m.type}, ${m.power} power)`).join(", ")}

Pokémon adverse: ${oppActive.name} (${oppActive.types.join("/")}) - HP: ${oppActive.currentHp}/${oppActive.maxHp}

Mon équipe: ${myTeamJson}
Équipe adverse: ${oppTeamJson}

Utilise win_probability et analyse le matchup en détail.`;

      case "full_battle":
        return `Simule le combat complet et donne-moi la stratégie optimale pour chaque situation.

Mon équipe: ${myTeamJson}
Équipe adverse: ${oppTeamJson}`;

      default: // single_decision
        return `Tour ${state.turn}: Quelle action je dois faire?

Mon Pokémon: ${myActive.name} (${myActive.types.join("/")})
HP: ${myActive.currentHp}/${myActive.maxHp}
Status: ${myActive.status || "OK"}
Moves: ${JSON.stringify(myActive.moves)}

Adversaire: ${oppActive.name} (${oppActive.types.join("/")})
HP: ${oppActive.currentHp}/${oppActive.maxHp}
Status: ${oppActive.status || "OK"}

Mon équipe disponible: ${myTeamJson}

Utilise battle_decision pour choisir la meilleure action.`;
    }
  }

  /**
   * Parse la décision de l'output
   */
  private parseDecision(output: string): BattleDecision {
    try {
      // Essayer de parser JSON si présent
      const jsonMatch = output.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.decision) {
          return {
            action: parsed.decision.action,
            moveIndex: parsed.decision.moveIndex,
            moveName: parsed.decision.moveName,
            switchTarget: parsed.decision.target,
            reasoning: parsed.decision.reasoning || output,
            confidence: parsed.confidence || "medium",
          };
        }
      }

      // Sinon, chercher des patterns dans le texte
      if (output.toLowerCase().includes("switch")) {
        const targetMatch = output.match(/switch(?:er)?\s+(?:vers?|to|sur)?\s*(\w+)/i);
        return {
          action: "switch",
          switchTarget: targetMatch?.[1] || "unknown",
          reasoning: output,
          confidence: "medium",
        };
      }

      // Par défaut, attaque
      const moveMatch = output.match(/(?:utilise?|use|attaque?)\s+(\w+)/i);
      return {
        action: "attack",
        moveIndex: 0,
        moveName: moveMatch?.[1] || "unknown",
        reasoning: output,
        confidence: "medium",
      };

    } catch (e) {
      return {
        action: "attack",
        moveIndex: 0,
        moveName: "unknown",
        reasoning: output,
        confidence: "low",
      };
    }
  }

  /**
   * Calcule la probabilité de victoire
   */
  private async getWinProbability(state: BattleState): Promise<number> {
    try {
      const result = await winProbabilityTool.invoke({
        myTeam: state.myTeam,
        opponentTeam: state.opponentTeam,
      });
      const parsed = JSON.parse(result);
      return parsed.winProbability;
    } catch {
      return 50;
    }
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
  async calculateDamage(attacker: BattlePokemon, defender: BattlePokemon, move: any) {
    return await damageCalculatorTool.invoke({ attacker, defender, move });
  }

  async compareSpeed(pokemon1: BattlePokemon, pokemon2: BattlePokemon) {
    return await speedComparatorTool.invoke({ pokemon1, pokemon2 });
  }

  async checkStatusEffect(pokemon: BattlePokemon) {
    return await statusEffectTool.invoke({ pokemon });
  }

  async getDecision(myPokemon: BattlePokemon, opponentPokemon: BattlePokemon, myTeam: BattlePokemon[]) {
    return await battleDecisionTool.invoke({ myPokemon, opponentPokemon, myTeam });
  }

  async calculateWinProbability(myTeam: BattlePokemon[], opponentTeam: BattlePokemon[]) {
    return await winProbabilityTool.invoke({ myTeam, opponentTeam });
  }
}

// ============================================================================
// STANDALONE FUNCTIONS
// ============================================================================

/**
 * Crée et retourne un agent de combat configuré
 */
export async function createBattleAgent(options?: {
  apiKey?: string;
  model?: string;
}): Promise<BattleAgent> {
  return new BattleAgent(options);
}

export { battleTools };
