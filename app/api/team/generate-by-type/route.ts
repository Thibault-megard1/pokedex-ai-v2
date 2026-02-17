import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { MasterAgent } from "@/lib/agents/MasterAgent";
import { Pokemon } from "@/lib/agents/shared/types";

/**
 * API endpoint pour générer une équipe complète basée sur un type de départ
 * 
 * IA: oui (Multi-agents via MasterAgent)
 * Entrée: type de départ (water, fire, grass, etc.)
 * Sortie: équipe complète de 6 Pokémon optimisés
 */

const TYPE_TO_CORE_POKEMON: Record<string, number[]> = {
  water: [9, 55, 134, 186, 245, 382, 484, 730], // Blastoise, Golduck, Vaporeon, Politoed, Suicune, Kyogre, Palkia, Primarina
  fire: [6, 38, 59, 136, 244, 383, 392, 727], // Charizard, Ninetales, Arcanine, Flareon, Entei, Groudon, Infernape, Incineroar
  grass: [3, 45, 71, 470, 242, 254, 389, 724], // Venusaur, Vileplume, Victreebel, Leafeon, Blissey, Sceptile, Torterra, Decidueye
  electric: [25, 26, 135, 181, 243, 466, 642, 785], // Pikachu, Raichu, Jolteon, Ampharos, Raikou, Electivire, Thundurus, Tapu Koko
  psychic: [65, 121, 196, 282, 376, 475, 494, 786], // Alakazam, Starmie, Espeon, Gardevoir, Metagross, Gallade, Victini, Tapu Lele
  dragon: [6, 130, 149, 230, 373, 445, 706, 784], // Charizard, Gyarados, Dragonite, Kingdra, Salamence, Garchomp, Goodra, Kommo-o
  steel: [81, 208, 212, 376, 395, 448, 530, 798], // Melmetal, Steelix, Scizor, Metagross, Empoleon, Lucario, Excadrill, Kartana
  dark: [94, 229, 248, 330, 359, 430, 635, 720], // Gengar, Houndoom, Tyranitar, Flygon, Absol, Honchkrow, Hydreigon, Hoopa
  fairy: [36, 184, 282, 303, 468, 700, 788, 801], // Clefable, Azumarill, Gardevoir, Mawile, Togekiss, Sylveon, Tapu Fini, Magearna
  fighting: [68, 107, 214, 257, 392, 448, 475, 620], // Machamp, Hitmonchan, Heracross, Blaziken, Infernape, Lucario, Gallade, Mienshao
  ghost: [94, 105, 477, 563, 609, 711, 724, 778], // Gengar, Marowak-A, Dusknoir, Cofagrigus, Chandelure, Gourgeist, Decidueye, Mimikyu
  ice: [87, 91, 131, 144, 471, 478, 615, 712], // Dewgong, Cloyster, Lapras, Articuno, Glaceon, Froslass, Kyurem, Avalugg
  rock: [95, 139, 142, 248, 346, 411, 464, 639], // Onix, Omastar, Aerodactyl, Tyranitar, Cradily, Bastiodon, Rhyperior, Terrakion
  ground: [31, 76, 112, 115, 230, 330, 445, 623], // Nidoqueen, Golem, Rhydon, Kangaskhan, Kingdra, Flygon, Garchomp, Golurk
  flying: [6, 18, 145, 149, 227, 334, 468, 642], // Charizard, Pidgeot, Zapdos, Dragonite, Skarmory, Altaria, Togekiss, Thundurus
  poison: [31, 34, 89, 169, 454, 545, 569, 793], // Nidoqueen, Nidoking, Muk, Crobat, Toxicroak, Scolipede, Garbodor, Nihilego
  bug: [15, 127, 212, 214, 416, 545, 589, 738], // Beedrill, Pinsir, Scizor, Heracross, Vespiquen, Scolipede, Escavalier, Vikavolt
  normal: [3, 36, 115, 143, 242, 289, 462, 765], // Venusaur, Clefable, Kangaskhan, Snorlax, Blissey, Slaking, Magnezone, Oranguru
};

