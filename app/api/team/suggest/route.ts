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
 * Pool de Pokémon diversifié pour les suggestions
 * ÉLARGI avec plus de types variés pour meilleure complémentarité
 */
const POKEMON_POOL = {
  // Légendaires (stats élevées mais pas toujours la meilleure synergie)
  legendary: [
    144, 145, 146, 149, 150, 151, // Gen 1 oiseaux + Mewtwo + Mew
    243, 244, 245, 249, 250, // Gen 2
    380, 381, 382, 383, 384, 385, // Gen 3
  ],
  
  // Pseudo-légendaires (très bons)
  pseudoLegendary: [
    149, // Dragonite (Dragon/Flying)
    248, // Tyranitar (Rock/Dark)
    373, // Salamence (Dragon/Flying)
    376, // Metagross (Steel/Psychic)
    143, // Snorlax (Normal)
  ],
  
  // Starters finaux (équilibrés)
  starters: [
    3, 6, 9, // Gen 1: Venusaur, Charizard, Blastoise
    154, 157, 160, // Gen 2: Meganium, Typhlosion, Feraligatr
    254, 257, 260 // Gen 3: Sceptile, Blaziken, Swampert
  ],
  
  // Types variés pour COMPLÉMENTARITÉ (clé!)
  byType: {
    ghost: [94, 200, 302, 354], // Gengar, Misdreavus, Sableye, Banette
    fighting: [68, 106, 107, 214, 286, 297], // Machamp, Hitmonlee, Hitmonchan, Heracross, Breloom, Hariyama
    ground: [51, 105, 208, 330, 383], // Dugtrio, Marowak, Steelix, Flygon, Groudon
    flying: [18, 142, 227, 334], // Pidgeot, Aerodactyl, Skarmory, Altaria
    steel: [208, 212, 306, 376], // Steelix, Scizor, Aggron, Metagross
    psychic: [65, 121, 196, 282, 385], // Alakazam, Starmie, Espeon, Gardevoir, Jirachi
    water: [130, 131, 134, 230, 321, 350], // Gyarados, Lapras, Vaporeon, Kingdra, Wailord, Milotic
    fire: [6, 38, 59, 136, 157, 257], // Charizard, Ninetales, Arcanine, Flareon, Typhlosion, Blaziken
    electric: [26, 135, 181, 310], // Raichu, Jolteon, Ampharos, Manectric
    grass: [3, 45, 71, 154, 254, 286], // Venusaur, Vileplume, Victreebel, Meganium, Sceptile, Breloom
    ice: [131, 144, 362, 365], // Lapras, Articuno, Glalie, Walrein
    dragon: [149, 230, 330, 373, 384], // Dragonite, Kingdra, Flygon, Salamence, Rayquaza
    fairy: [36, 282], // Clefable, Gardevoir (gen 1-3 avec Fairy rétroactif)
    dark: [197, 229, 248, 302, 359], // Umbreon, Houndoom, Tyranitar, Sableye, Absol
    poison: [34, 45, 89, 94], // Nidoking, Vileplume, Muk, Gengar
    rock: [141, 142, 248, 306, 369], // Kabutops, Aerodactyl, Tyranitar, Aggron, Relicanth
    bug: [127, 212, 214, 284], // Pinsir, Scizor, Heracross, Masquerain
    normal: [113, 143, 233, 242, 289], // Chansey, Snorlax, Porygon2, Blissey, Slaking
  }
};

/**
 * Génère une pool de candidats VARIÉE
 */
function generateCandidatePool(): number[] {
  const pool = new Set<number>();
  
  // Ajouter tous les groupes
  POKEMON_POOL.legendary.forEach(id => pool.add(id));
  POKEMON_POOL.pseudoLegendary.forEach(id => pool.add(id));
  POKEMON_POOL.starters.forEach(id => pool.add(id));
  
  // Ajouter tous les types
  Object.values(POKEMON_POOL.byType).forEach(ids => {
    ids.forEach(id => pool.add(id));
  });
  
  return Array.from(pool);
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
        synergyScore: teamAnalysis.synergyAnalysis.synergy.score,
        criticalWeaknesses: teamAnalysis.typeAnalysis.criticalWeaknesses,
        missingRoles: teamAnalysis.roleAnalysis.distribution.missingRoles,
        typeRedundancy: teamAnalysis.synergyAnalysis.synergy.typeRedundancy
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
