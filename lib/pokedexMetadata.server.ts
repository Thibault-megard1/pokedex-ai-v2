/**
 * Pokédex Metadata System - SERVER-SIDE ONLY
 * Contains Node.js-dependent caching functions
 * This file should ONLY be imported in API routes or server components
 */

import path from "path";
import { promises as fs } from "fs";
import { DATA_DIR, ensureDir } from "@/lib/utils";
import type { GenerationInfo, VersionGroupInfo, VersionInfo } from "./pokedexMetadata";
import { getGenerationRegion } from "./pokedexMetadata";

const METADATA_CACHE_DIR = path.join(DATA_DIR, "pokemon-cache", "meta");

/**
 * Fetch and cache all generations from PokéAPI
 */
export async function fetchAndCacheGenerations(): Promise<GenerationInfo[]> {
  await ensureDir(METADATA_CACHE_DIR);
  const cachePath = path.join(METADATA_CACHE_DIR, "generations.json");

  // Check cache first
  try {
    const cached = await fs.readFile(cachePath, "utf-8");
    return JSON.parse(cached);
  } catch (err) {
    // Cache miss, fetch from API
  }

  try {
    const response = await fetch("https://pokeapi.co/api/v2/generation?limit=20");
    if (!response.ok) throw new Error("Failed to fetch generations");
    
    const data = await response.json();
    const generations: GenerationInfo[] = [];

    for (const gen of data.results) {
      const genResponse = await fetch(gen.url);
      const genData = await genResponse.json();
      
      generations.push({
        id: genData.id,
        name: genData.name,
        region: getGenerationRegion(genData.name),
        versionGroups: genData.version_groups.map((vg: any) => vg.name),
      });
    }

    // Sort by ID
    generations.sort((a, b) => a.id - b.id);

    // Cache the result
    await fs.writeFile(cachePath, JSON.stringify(generations, null, 2));
    return generations;
  } catch (error) {
    console.error("Error fetching generations:", error);
    return [];
  }
}

/**
 * Fetch and cache all version groups from PokéAPI
 */
export async function fetchAndCacheVersionGroups(): Promise<VersionGroupInfo[]> {
  await ensureDir(METADATA_CACHE_DIR);
  const cachePath = path.join(METADATA_CACHE_DIR, "version-groups.json");

  // Check cache first
  try {
    const cached = await fs.readFile(cachePath, "utf-8");
    return JSON.parse(cached);
  } catch (err) {
    // Cache miss, fetch from API
  }

  try {
    const response = await fetch("https://pokeapi.co/api/v2/version-group?limit=50");
    if (!response.ok) throw new Error("Failed to fetch version groups");
    
    const data = await response.json();
    const versionGroups: VersionGroupInfo[] = [];

    for (const vg of data.results) {
      const vgResponse = await fetch(vg.url);
      const vgData = await vgResponse.json();
      
      versionGroups.push({
        name: vgData.name,
        generation: vgData.generation.name,
        versions: vgData.versions,
        order: vgData.order || 0,
      });
    }

    // Sort by order
    versionGroups.sort((a, b) => a.order - b.order);

    // Cache the result
    await fs.writeFile(cachePath, JSON.stringify(versionGroups, null, 2));
    return versionGroups;
  } catch (error) {
    console.error("Error fetching version groups:", error);
    return [];
  }
}

/**
 * Fetch and cache all versions from PokéAPI
 */
export async function fetchAndCacheVersions(): Promise<VersionInfo[]> {
  await ensureDir(METADATA_CACHE_DIR);
  const cachePath = path.join(METADATA_CACHE_DIR, "versions.json");

  // Check cache first
  try {
    const cached = await fs.readFile(cachePath, "utf-8");
    return JSON.parse(cached);
  } catch (err) {
    // Cache miss, fetch from API
  }

  try {
    const response = await fetch("https://pokeapi.co/api/v2/version?limit=50");
    if (!response.ok) throw new Error("Failed to fetch versions");
    
    const data = await response.json();
    
    // Cache the result
    await fs.writeFile(cachePath, JSON.stringify(data.results, null, 2));
    return data.results;
  } catch (error) {
    console.error("Error fetching versions:", error);
    return [];
  }
}

/**
 * Get versions for a specific generation
 */
export async function getVersionsForGeneration(generationId: number): Promise<string[]> {
  const generations = await fetchAndCacheGenerations();
  const versionGroups = await fetchAndCacheVersionGroups();
  
  const generation = generations.find(g => g.id === generationId);
  if (!generation) return [];

  const versions: string[] = [];
  for (const vgName of generation.versionGroups) {
    const vg = versionGroups.find(g => g.name === vgName);
    if (vg) {
      versions.push(...vg.versions.map(v => v.name));
    }
  }

  return versions;
}

/**
 * Get generation for a specific version
 */
export async function getGenerationForVersion(versionName: string): Promise<number | null> {
  const versionGroups = await fetchAndCacheVersionGroups();
  const generations = await fetchAndCacheGenerations();

  for (const vg of versionGroups) {
    if (vg.versions.some(v => v.name === versionName)) {
      const gen = generations.find(g => g.name === vg.generation);
      return gen ? gen.id : null;
    }
  }

  return null;
}

/**
 * Get all metadata at once
 */
export async function getAllMetadata() {
  const [generations, versionGroups, versions] = await Promise.all([
    fetchAndCacheGenerations(),
    fetchAndCacheVersionGroups(),
    fetchAndCacheVersions(),
  ]);

  return { generations, versionGroups, versions };
}