export async function POST(req: NextRequest) {
  try {
    // Vérifier l'authentification
    const user = await getUserFromRequest();
    if (!user) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }
    
    const body = await req.json();
    const { types } = body;
    
    // Valider l'entrée
    if (!types || !Array.isArray(types) || types.length === 0) {
      return NextResponse.json(
        { error: "Types manquants ou invalides (tableau requis)" },
        { status: 400 }
      );
    }
    
    if (types.length > 3) {
      return NextResponse.json(
        { error: "Maximum 3 types autorisés" },
        { status: 400 }
      );
    }
    
    const normalizedTypes = types.map(t => t.toLowerCase());
    
    // Vérifier que tous les types existent
    for (const type of normalizedTypes) {
      if (!TYPE_TO_CORE_POKEMON[type]) {
        return NextResponse.json(
          { error: `Type "${type}" non reconnu` },
          { status: 400 }
        );
      }
    }
    
    console.log(`🎮 [Generate Team By Types] Types: ${normalizedTypes.join(', ')}, User: ${user.username}`);
    
    // Récupérer les IDs des Pokémon pour tous les types sélectionnés
    const allCoreIds: number[] = [];
    for (const type of normalizedTypes) {
      allCoreIds.push(...TYPE_TO_CORE_POKEMON[type]);
    }
    
    // Dédupliquer et mélanger
    const uniqueCoreIds = Array.from(new Set(allCoreIds))
      .sort(() => Math.random() - 0.5);
    
    // Choisir 1-2 Pokémon par type sélectionné (max 6)
    const numCorePokemons = Math.min(normalizedTypes.length * 2, 6, uniqueCoreIds.length);
    const selectedCoreIds = uniqueCoreIds.slice(0, numCorePokemons);
    
    // Récupérer les données des Pokémon choisis
    const coreTeam: Pokemon[] = [];
    for (const id of selectedCoreIds) {
      try {
        const pokeRes = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
        if (pokeRes.ok) {
          const pokeData = await pokeRes.json();
          coreTeam.push({
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
        console.error(`Error fetching pokemon ${id}:`, err);
      }
    }
    
    if (coreTeam.length === 0) {
      return NextResponse.json(
        { error: "Impossible de générer l'équipe de base" },
        { status: 500 }
      );
    }
    
    console.log(`✅ Core team (${coreTeam.length} Pokémon):`, coreTeam.map(p => p.name));
    
    // Utiliser le MasterAgent pour compléter l'équipe
    const masterAgent = new MasterAgent({ enableReflection: false });
    
    // Pool de Pokémon populaires pour suggestions (top 150)
    const popularPokemonIds = Array.from({ length: 150 }, (_, i) => i + 1);
    
    const candidates: Pokemon[] = [];
    for (const id of popularPokemonIds) {
      // Skip core Pokémon déjà sélectionnés
      if (coreTeam.some(p => p.id === id)) continue;
      
      try {
        const pokeRes = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
        if (pokeRes.ok) {
          const pokeData = await pokeRes.json();
          candidates.push({
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
    
    console.log(`📦 Pool de candidats: ${candidates.length} Pokémon`);
    
    // Utiliser le mode "suggest" itératif pour compléter l'équipe
    let currentTeam = [...coreTeam];
    
    while (currentTeam.length < 6 && candidates.length > 0) {
      const result = await masterAgent.process({
        task: "team_building",
        teamBuildingRequest: {
          mode: "suggest",
          currentTeam,
          candidatePool: candidates
        }
      });
      
      if (result.success && result.teamBuildingResponse?.suggestion) {
        const suggestion = result.teamBuildingResponse.suggestion;
        currentTeam.push({
          id: suggestion.id,
          name: suggestion.name,
          types: suggestion.types,
          stats: suggestion.stats
        });
        
        // Retirer le Pokémon suggéré du pool de candidats
        const index = candidates.findIndex(c => c.id === suggestion.id);
        if (index !== -1) {
          candidates.splice(index, 1);
        }
        
        console.log(`➕ Ajouté: ${suggestion.name} (score: ${suggestion.score})`);
      } else {
        // Si aucune suggestion, sortir de la boucle
        break;
      }
    }
    
    console.log(`🎉 Équipe finale générée (${currentTeam.length} Pokémon):`, currentTeam.map(p => p.name));
    
    // Formater pour l'API team
    const teamSlots = currentTeam.map((pokemon, index) => ({
      slot: index + 1,
      pokemonId: pokemon.id,
      pokemonName: pokemon.name
    }));
    
    return NextResponse.json({
      success: true,
      team: teamSlots,
      analysis: {
        selectedTypes: normalizedTypes,
        corePokemons: coreTeam.map(p => p.name),
        teamSize: currentTeam.length
      }
    });
  } catch (err: any) {
    console.error("[Generate Team By Type] Error:", err);
    return NextResponse.json(
      { error: err.message || "Erreur serveur" },
      { status: 500 }
    );
  }
}
