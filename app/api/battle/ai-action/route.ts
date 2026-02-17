/**
 * API Route: /api/battle/ai-action
 * 
 * Utilise BattleAgent (SubAgent) pour déterminer la meilleure action IA
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { BattleAgent } from "@/lib/agents/subAgents/BattleAgent";
import { BattlePokemon, BattleState } from "@/lib/agents/battleEngine/tools/BattleDecisionTool";
import { MoveForDamage } from "@/lib/agents/battleEngine/tools/DamageCalculatorTool";

export const dynamic = "force-dynamic";

// Schéma pour un move
const MoveSchema = z.object({
  name: z.string(),
  type: z.string(),
  power: z.number(),
  damageClass: z.enum(["physical", "special", "status"]),
  accuracy: z.number()
});

// Schéma pour un Pokémon de combat
const BattlePokemonSchema = z.object({
  name: z.string(),
  types: z.array(z.string()),
  level: z.number().default(50),
  baseStats: z.object({
    hp: z.number(),
    attack: z.number(),
    defense: z.number(),
    specialAttack: z.number(),
    specialDefense: z.number(),
    speed: z.number()
  }),
  currentStats: z.object({
    attack: z.number(),
    defense: z.number(),
    specialAttack: z.number(),
    specialDefense: z.number(),
    speed: z.number()
  }),
  statStages: z.object({
    attack: z.number().default(0),
    defense: z.number().default(0),
    specialAttack: z.number().default(0),
    specialDefense: z.number().default(0),
    speed: z.number().default(0),
    accuracy: z.number().default(0),
    evasion: z.number().default(0)
  }).optional(),
  currentHp: z.number(),
  maxHp: z.number(),
  moves: z.array(MoveSchema),
  statusCondition: z.enum(["burn", "poison", "paralysis", "sleep", "freeze"]).nullable().default(null),
  team: z.enum(["player", "opponent"])
});

// Schéma pour l'état du combat
const BattleStateSchema = z.object({
  playerActive: BattlePokemonSchema,
  opponentActive: BattlePokemonSchema,
  playerTeam: z.array(BattlePokemonSchema),
  opponentTeam: z.array(BattlePokemonSchema),
  turn: z.number().default(1),
  weather: z.enum(["sun", "rain", "sand", "hail"]).nullable().optional()
});

const Body = z.object({
  state: BattleStateSchema,
  side: z.enum(["player", "opponent"]).default("opponent"),
  config: z.object({
    logLevel: z.enum(["none", "minimal", "detailed", "debug"]).default("minimal"),
    aggressiveness: z.enum(["defensive", "balanced", "aggressive"]).default("balanced")
  }).optional()
});

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const body = Body.parse(json);

    console.log("\n🤖 [Battle AI] Requête reçue");
    console.log(`   Side: ${body.side}`);
    console.log(`   Turn: ${body.state.turn}`);

    // Créer le BattleAgent avec la config
    const battleAgent = new BattleAgent({
      logLevel: body.config?.logLevel === "debug" ? "detailed" : body.config?.logLevel || "minimal",
      aggressiveness: body.config?.aggressiveness || "balanced"
    });

    // Normaliser les statStages si manquants
    const normalizeStatStages = (pokemon: any) => ({
      ...pokemon,
      statStages: pokemon.statStages || {
        attack: 0,
        defense: 0,
        specialAttack: 0,
        specialDefense: 0,
        speed: 0,
        accuracy: 0,
        evasion: 0
      }
    });

    const state: BattleState = {
      playerActive: normalizeStatStages(body.state.playerActive) as BattlePokemon,
      opponentActive: normalizeStatStages(body.state.opponentActive) as BattlePokemon,
      playerTeam: body.state.playerTeam.map((p: any) => normalizeStatStages(p)) as BattlePokemon[],
      opponentTeam: body.state.opponentTeam.map((p: any) => normalizeStatStages(p)) as BattlePokemon[],
      turn: body.state.turn,
      weather: body.state.weather
    };

    let result;

    if (body.side === "opponent") {
      // Générer l'action de l'adversaire IA (inversion du state)
      const invertedState: BattleState = {
        playerActive: { ...state.opponentActive, team: "player" },
        opponentActive: { ...state.playerActive, team: "opponent" },
        playerTeam: state.opponentTeam.map(p => ({ ...p, team: "player" as const })),
        opponentTeam: state.playerTeam.map(p => ({ ...p, team: "opponent" as const })),
        turn: state.turn,
        weather: state.weather
      };

      const response = await battleAgent.process({ 
        battleState: invertedState,
        ourTeam: invertedState.playerTeam,
        opponentTeam: invertedState.opponentTeam
      });

      result = {
        action: {
          type: response.action?.type || "attack",
          moveName: response.action?.move?.name || null,
          switchToName: response.action?.switchTo?.name || null
        },
        confidence: response.confidence || 50,
        reasoning: response.reasoning || "",
        winProbability: {
          player: response.analysis?.winProbability?.opponentWinChance || 50,
          opponent: response.analysis?.winProbability?.playerWinChance || 50
        }
      };
    } else {
      // Suggérer l'action pour le joueur
      const response = await battleAgent.process({
        battleState: state,
        ourTeam: state.playerTeam,
        opponentTeam: state.opponentTeam
      });

      result = {
        action: {
          type: response.action?.type || "attack",
          moveName: response.action?.move?.name || null,
          switchToName: response.action?.switchTo?.name || null
        },
        confidence: response.confidence || 50,
        reasoning: response.reasoning || "",
        allOptions: response.analysis?.moveOptions?.slice(0, 4).map((opt: any) => ({
          moveName: opt.action.move?.name,
          score: opt.score,
          koChance: opt.koChance || 0,
          expectedDamage: opt.expectedDamage || 0
        })) || [],
        switchAnalysis: {
          shouldSwitch: response.analysis?.switchAnalysis?.shouldSwitch || false,
          bestSwitchTarget: response.analysis?.switchAnalysis?.bestSwitchTarget?.name || null,
          risk: response.analysis?.switchAnalysis?.risk || 0
        },
        prediction: {
          likelyAction: response.analysis?.prediction?.likelyAction || "attack",
          expectedMove: response.analysis?.prediction?.expectedMove || null,
          confidence: response.analysis?.prediction?.confidence || 50
        },
        winProbability: {
          player: response.analysis?.winProbability?.playerWinChance || 50,
          opponent: response.analysis?.winProbability?.opponentWinChance || 50
        }
      };
    }

    console.log(`   ✅ Action: ${result.action.type} - ${result.action.moveName || result.action.switchToName}`);
    console.log(`   📊 Confiance: ${result.confidence}%`);

    return NextResponse.json({
      success: true,
      ...result
    });

  } catch (e: any) {
    console.error("❌ [Battle AI] Erreur:", e);
    return NextResponse.json(
      { 
        success: false, 
        error: e?.message ?? "Erreur inconnue",
        details: e?.errors || null
      }, 
      { status: 400 }
    );
  }
}
