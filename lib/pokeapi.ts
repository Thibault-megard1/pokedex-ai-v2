import path from "path";
import { promises as fs } from "fs";
import { DATA_DIR, ensureDir, writeJsonFile } from "@/lib/utils";
import type { PokemonBasic, PokemonDetail, PokemonQueryParams, PokemonQueryResult, Nature } from "@/lib/types";
import { generationToRegion } from "@/lib/regions";

const CACHE_DIR = path.join(DATA_DIR, "pokemon-cache");

// Liste des natures Pokémon (fixe)
const POKEMON_NATURES: Nature[] = [
  { name: "hardy", increasedStat: null, decreasedStat: null },
  { name: "lonely", increasedStat: "attack", decreasedStat: "defense" },
  { name: "brave", increasedStat: "attack", decreasedStat: "speed" },
  { name: "adamant", increasedStat: "attack", decreasedStat: "special-attack" },
  { name: "naughty", increasedStat: "attack", decreasedStat: "special-defense" },
  { name: "bold", increasedStat: "defense", decreasedStat: "attack" },
  { name: "docile", increasedStat: null, decreasedStat: null },
  { name: "relaxed", increasedStat: "defense", decreasedStat: "speed" },
  { name: "impish", increasedStat: "defense", decreasedStat: "special-attack" },
  { name: "lax", increasedStat: "defense", decreasedStat: "special-defense" },
  { name: "timid", increasedStat: "speed", decreasedStat: "attack" },
  { name: "hasty", increasedStat: "speed", decreasedStat: "defense" },
  { name: "serious", increasedStat: null, decreasedStat: null },
  { name: "jolly", increasedStat: "speed", decreasedStat: "special-attack" },
  { name: "naive", increasedStat: "speed", decreasedStat: "special-defense" },
  { name: "modest", increasedStat: "special-attack", decreasedStat: "attack" },
  { name: "mild", increasedStat: "special-attack", decreasedStat: "defense" },
  { name: "quiet", increasedStat: "special-attack", decreasedStat: "speed" },
  { name: "bashful", increasedStat: null, decreasedStat: null },
  { name: "rash", increasedStat: "special-attack", decreasedStat: "special-defense" },
  { name: "calm", increasedStat: "special-defense", decreasedStat: "attack" },
  { name: "gentle", increasedStat: "special-defense", decreasedStat: "defense" },
  { name: "sassy", increasedStat: "special-defense", decreasedStat: "speed" },
  { name: "careful", increasedStat: "special-defense", decreasedStat: "special-attack" },
  { name: "quirky", increasedStat: null, decreasedStat: null },
];

// Fonction pour récupérer toutes les natures
async function getAllNatures(): Promise<Nature[]> {
  return POKEMON_NATURES;
}

// Type pour les nœuds d'évolution
export type EvolutionNode = {
  id: number;
  name: string;
  level?: number;
  item?: string;
  trigger?: string;
  evolvesTo?: EvolutionNode[];
};

// Fonction pour extraire l'ID d'une URL
function extractIdFromUrl(url: string): number {
  const id = url.split("/").filter(Boolean).pop();
  return id ? parseInt(id, 10) : 0;
}

// Fonction pour aplatir la chaîne d'évolution
function flattenEvolutionChain(chain: any, acc: EvolutionNode[] = []): EvolutionNode[] {
  if (!chain) return acc;

  const id = extractIdFromUrl(chain.species?.url);
  const name = chain.species?.name;
  const node: EvolutionNode = { id, name };

  if (chain.evolution_details?.length) {
    const details = chain.evolution_details[0];
    if (details.min_level) node.level = details.min_level;
    if (details.item) node.item = details.item.name;
    if (details.trigger) node.trigger = details.trigger.name;
  }

  acc.push(node);

  if (chain.evolves_to?.length) {
    for (const evolve of chain.evolves_to) {
      flattenEvolutionChain(evolve, acc);
    }
  }

  return acc;
}

function normalizeName(name: string) {
  return name.toLowerCase().trim();
}

async function cachePathFor(nameOrId: string) {
  await ensureDir(CACHE_DIR);
  return path.join(CACHE_DIR, `${normalizeName(nameOrId)}.json`);
}

async function fetchJson(url: string) {
  const res = await fetch(url, { next: { revalidate: 60 } });
  if (!res.ok) throw new Error(`PokéAPI error: ${res.status}`);
  return res.json();
}

