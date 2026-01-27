// Team encoding/decoding utilities for sharing
// Compact representation for URL sharing

export interface TeamPokemon {
  id: number;
  name: string;
  evolutionLevel?: number;
}

export interface SharedTeam {
  name: string;
  pokemon: TeamPokemon[];
  evolutionPoints?: number;
  createdAt?: number;
}

/**
 * Encodes a team to a compact base64url string
 */
export function encodeTeam(team: SharedTeam): string {
  try {
    // Create compact representation
    const compact = {
      n: team.name,
      p: team.pokemon.map(p => ({
        i: p.id,
        e: p.evolutionLevel || 0
      })),
      ep: team.evolutionPoints || 0,
      t: team.createdAt || Date.now()
    };
    
    const json = JSON.stringify(compact);
    const base64 = btoa(json);
    // Make URL-safe
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  } catch (error) {
    console.error('Team encoding failed:', error);
    throw new Error('Failed to encode team');
  }
}

/**
 * Decodes a team from a base64url string
 */
export function decodeTeam(encoded: string): SharedTeam | null {
  try {
    // Restore base64
    let base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
    // Add padding if needed
    while (base64.length % 4) {
      base64 += '=';
    }
    
    const json = atob(base64);
    const compact = JSON.parse(json);
    
    // Validate structure
    if (!compact.n || !Array.isArray(compact.p)) {
      return null;
    }
    
    // Expand to full format
    const team: SharedTeam = {
      name: compact.n,
      pokemon: compact.p.map((p: any) => ({
        id: p.i,
        name: '', // Will be filled by fetching
        evolutionLevel: p.e || 0
      })),
      evolutionPoints: compact.ep || 0,
      createdAt: compact.t
    };
    
    return team;
  } catch (error) {
    console.error('Team decoding failed:', error);
    return null;
  }
}

/**
 * Validates a decoded team
 */
export function validateTeam(team: SharedTeam | null): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!team) {
    errors.push('Invalid team data');
    return { valid: false, errors };
  }
  
  if (!team.name || team.name.length < 1) {
    errors.push('Team name is required');
  }
  
  if (!team.pokemon || team.pokemon.length === 0) {
    errors.push('Team must have at least 1 Pokémon');
  }
  
  if (team.pokemon && team.pokemon.length > 6) {
    errors.push('Team cannot have more than 6 Pokémon');
  }
  
  if (team.pokemon) {
    for (const pokemon of team.pokemon) {
      if (!pokemon.id || pokemon.id < 1) {
        errors.push(`Invalid Pokémon ID: ${pokemon.id}`);
      }
      
      if (pokemon.evolutionLevel && (pokemon.evolutionLevel < 0 || pokemon.evolutionLevel > 2)) {
        errors.push(`Invalid evolution level for ${pokemon.name}: ${pokemon.evolutionLevel}`);
      }
    }
  }
  
  if (team.evolutionPoints && team.evolutionPoints > 6) {
    errors.push('Evolution points cannot exceed 6');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Generates a shareable URL for a team
 */
export function generateShareURL(team: SharedTeam, baseURL?: string): string {
  const encoded = encodeTeam(team);
  const base = baseURL || (typeof window !== 'undefined' ? window.location.origin : '');
  return `${base}/team/share?data=${encoded}`;
}

/**
 * Extracts team data from URL
 */
export function extractTeamFromURL(url: string): SharedTeam | null {
  try {
    const urlObj = new URL(url);
    const data = urlObj.searchParams.get('data');
    
    if (!data) {
      return null;
    }
    
    return decodeTeam(data);
  } catch (error) {
    console.error('Failed to extract team from URL:', error);
    return null;
  }
}
