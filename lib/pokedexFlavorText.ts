/**
 * Pokédex Flavor Text Helper
 * Handles selection and normalization of Pokédex descriptions
 */

export interface FlavorTextEntry {
  flavor_text: string;
  language: { name: string; url: string };
  version: { name: string; url: string };
}

export interface PokemonSpeciesData {
  id: number;
  name: string;
  names: Array<{ name: string; language: { name: string } }>;
  genera: Array<{ genus: string; language: { name: string } }>;
  flavor_text_entries: FlavorTextEntry[];
  habitat: { name: string } | null;
  growth_rate: { name: string } | null;
  generation: { name: string; url: string };
  evolution_chain?: { url: string };
}

export interface PokedexPreference {
  lang: "fr" | "en";
  generation?: number; // Optional for backward compatibility during migration
  version?: string;    // Optional for backward compatibility during migration
  versionGroup?: string; // Optional, can be derived from version
}

/**
 * Normalize flavor text by removing control characters
 */
export function normalizeFlavorText(text: string): string {
  return text
    .replace(/[\n\f\r]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Deduplicate flavor text entries by normalized text
 */
export function deduplicateFlavorTexts(entries: FlavorTextEntry[]): FlavorTextEntry[] {
  const seen = new Set<string>();
  return entries.filter((entry) => {
    const normalized = normalizeFlavorText(entry.flavor_text);
    if (seen.has(normalized)) return false;
    seen.add(normalized);
    return true;
  });
}

/**
 * Get the best flavor text entry based on user preferences
 * Follows deterministic selection algorithm:
 * 1. Try exact version match in preferred language
 * 2. Try version group match in preferred language
 * 3. Try exact version match in fallback language
 * 4. Try version group match in fallback language
 * 5. Return null if nothing found
 */
export function selectBestFlavorText(
  entries: FlavorTextEntry[],
  preference: PokedexPreference,
  versionGroups: any[]
): FlavorTextEntry | null {
  if (entries.length === 0) return null;

  const preferredLang = preference.lang;
  const fallbackLang = preferredLang === "fr" ? "en" : "fr";
  const selectedVersion = preference.version;
  const selectedVersionGroup = preference.versionGroup;

  // Log selection process for debugging
  const logSelection = (step: string, entry: FlavorTextEntry | null) => {
    if (typeof window !== "undefined" && window.localStorage.getItem("debugPokedex")) {
      console.log(`[Pokédex Selection] ${step}:`, entry ? `${entry.version.name} (${entry.language.name})` : "not found");
    }
  };

  // Step 1: Try exact version match in preferred language
  if (selectedVersion) {
    const match = entries.find(
      (e) => e.language.name === preferredLang && e.version.name === selectedVersion
    );
    if (match) {
      logSelection(`Step 1: Exact match ${selectedVersion} in ${preferredLang}`, match);
      return match;
    }
  }

  // Step 2: Try version group match in preferred language
  if (selectedVersionGroup) {
    const vgVersions = getVersionsInGroup(selectedVersionGroup, versionGroups);
    const match = entries.find(
      (e) => e.language.name === preferredLang && vgVersions.includes(e.version.name)
    );
    if (match) {
      logSelection(`Step 2: Version group ${selectedVersionGroup} in ${preferredLang}`, match);
      return match;
    }
  }

  // Step 3: Try exact version match in fallback language
  if (selectedVersion) {
    const match = entries.find(
      (e) => e.language.name === fallbackLang && e.version.name === selectedVersion
    );
    if (match) {
      logSelection(`Step 3: Exact match ${selectedVersion} in ${fallbackLang}`, match);
      return match;
    }
  }

  // Step 4: Try version group match in fallback language
  if (selectedVersionGroup) {
    const vgVersions = getVersionsInGroup(selectedVersionGroup, versionGroups);
    const match = entries.find(
      (e) => e.language.name === fallbackLang && vgVersions.includes(e.version.name)
    );
    if (match) {
      logSelection(`Step 4: Version group ${selectedVersionGroup} in ${fallbackLang}`, match);
      return match;
    }
  }

  // Step 5: No match found
  logSelection("Step 5: No match found", null);
  return null;
}

/**
 * Get all version names in a version group
 */
function getVersionsInGroup(versionGroupName: string, versionGroups: any[]): string[] {
  const group = versionGroups.find((vg) => vg.name === versionGroupName);
  return group ? group.versions.map((v: any) => v.name) : [];
}

/**
 * Get all version names in a generation
 */
function getVersionsInGeneration(generationId: number, versionGroups: any[]): string[] {
  const genName = `generation-${toRoman(generationId).toLowerCase()}`;
  const groups = versionGroups.filter((vg) => vg.generation === genName);
  const versions: string[] = [];
  for (const group of groups) {
    versions.push(...group.versions.map((v: any) => v.name));
  }
  return versions;
}

/**
 * Convert number to Roman numeral
 */
function toRoman(num: number): string {
  const romanNumerals: [number, string][] = [
    [10, "x"],
    [9, "ix"],
    [5, "v"],
    [4, "iv"],
    [1, "i"],
  ];

  let result = "";
  for (const [value, numeral] of romanNumerals) {
    while (num >= value) {
      result += numeral;
      num -= value;
    }
  }
  return result;
}

/**
 * Get localized Pokémon name
 */
export function getLocalizedPokemonName(
  species: PokemonSpeciesData,
  lang: "fr" | "en" = "fr"
): string {
  const nameEntry = species.names.find((n) => n.language.name === lang);
  if (nameEntry) return nameEntry.name;
  
  // Fallback to English
  const enEntry = species.names.find((n) => n.language.name === "en");
  return enEntry ? enEntry.name : species.name;
}

/**
 * Get localized genus (category)
 */
export function getLocalizedGenus(
  species: PokemonSpeciesData,
  lang: "fr" | "en" = "fr"
): string | null {
  const genusEntry = species.genera.find((g) => g.language.name === lang);
  if (genusEntry) return genusEntry.genus;
  
  // Fallback to English
  const enEntry = species.genera.find((g) => g.language.name === "en");
  return enEntry ? enEntry.genus : null;
}
