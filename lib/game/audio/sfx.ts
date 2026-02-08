/**
 * Sound Effects Manager for Battle Type Sounds
 * Caches audio objects to avoid recreation and provides type-based SFX playback
 */

// Valid Pokemon types
const POKEMON_TYPES = [
  'normal', 'fire', 'water', 'electric', 'grass', 'ice',
  'fighting', 'poison', 'ground', 'flying', 'psychic', 'bug',
  'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy'
] as const;

type PokemonType = typeof POKEMON_TYPES[number];

// Cache for audio elements
const audioCache = new Map<string, HTMLAudioElement>();

/**
 * Get the URL for a type-specific SFX
 * Falls back to neutral.wav if type is missing or invalid
 */
export function getTypeSfxUrl(type: string): string {
  const normalizedType = type.toLowerCase();
  
  // Check if type is valid
  if (POKEMON_TYPES.includes(normalizedType as PokemonType)) {
    return `/game/assets/sfx/types/${normalizedType}.wav`;
  }
  
  // Fallback to neutral
  return '/game/assets/sfx/types/neutral.wav';
}

/**
 * Play a type-specific sound effect
 * Caches audio objects for reuse
 * 
 * @param type - The Pokemon move type (e.g., 'fire', 'water', 'electric')
 * @param volume - Volume level (0.0 to 1.0), default 0.5
 */
export function playTypeSfx(type: string, volume: number = 0.5): void {
  const url = getTypeSfxUrl(type);
  
  // Get or create cached audio element
  let audio = audioCache.get(url);
  
  if (!audio) {
    audio = new Audio(url);
    audio.volume = volume;
    audioCache.set(url, audio);
  } else {
    // Reset to start if already playing
    audio.currentTime = 0;
    audio.volume = volume;
  }
  
  // Play the sound
  audio.play().catch(err => {
    console.warn(`Failed to play type SFX for ${type}:`, err);
  });
}

/**
 * Preload all type sound effects into cache
 * Useful for loading screen or initialization
 */
export function preloadTypeSfx(): void {
  // Preload all types
  POKEMON_TYPES.forEach(type => {
    const url = getTypeSfxUrl(type);
    if (!audioCache.has(url)) {
      const audio = new Audio(url);
      audio.volume = 0.5;
      audioCache.set(url, audio);
    }
  });
  
  // Preload neutral
  const neutralUrl = '/game/assets/sfx/types/neutral.wav';
  if (!audioCache.has(neutralUrl)) {
    const audio = new Audio(neutralUrl);
    audio.volume = 0.5;
    audioCache.set(neutralUrl, audio);
  }
}

/**
 * Clear the audio cache
 * Useful for cleanup or memory management
 */
export function clearAudioCache(): void {
  audioCache.forEach(audio => {
    audio.pause();
    audio.src = '';
  });
  audioCache.clear();
}
