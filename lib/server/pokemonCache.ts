/**
 * Server-only Pokemon Cache Access Layer
 * 
 * This module provides server-side access to the Pokemon cache.
 * NEVER import this in Client Components.
 * 
 * Cache location: ./data/pokemon-cache/
 * 
 * Use the API routes (/api/pokemon/cache) from client components instead.
 */

import { getPokemonDetail } from "../pokeapi";

/**
 * Get a Pokemon by ID or name from the server-side cache.
 * Falls back to PokeAPI if not cached.
 * 
 * @param identifier - Pokemon ID (number) or name (string)
 * @returns PokemonDetail object with all data
 */
export async function getPokemonFromCache(identifier: string | number) {
  try {
    const pokemon = await getPokemonDetail(String(identifier));
    return pokemon;
  } catch (error) {
    console.error(`Failed to get Pokemon ${identifier} from cache:`, error);
    throw error;
  }
}

/**
 * Get multiple Pokemon from cache by IDs
 * Useful for batch operations
 * 
 * @param ids - Array of Pokemon IDs
 * @returns Array of PokemonDetail objects
 */
export async function getMultiplePokemonFromCache(ids: number[]) {
  const promises = ids.map(id => getPokemonFromCache(id));
  const results = await Promise.allSettled(promises);
  
  return results
    .filter((result): result is PromiseFulfilledResult<any> => result.status === 'fulfilled')
    .map(result => result.value);
}

/**
 * Check if a Pokemon exists in cache (without fetching from API)
 * 
 * @param identifier - Pokemon ID or name
 * @returns true if cached, false otherwise
 */
export async function isPokemonCached(identifier: string | number): Promise<boolean> {
  try {
    const fs = await import('fs/promises');
    const path = await import('path');
    const { DATA_DIR } = await import('../utils');
    
    const CACHE_DIR = path.join(DATA_DIR, 'pokemon-cache');
    const normalizedName = String(identifier).toLowerCase().replace(/[^a-z0-9-]/g, '');
    const cachePath = path.join(CACHE_DIR, `${normalizedName}.json`);
    
    await fs.access(cachePath);
    return true;
  } catch {
    return false;
  }
}

// Re-export types for convenience
export type { PokemonDetail, PokemonBasic } from '../types';
