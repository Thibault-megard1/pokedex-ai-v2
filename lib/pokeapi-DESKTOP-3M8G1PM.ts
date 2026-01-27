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
  frenchName?: string;
  level?: number;
  item?: string;
  trigger?: string;
  evolvesTo?: EvolutionNode[];
};

export type EvolutionTree = {
  base: EvolutionNode;
  stages: EvolutionNode[][];
};

// Fonction pour extraire l'ID d'une URL
function extractIdFromUrl(url: string): number {
  const id = url.split("/").filter(Boolean).pop();
  return id ? parseInt(id, 10) : 0;
}

// Fonction pour construire l'arbre d'évolution complet
async function buildEvolutionTreeWithNames(chain: any): Promise<EvolutionNode> {
  if (!chain) return { id: 0, name: "unknown" };

  const id = extractIdFromUrl(chain.species?.url);
  const name = chain.species?.name;
  
  // Récupérer le nom français depuis species
  let frenchName: string | undefined = undefined;
  try {
    if (chain.species?.url) {
      const speciesData = await fetchJson(chain.species.url);
      frenchName = speciesData.names?.find((n: any) => n.language?.name === "fr")?.name ?? undefined;
    }
  } catch (e) {
    // Ignorer l'erreur et continuer sans le nom français
  }
  
  const node: EvolutionNode = { id, name, frenchName };

  if (chain.evolution_details?.length) {
    const details = chain.evolution_details[0];
    if (details.min_level) node.level = details.min_level;
    if (details.item) node.item = details.item.name;
    if (details.trigger) node.trigger = details.trigger.name;
  }

  if (chain.evolves_to?.length) {
    node.evolvesTo = await Promise.all(
      chain.evolves_to.map((evolve: any) => buildEvolutionTreeWithNames(evolve))
    );
  }

  return node;
}

// Fonction pour construire l'arbre d'évolution complet (synchrone, sans noms français)
function buildEvolutionTree(chain: any): EvolutionNode {
  if (!chain) return { id: 0, name: "unknown" };

  const id = extractIdFromUrl(chain.species?.url);
  const name = chain.species?.name;
  const node: EvolutionNode = { id, name };

  if (chain.evolution_details?.length) {
    const details = chain.evolution_details[0];
    if (details.min_level) node.level = details.min_level;
    if (details.item) node.item = details.item.name;
    if (details.trigger) node.trigger = details.trigger.name;
  }

  if (chain.evolves_to?.length) {
    node.evolvesTo = chain.evolves_to.map((evolve: any) => buildEvolutionTree(evolve));
  }

  return node;
}

