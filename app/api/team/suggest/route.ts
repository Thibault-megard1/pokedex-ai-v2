import { NextRequest, NextResponse } from "next/server";
import { MasterAgent } from "@/lib/agents/MasterAgent";

interface TeamMember {
  pokemonId: number;
  pokemonName: string;
  types?: string[];
  stats?: { name: string; value: number }[];
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { team } = body as { team: TeamMember[] };

    if (!team || team.length === 0) {
      return NextResponse.json({ error: "Équipe vide" }, { status: 400 });
    }

    if (team.length >= 6) {
      return NextResponse.json({ error: "L'équipe est déjà complète" }, { status: 400 });
    }

    console.log(`🤖 [API] Génération de suggestions pour une équipe de ${team.length} Pokémon`);

    // Convertir l'équipe au format Pokemon
    const currentTeam = team
      .filter(member => member.types && member.stats)
      .map(member => ({
        id: member.pokemonId,
        name: member.pokemonName,
        types: member.types!,
        stats: member.stats!
      }));

    if (currentTeam.length === 0) {
      return NextResponse.json(
        { error: "Aucune donnée de Pokémon disponible dans l'équipe" },
        { status: 400 }
      );
    }

    // Créer un pool de candidats plus large (top 150 Pokémon)
    const popularPokemonIds = Array.from({ length: 150 }, (_, i) => i + 1);
    const usedIds = new Set(currentTeam.map(p => p.id));
    
    const candidatePool: any[] = [];
    for (const id of popularPokemonIds) {
      if (usedIds.has(id)) continue;
      
      try {
        const pokeRes = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
        if (pokeRes.ok) {
          const pokeData = await pokeRes.json();
          candidatePool.push({
            id: pokeData.id,
            name: pokeData.name,
            types: pokeData.types.map((t: any) => t.type.name),
            stats: pokeData.stats.map((s: any) => ({
              name: s.stat.name,
              value: s.base_stat
            }))
          });
        }
      } catch (err) {
        // Skip en cas d'erreur
      }
    }

    console.log(`📦 Pool de candidats: ${candidatePool.length} Pokémon`);

    // Initialiser le MasterAgent avec réflexion désactivée pour performance
    const agent = new MasterAgent({ enableReflection: false });

    // Utiliser le TeamBuildingAgent pour suggérer des Pokémon
    const result = await agent.process({
      task: "team_building",
      teamBuildingRequest: {
        mode: "suggest",
        currentTeam: currentTeam,
        candidatePool: candidatePool
      }
    });

    if (!result.success || !result.teamBuildingResponse) {
      return NextResponse.json(
        { error: result.error || "Échec de la génération de suggestions" },
        { status: 500 }
      );
    }

    const response = result.teamBuildingResponse;
    console.log(`📊 [API] Score d'équipe: ${response.analysis?.overallScore || 0}/100`);

    // Utiliser les suggestions multiples fournies par le TeamBuildingAgent
    const suggestions = response.suggestions || (response.suggestion ? [response.suggestion] : []);
    
    // Si on a besoin de plus de suggestions, utiliser l'analyse complète
    const analysis = response.analysis || {
      overallScore: 0,
      typeDistribution: {},
      roleDistribution: { sweeper: 0, wall: 0, support: 0, tank: 0, pivot: 0 },
      weaknesses: [],
      resistances: []
    };

    console.log(`🎯 [API] Généré ${suggestions.length} suggestions - Top: ${suggestions[0]?.name || "none"} (score: ${suggestions[0]?.score || 0})`);

    // Retourner les résultats
    return NextResponse.json({
      suggestions: suggestions.map(s => ({
        id: s.id,
        name: s.name,
        types: s.types,
        stats: s.stats,
        score: s.score || 0,
        reasoning: s.reasoning || "Suggestion IA",
        breakdown: {}
      })),
      analysis: {
        overallScore: analysis.overallScore,
        recommendations: [],
        typeScore: Object.keys(analysis.typeDistribution || {}).length * 10,
        statsScore: 50,
        roleScore: 50,
        coverageScore: 50,
        synergyScore: 50,
        criticalWeaknesses: analysis.weaknesses || [],
        missingRoles: [],
        typeRedundancy: []
      }
    });

  } catch (error) {
    console.error("❌ [API] Erreur dans team suggest:", error);
    return NextResponse.json(
      { 
        error: "Erreur lors de la génération de suggestions",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
