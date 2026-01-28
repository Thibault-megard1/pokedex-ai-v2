/**
 * Génère un sprite placeholder SVG pour les Pokémon sans sprite
 * Retourne une classe CSS pour utiliser la pokéball animée
 */
export function generatePlaceholderSprite(pokemonName: string, pokemonId: number): string {
  // Retourne une classe spéciale pour afficher la pokéball CSS
  return 'pokeball-placeholder';
}

/**
 * Vérifie si une URL d'image existe (pour les fallbacks)
 */
export async function checkImageExists(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Sources alternatives de sprites Pokémon
 */
export const SPRITE_SOURCES = {
  // Repository GitHub officiel de PokéAPI
  pokeapi: (id: number) => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`,
  pokeapiShiny: (id: number) => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/${id}.png`,
  pokeapiBack: (id: number) => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/back/${id}.png`,
  
  // Official artwork (haute qualité)
  officialArtwork: (id: number) => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`,
  officialArtworkShiny: (id: number) => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/shiny/${id}.png`,
  
  // Home sprites (haute qualité)
  home: (id: number) => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/${id}.png`,
  homeShiny: (id: number) => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/shiny/${id}.png`,
  
  // Showdown sprites (style compétitif)
  showdown: (id: number) => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/${id}.gif`,
  showdownShiny: (id: number) => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/shiny/${id}.gif`,
};

/**
 * Récupère le meilleur sprite disponible avec fallback
 */
export async function getBestSprite(
  pokemonId: number, 
  pokemonName: string,
  type: 'front' | 'back' | 'shiny' = 'front'
): Promise<string> {
  const sources = type === 'shiny' 
    ? [SPRITE_SOURCES.pokeapiShiny, SPRITE_SOURCES.officialArtworkShiny, SPRITE_SOURCES.homeShiny, SPRITE_SOURCES.showdownShiny]
    : type === 'back'
    ? [SPRITE_SOURCES.pokeapiBack, SPRITE_SOURCES.pokeapi]
    : [SPRITE_SOURCES.pokeapi, SPRITE_SOURCES.officialArtwork, SPRITE_SOURCES.home, SPRITE_SOURCES.showdown];
  
  // Tester chaque source dans l'ordre
  for (const source of sources) {
    const url = source(pokemonId);
    const exists = await checkImageExists(url);
    if (exists) return url;
  }
  
  // Si aucune source ne fonctionne, générer un placeholder
  return generatePlaceholderSprite(pokemonName, pokemonId);
}
