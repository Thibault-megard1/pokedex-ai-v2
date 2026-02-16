/**
 * API Route: /api/battle/generate-team
 * 
 * Génère une équipe adverse intelligente basée sur l'équipe du joueur
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { EnemyTeamGeneratorAgent, TeamGenerationRequest } from "@/lib/agents/battleEngine/agents/EnemyTeamGeneratorAgent";
import { getPokemonDetail } from "@/lib/pokeapi";

export const dynamic = "force-dynamic";

const Body = z.object({
  playerTeam: z.array(z.object({
    name: z.string(),
    types: z.array(z.string()).optional()
  })),
  difficulty: z.enum(["easy", "medium", "hard", "nightmare"]).default("medium"),
  teamSize: z.number().min(1).max(6).default(6),
  excludeList: z.array(z.string()).optional(),
  mustInclude: z.array(z.string()).optional()
});

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const body = Body.parse(json);

    console.log("\n🤖 [Generate Team] Requête reçue");
    console.log(`   Difficulté: ${body.difficulty}`);
    console.log(`   Taille équipe: ${body.teamSize}`);
    console.log(`   Équipe joueur: ${body.playerTeam.map(p => p.name).join(", ")}`);

    // Récupérer les types des Pokémon joueur si non fournis
    const playerTeamWithTypes = await Promise.all(
      body.playerTeam.map(async (pokemon) => {
        if (pokemon.types && pokemon.types.length > 0) {
          return { name: pokemon.name, types: pokemon.types };
        }
        
        try {
          const details = await getPokemonDetail(pokemon.name);
          return {
            name: pokemon.name,
            types: details.types
          };
        } catch (error) {
          console.warn(`   ⚠️ Impossible de récupérer les types de ${pokemon.name}, utilisation de type normal`);
          return { name: pokemon.name, types: ["normal"] };
        }
      })
    );

    // Créer l'agent générateur
    const agent = new EnemyTeamGeneratorAgent();

    // Générer l'équipe
    const request: TeamGenerationRequest = {
      playerTeam: playerTeamWithTypes,
      difficulty: body.difficulty,
      teamSize: body.teamSize,
      excludeList: body.excludeList,
      mustInclude: body.mustInclude
    };

    const result = agent.generateTeam(request);

    console.log(`   ✅ Équipe générée: ${result.team.map(p => p.name).join(", ")}`);
    console.log(`   📊 Synergie: ${result.teamAnalysis.synergy}/100`);
    console.log(`   🎯 Score counter: ${result.teamAnalysis.counterScore}/100`);

    // Récupérer les détails complets des Pokémon générés
    const teamWithDetails = await Promise.all(
      result.team.map(async (member) => {
        try {
          const details = await getPokemonDetail(member.name);
          return {
            ...member,
            sprite: details.sprite,
            frenchName: details.frenchName,
            stats: details.stats,
            fullTypes: details.types
          };
        } catch (error) {
          console.warn(`   ⚠️ Impossible de récupérer les détails de ${member.name}`);
          return {
            ...member,
            sprite: null,
            frenchName: member.name,
            stats: [],
            fullTypes: member.types
          };
        }
      })
    );

    return NextResponse.json({
      success: true,
      team: teamWithDetails,
      analysis: result.teamAnalysis,
      breakdown: result.breakdown,
      metadata: {
        difficulty: body.difficulty,
        teamSize: result.team.length,
        generatedAt: new Date().toISOString()
      }
    });

  } catch (e: any) {
    console.error("❌ [Generate Team] Erreur:", e);
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
