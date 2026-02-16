/**
 * API Route: /api/battle/ai-action
 * 
 * Utilise le système multi-agents pour déterminer la meilleure action IA
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { BattleOrchestrator } from "@/lib/agents/battleEngine/BattleOrchestrator";
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

    // Créer l'orchestrateur avec la config
    const orchestrator = new BattleOrchestrator({
      logLevel: body.config?.logLevel || "minimal",
      aggressiveness: body.config?.aggressiveness || "balanced",
      considerSetup: true,
      considerSwitch: true
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
      playerTeam: body.state.playerTeam.map(p => normalizeStatStages(p)) as BattlePokemon[],
      opponentTeam: body.state.opponentTeam.map(p => normalizeStatStages(p)) as BattlePokemon[],
      turn: body.state.turn,
      weather: body.state.weather
    };

    let result;

    if (body.side === "opponent") {
      // Générer l'action de l'adversaire IA
      const action = orchestrator.generateOpponentAction(state);
      const decision = orchestrator.executeTurn(state);

      result = {
        action: {
          type: action.type,
          moveName: action.move?.name || null,
          switchToName: action.switchTo?.name || null
        },
        confidence: decision.confidence,
        reasoning: decision.fullDecision.reasoning,
        winProbability: {
          player: decision.fullDecision.winProbability.playerWinChance,
          opponent: decision.fullDecision.winProbability.opponentWinChance
        },
        logs: orchestrator.getLogs()
      };
    } else {
      // Suggérer l'action pour le joueur
      const decision = orchestrator.executeTurn(state);

      result = {
        action: {
          type: decision.decision.type,
          moveName: decision.decision.move?.name || null,
          switchToName: decision.decision.switchTo?.name || null
        },
        confidence: decision.confidence,
        reasoning: decision.fullDecision.reasoning,
        mainReason: decision.fullDecision.mainReason,
        allOptions: decision.fullDecision.moveAnalysis.slice(0, 4).map(opt => ({
          moveName: opt.action.move?.name,
          score: opt.score,
          koChance: opt.koChance || 0,
          expectedDamage: opt.expectedDamage || 0
        })),
        switchAnalysis: {
          shouldSwitch: decision.fullDecision.switchAnalysis.shouldSwitch,
          bestSwitchTarget: decision.fullDecision.switchAnalysis.bestSwitchTarget?.name || null,
          risk: decision.fullDecision.switchAnalysis.risk
        },
        prediction: {
          likelyAction: decision.fullDecision.opponentPrediction.likelyAction,
          expectedMove: decision.fullDecision.opponentPrediction.expectedMove || null,
          confidence: decision.fullDecision.opponentPrediction.confidence
        },
        winProbability: {
          player: decision.fullDecision.winProbability.playerWinChance,
          opponent: decision.fullDecision.winProbability.opponentWinChance
        },
        logs: orchestrator.getLogs()
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