// Fonction pour aplatir la chaîne d'évolution (legacy pour compatibilité)
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
  if (!res.ok) {
    console.error(`PokéAPI error: ${res.status} for URL: ${url}`);
    throw new Error(`PokéAPI error: ${res.status} for URL: ${url}`);
  }
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
    
    // Vérifier si le cache contient les nouveaux champs (moves, natures, shinySprite, frenchName, forms)
    // Si non, on recharge depuis l'API
    if (cached.moves !== undefined && 
        cached.natures !== undefined && 
        cached.shinySprite !== undefined &&
        cached.frenchName !== undefined &&
        cached.forms !== undefined) {
      return cached;
    }
    // Si les nouveaux champs ne sont pas présents, on continue pour refetch
  } catch {
    // miss ou erreur de lecture
  }

  const pokemon = await fetchJson(`https://pokeapi.co/api/v2/pokemon/${normalizeName(nameOrId)}`);
  
  // Vérifier que l'URL de species existe avant de la fetch
  if (!pokemon.species?.url) {
    throw new Error(`Pokemon ${nameOrId} has no species data`);
  }
  
  const species = await fetchJson(pokemon.species.url);

  const types = (pokemon.types ?? []).map((t: any) => t.type?.name).filter(Boolean);

  // Sprites avec fallback simple
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

  // Récupération du nom français
  const frenchName = species.names?.find((n: any) => n.language?.name === "fr")?.name ?? null;

  // Récupération des formes alternatives (mega, gmax, régionales, etc.)
  const forms: any[] = [];
  try {
    if (species.varieties && Array.isArray(species.varieties)) {
      for (const variety of species.varieties) {
        // Ignorer la forme par défaut
        if (variety.is_default) continue;

        const varietyName = variety.pokemon?.name;
        if (!varietyName) continue;

        try {
          const formData = await fetchJson(`https://pokeapi.co/api/v2/pokemon/${varietyName}`);
          
          const formTypes = (formData.types ?? []).map((t: any) => t.type?.name).filter(Boolean);
          const formStats = (formData.stats ?? []).map((s: any) => ({
            name: s.stat?.name ?? "unknown",
            value: Number(s.base_stat ?? 0)
          }));

          const formSprite = formData.sprites?.front_default ?? null;

          // Déterminer le type de forme
          const isMega = varietyName.includes("mega");
          const isGmax = varietyName.includes("gmax");
          const isRegionalForm = varietyName.includes("alola") || varietyName.includes("galar") || varietyName.includes("hisui") || varietyName.includes("paldea");
          
          let formName = varietyName.replace(pokemon.name + "-", "");
          if (isMega) formName = "Méga-Évolution";
          else if (isGmax) formName = "Gigamax";
          else if (varietyName.includes("alola")) formName = "Forme d'Alola";
          else if (varietyName.includes("galar")) formName = "Forme de Galar";
          else if (varietyName.includes("hisui")) formName = "Forme de Hisui";
          else if (varietyName.includes("paldea")) formName = "Forme de Paldea";

          forms.push({
            id: formData.id,
            name: varietyName,
            frenchName: null, // TODO: récupérer depuis species si nécessaire
            formName,
            sprite: formSprite,
            types: formTypes,
            stats: formStats,
            isMega,
            isGmax,
            isRegionalForm
          });
        } catch (e) {
          console.warn(`Could not fetch form data for ${varietyName}:`, e);
        }
      }
    }
  } catch (e) {
    console.warn(`Could not fetch forms for ${pokemon.name}:`, e);
  }

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
    frenchName,
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
    forms,
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
  const includeForms = params.includeForms ?? false;

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

    // Si includeForms est activé, ajouter les formes alternatives
    let finalItems: PokemonBasic[] = slice.map(d => ({
      id: d.id,
      name: d.name,
      frenchName: d.frenchName,
      sprite: d.sprite,
      backSprite: d.backSprite ?? null,
      types: d.types,
      region: d.region ?? null
    }));

    if (includeForms) {
      // Ajouter les méga-évolutions et Gigamax de chaque Pokémon
      const formItems: PokemonBasic[] = [];
      for (const d of slice) {
        if (d.forms && d.forms.length > 0) {
          for (const form of d.forms) {
            // Filtrer selon le type si nécessaire
            if (filterType && !form.types.includes(filterType)) continue;
            
            formItems.push({
              id: form.id,
              name: form.name,
              frenchName: form.frenchName ?? null,
              sprite: form.sprite,
              backSprite: null,
              types: form.types,
              region: d.region ?? null
            });
          }
        }
      }
      finalItems = [...finalItems, ...formItems];
    }

    return {
      items: finalItems,
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
  const MAX = 10325; // Pokédex complet incluant toutes les formes

  if (dir === "next") {
    // Après 1025, passer à 10001
    if (id === 1025) return 10001;
    // Après 10325, revenir à 1
    if (id >= MAX) return MIN;
    return id + 1;
  }

  // dir === "prev"
  // Avant 10001, revenir à 1025
  if (id === 10001) return 1025;
  // Avant 1, aller à 10325
  if (id <= MIN) return MAX;
  return id - 1;
}

// Récupère l'arbre d'évolution complet d'un Pokémon
export async function getPokemonEvolutionTree(pokemonId: number): Promise<EvolutionNode | null> {
  try {
    const speciesUrl = `https://pokeapi.co/api/v2/pokemon-species/${pokemonId}`;
    const speciesData = await fetchJson(speciesUrl);

    const evolutionChainUrl = speciesData.evolution_chain?.url;
    if (!evolutionChainUrl) {
      console.warn(`No evolution chain URL for pokemon ${pokemonId}`);
      return null;
    }

    const evolutionData = await fetchJson(evolutionChainUrl);
    return await buildEvolutionTreeWithNames(evolutionData.chain);
  } catch (error) {
    console.error(`Error fetching evolution tree for pokemon ${pokemonId}:`, error);
    return null;
  }
}

// Récupère la chaîne d'évolution complète d'un Pokémon (legacy, aplatie)
export async function getPokemonEvolutionChain(pokemonId: number): Promise<EvolutionNode[]> {
  try {
    const speciesUrl = `https://pokeapi.co/api/v2/pokemon-species/${pokemonId}`;
    const speciesData = await fetchJson(speciesUrl);

    const evolutionChainUrl = speciesData.evolution_chain?.url;
    if (!evolutionChainUrl) {
      console.warn(`No evolution chain URL for pokemon ${pokemonId}`);
      return [];
    }

    const evolutionData = await fetchJson(evolutionChainUrl);
    return flattenEvolutionChain(evolutionData.chain);
  } catch (error) {
    console.error(`Error fetching evolution chain for pokemon ${pokemonId}:`, error);
    return [];
  }
}

