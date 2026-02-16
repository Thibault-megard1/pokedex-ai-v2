import { NextRequest, NextResponse } from "next/server";
import { TeamBuildingOrchestrator } from "@/lib/agents/TeamBuildingOrchestrator";
import { Pokemon } from "@/lib/agents/tools/TypeEffectivenessTool";

interface TeamMember {
  pokemonId: number;
  pokemonName: string;
  types?: string[];
  stats?: { name: string; value: number }[];
}
/**
 * Pool de Pokémon populaires et compétitifs pour les suggestions
 * Organisés par tiers pour optimiser les recommandations
 */
const POKEMON_POOL = {
  // Legendaires et Pseudo-legendaires (très forts)
  legendary: [
    143, 144, 145, 146, 149, 150, 151, // Gen 1
    243, 244, 245, 249, 250, 251, // Gen 2
    377, 378, 379, 380, 381, 382, 383, 384, 385, // Gen 3
    147, 148, 246, 247, 248, 371, 372, 373 // Pseudo-legendaries
  ],
  
  // Starters (populaires et équilibrés)
  starters: [
    1, 2, 3, 4, 5, 6, 7, 8, 9, // Gen 1
    152, 153, 154, 155, 156, 157, 158, 159, 160, // Gen 2
    252, 253, 254, 255, 256, 257, 258, 259, 260 // Gen 3
  ],
  
  // Pokémon compétitifs populaires
  competitive: [
    25, 26, 65, 68, 94, 115, 121, 130, 131, // Gen 1
    59, 71, 89, 127, 128, 134, 135, 136, 142,
    196, 197, 212, 213, 214, 229, 230, 233, 242, // Gen 2
    262, 271, 282, 286, 289, 295, 302, 306, 310, // Gen 3
    319, 321, 330, 334, 342, 350, 359, 362, 365, 369, 376
  ]
};

/**
 * Génère une pool de candidats basée sur les IDs populaires
 */
function generateCandidatePool(): number[] {
  return [
    ...POKEMON_POOL.legendary,
    ...POKEMON_POOL.starters,
    ...POKEMON_POOL.competitive
  ];
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
    const currentTeam: Pokemon[] = team
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

    // Initialiser l'orchestrateur multi-agents
    const orchestrator = new TeamBuildingOrchestrator();

    // Analyser l'équipe actuelle
    const teamAnalysis = orchestrator.analyzeTeam(currentTeam);
    console.log(`📊 [API] Score d'équipe: ${teamAnalysis.overallScore}/100`);

    // Récupérer la pool de candidats
    const candidateIds = generateCandidatePool();
    const existingIds = new Set(team.map(t => t.pokemonId));
    const availableIds = candidateIds.filter(id => !existingIds.has(id));

    console.log(`🔍 [API] Évaluation de ${availableIds.length} candidats...`);

    // Fetch les données des candidats
    const candidates: Pokemon[] = [];
    
    // Limiter à 100 candidats max pour performance
    const idsToFetch = availableIds.slice(0, 100);
    
    for (const id of idsToFetch) {
      try {
        const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
        if (!res.ok) continue;
        
        const data = await res.json();
        candidates.push({
          id: data.id,
          name: data.name,
          types: data.types.map((t: any) => t.type.name),
          stats: data.stats.map((s: any) => ({
            name: s.stat.name,
            value: s.base_stat
          }))
        });
      } catch (error) {
        console.error(`Erreur lors du fetch du Pokémon ${id}:`, error);
      }
    }

    console.log(`✅ [API] ${candidates.length} candidats récupérés`);

    // Évaluer les candidats avec les agents
    const scoredCandidates = orchestrator.evaluateCandidates(currentTeam, candidates, 5);

    // Formater les suggestions pour le client
    const suggestions = scoredCandidates.map(scored => ({
      id: scored.pokemon.id,
      name: scored.pokemon.name,
      types: scored.pokemon.types,
      stats: scored.pokemon.stats,
      score: scored.totalScore,
      reasoning: scored.reasoning,
      breakdown: scored.breakdown
    }));

    console.log(`🎯 [API] Top suggestion: ${suggestions[0]?.name} (score: ${suggestions[0]?.score})`);

    // Retourner les résultats
    return NextResponse.json({
      suggestions,
      analysis: {
        overallScore: teamAnalysis.overallScore,
        recommendations: teamAnalysis.overallRecommendations,
        typeScore: teamAnalysis.typeAnalysis.coverageScore,
        statsScore: teamAnalysis.statsAnalysis.summary.avgTotal,
        roleScore: teamAnalysis.roleAnalysis.distribution.balanceScore,
        coverageScore: teamAnalysis.coverageAnalysis.coverageScore,
        criticalWeaknesses: teamAnalysis.typeAnalysis.criticalWeaknesses,
        missingRoles: teamAnalysis.roleAnalysis.distribution.missingRoles
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
