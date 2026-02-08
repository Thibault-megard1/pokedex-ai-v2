/**
 * Pokédex Metadata System - CLIENT-SAFE VERSION
 * Types and constants only (no Node.js modules)
 */

export interface VersionInfo {
  name: string;
  url: string;
}

export interface VersionGroupInfo {
  name: string;
  generation: string;
  versions: VersionInfo[];
  order: number;
}

export interface GenerationInfo {
  id: number;
  name: string;
  region: string;
  versionGroups: string[];
}

export interface RegionMap {
  [generation: string]: string;
}

// Region mapping by generation
export const GENERATION_REGIONS: RegionMap = {
  "generation-i": "Kanto",
  "generation-ii": "Johto",
  "generation-iii": "Hoenn",
  "generation-iv": "Sinnoh",
  "generation-v": "Unova",
  "generation-vi": "Kalos",
  "generation-vii": "Alola",
  "generation-viii": "Galar",
  "generation-ix": "Paldea",
};

// Human-readable version names (French)
export const VERSION_DISPLAY_NAMES: Record<string, string> = {
  "red": "Rouge",
  "blue": "Bleu",
  "yellow": "Jaune",
  "gold": "Or",
  "silver": "Argent",
  "crystal": "Cristal",
  "ruby": "Rubis",
  "sapphire": "Saphir",
  "emerald": "Émeraude",
  "firered": "Rouge Feu",
  "leafgreen": "Vert Feuille",
  "diamond": "Diamant",
  "pearl": "Perle",
  "platinum": "Platine",
  "heartgold": "Or HeartGold",
  "soulsilver": "Argent SoulSilver",
  "black": "Noir",
  "white": "Blanc",
  "black-2": "Noir 2",
  "white-2": "Blanc 2",
  "x": "X",
  "y": "Y",
  "omega-ruby": "Rubis Oméga",
  "alpha-sapphire": "Saphir Alpha",
  "sun": "Soleil",
  "moon": "Lune",
  "ultra-sun": "Ultra-Soleil",
  "ultra-moon": "Ultra-Lune",
  "lets-go-pikachu": "Let's Go Pikachu",
  "lets-go-eevee": "Let's Go Évoli",
  "sword": "Épée",
  "shield": "Bouclier",
  "brilliant-diamond": "Diamant Étincelant",
  "shining-pearl": "Perle Scintillante",
  "legends-arceus": "Légendes Arceus",
  "scarlet": "Écarlate",
  "violet": "Violet",
};

export function getVersionDisplayName(versionName: string): string {
  return VERSION_DISPLAY_NAMES[versionName] || versionName;
}

export function getGenerationRegion(generationName: string): string {
  return GENERATION_REGIONS[generationName] || "Inconnu";
}