function statValue(p: PokemonDetail, key: string) {
  return p.stats.find(s => s.name === key)?.value ?? 0;
}
function totalStats(p: PokemonDetail) {
  return p.stats.reduce((acc, s) => acc + (Number(s.value) || 0), 0);
}
function compare(a: number | string, b: number | string) {
  if (typeof a === "string" && typeof b === "string") return a.localeCompare(b);
  return Number(a) - Number(b);
}

export async function getPokemonDetail(nameOrId: string): Promise<PokemonDetail> {
  const p = await cachePathFor(nameOrId);

  try {
    const raw = await fs.readFile(p, "utf-8");
    const cached = JSON.parse(raw) as PokemonDetail;
    
    // Vérifier si le cache contient les nouveaux champs (moves, natures, shinySprite)
    // Si non, on recharge depuis l'API
    if (cached.moves !== undefined && cached.natures !== undefined && cached.shinySprite !== undefined) {
      return cached;
    }
    // Si les nouveaux champs ne sont pas présents, on continue pour refetch
  } catch {
    // miss ou erreur de lecture
  }

  const pokemon = await fetchJson(`https://pokeapi.co/api/v2/pokemon/${normalizeName(nameOrId)}`);
  const species = await fetchJson(pokemon.species?.url);

  const types = (pokemon.types ?? []).map((t: any) => t.type?.name).filter(Boolean);

  const sprite = pokemon.sprites?.front_default ?? null;
  const backSprite = pokemon.sprites?.back_default ?? null;
  const shinySprite = pokemon.sprites?.front_shiny ?? null;

  const stats = (pokemon.stats ?? []).map((s: any) => ({
    name: s.stat?.name ?? "unknown",
    value: Number(s.base_stat ?? 0)
  }));

  // Récupération des attaques
  const moves: any[] = [];
  if (pokemon.moves && Array.isArray(pokemon.moves)) {
    for (const moveData of pokemon.moves) {
      const moveName = moveData.move?.name ?? "";
      
      // Parcourir les différentes méthodes d'apprentissage
      for (const versionDetail of moveData.version_group_details ?? []) {
        const method = versionDetail.move_learn_method?.name ?? "";
        const level = versionDetail.level_learned_at ?? 0;
        
        if (method === "level-up") {
          moves.push({
            name: moveName,
            learnMethod: "level-up",
            levelLearnedAt: level
          });
        } else if (method === "machine") {
          moves.push({
            name: moveName,
            learnMethod: "machine",
            machineNumber: `TM/HM` // PokéAPI ne donne pas toujours le numéro exact
          });
        } else if (method === "tutor") {
          moves.push({
            name: moveName,
            learnMethod: "tutor"
          });
        } else if (method === "egg") {
          moves.push({
            name: moveName,
            learnMethod: "egg"
          });
        }
      }
    }
  }

  // Dédupliquer les attaques (même attaque, même méthode, même niveau)
  const uniqueMoves = Array.from(
    new Map(
      moves.map(m => [
        `${m.name}-${m.learnMethod}-${m.levelLearnedAt ?? ""}`,
        m
      ])
    ).values()
  );

  // Récupération de toutes les natures Pokémon (liste fixe)
  const natures = await getAllNatures();

  const generation = species.generation?.name ?? null;
  const region = generationToRegion(generation);

  // Ajout de la gestion des évolutions dans getPokemonDetail
  let evolutionStage: number | null = null;
  let evolutionIds: number[] = [];

  try {
    const chainUrl = species.evolution_chain?.url;
    if (chainUrl) {
      const chainData = await fetchJson(chainUrl);
      const stages = flattenEvolutionChain(chainData.chain);

      // stage du pokemon actuel (1..n)
      for (let i = 0; i < stages.length; i++) {
        if (stages[i].id === Number(pokemon.id)) {
          evolutionStage = i + 1;
          break;
        }
      }

      // ids des évolutions = tous les ids des stages après son stage
      if (evolutionStage != null) {
        const after = stages.slice(evolutionStage); // ex: si stage=1 -> on prend stage 2+
        evolutionIds = after.map(node => node.id).filter(id => id !== Number(pokemon.id));
      } else {
        // fallback: tout sauf lui
        evolutionIds = stages.map(node => node.id).filter(id => id !== Number(pokemon.id));
      }

      // enlève doublons
      evolutionIds = Array.from(new Set(evolutionIds));
    }
  } catch {
    // si PokéAPI rate, on laisse null / []
  }

  const detail: PokemonDetail = {
    id: pokemon.id,
    name: pokemon.name,
    sprite,
    backSprite,
    shinySprite,
    types,
    heightDecimeters: Number(pokemon.height ?? 0),
    weightHectograms: Number(pokemon.weight ?? 0),
    stats,
    generation,
    region,
    cry: pokemon.cries ?? null,
    moves: uniqueMoves,
    natures,
    // Ajout des champs evolutionStage et evolutionIds dans detail
    evolutionStage,
    evolutionIds,
  };

  await writeJsonFile(p, detail);
  return detail;
}

