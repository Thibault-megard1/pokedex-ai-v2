// Client-side cache for Pokémon species using localStorage
// Usage: getPokemonSpecies(idOrName: string): Promise<PokemonSpeciesData | null>

const API_URL = 'https://pokeapi.co/api/v2/pokemon-species/';

export interface FlavorTextEntry {
  flavor_text: string;
  language: { name: string };
  version: { name: string };
}

export interface PokemonSpeciesData {
  id: number;
  name: string;
  flavor_text_entries: FlavorTextEntry[];
  // ...other fields as needed
}

export async function getPokemonSpecies(idOrName: string): Promise<PokemonSpeciesData | null> {
  if (typeof window === 'undefined') return null;
  const cacheKey = `speciesCache_${idOrName.toLowerCase()}`;
  const cached = localStorage.getItem(cacheKey);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch (e) {
      localStorage.removeItem(cacheKey);
    }
  }
  try {
    const res = await fetch(`${API_URL}${idOrName}`);
    if (!res.ok) throw new Error('API error');
    const data = await res.json();
    localStorage.setItem(cacheKey, JSON.stringify(data));
    return data;
  } catch (err) {
    return null;
  }
}