export async function queryPokemon(params: PokemonQueryParams): Promise<PokemonQueryResult> {
  const page = Math.max(1, params.page);
  const pageSize = Math.max(1, params.pageSize);
  const q = normalizeName(params.q ?? "");
  const filterType = normalizeName(params.type ?? "");
  const filterRegion = (params.region ?? "").trim();

  const sort = params.sort ?? "id";
  const order = params.order ?? "asc";

  const all = await fetchJson(`https://pokeapi.co/api/v2/pokemon?offset=0&limit=100000`);
  const names: string[] = (all.results ?? []).map((r: any) => r.name);

  let candidates = q ? names.filter(n => n.includes(q)) : names;

  const needsDetails =
    Boolean(filterType) ||
    Boolean(filterRegion) ||
    sort === "id" ||
    ["height","weight","total","hp","attack","defense","speed"].includes(sort);

  if (needsDetails) {
    const tmp: PokemonDetail[] = [];
    for (const name of candidates) {
      const d = await getPokemonDetail(name);
      if (filterType && !d.types.includes(filterType)) continue;
      if (filterRegion && d.region !== filterRegion) continue;
      tmp.push(d);
    }

    tmp.sort((A, B) => {
      let va: number | string = A.id;
      let vb: number | string = B.id;

      if (sort === "id") { va = A.id; vb = B.id; }
      if (sort === "name") { va = A.name; vb = B.name; }
      if (sort === "height") { va = A.heightDecimeters; vb = B.heightDecimeters; }
      if (sort === "weight") { va = A.weightHectograms; vb = B.weightHectograms; }
      if (sort === "total") { va = totalStats(A); vb = totalStats(B); }
      if (sort === "hp") { va = statValue(A,"hp"); vb = statValue(B,"hp"); }
      if (sort === "attack") { va = statValue(A,"attack"); vb = statValue(B,"attack"); }
      if (sort === "defense") { va = statValue(A,"defense"); vb = statValue(B,"defense"); }
      if (sort === "speed") { va = statValue(A,"speed"); vb = statValue(B,"speed"); }

      const c = compare(va, vb);
      return order === "desc" ? -c : c;
    });

    const total = tmp.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const start = (page - 1) * pageSize;
    const slice = tmp.slice(start, start + pageSize);

    return {
      items: slice.map(d => ({
        id: d.id,
        name: d.name,
        sprite: d.sprite,
        backSprite: d.backSprite ?? null,
        types: d.types,
        region: d.region ?? null
      })),
      total,
      totalPages
    };
  }

  candidates.sort((a, b) => order === "desc" ? b.localeCompare(a) : a.localeCompare(b));

  const total = candidates.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = (page - 1) * pageSize;
  const slice = candidates.slice(start, start + pageSize);

  const items = await Promise.all(slice.map(async (n) => {
    const d = await getPokemonDetail(n);
    return { id: d.id, name: d.name, sprite: d.sprite, backSprite: d.backSprite ?? null, types: d.types } as PokemonBasic;
  }));

  return { items, total, totalPages };
}

export async function getAdjacentPokemonId(id: number, dir: "prev" | "next") {
  const MIN = 1;
  const MAX = 1025; // Pokédex national (ajuste si besoin)

  if (dir === "next") {
    return id >= MAX ? MIN : id + 1;
  }

  // dir === "prev"
  return id <= MIN ? MAX : id - 1;
}

// Récupère la chaîne d'évolution complète d'un Pokémon
export async function getPokemonEvolutionChain(pokemonId: number): Promise<EvolutionNode[]> {
  const speciesUrl = `https://pokeapi.co/api/v2/pokemon-species/${pokemonId}`;
  const speciesData = await fetchJson(speciesUrl);

  const evolutionChainUrl = speciesData.evolution_chain?.url;
  if (!evolutionChainUrl) return [];

  const evolutionData = await fetchJson(evolutionChainUrl);
  return flattenEvolutionChain(evolutionData.chain);
}

