import path from "path";
import { promises as fs } from "fs";
import { DATA_DIR, ensureDir, writeJsonFile } from "@/lib/utils";
import type { PokemonBasic, PokemonDetail, PokemonQueryParams, PokemonQueryResult } from "@/lib/types";
import { generationToRegion } from "@/lib/regions";

const CACHE_DIR = path.join(DATA_DIR, "pokemon-cache");

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
    return JSON.parse(raw) as PokemonDetail;
  } catch {
    // miss
  }

  const pokemon = await fetchJson(`https://pokeapi.co/api/v2/pokemon/${normalizeName(nameOrId)}`);
  const species = await fetchJson(pokemon.species?.url);

  const types = (pokemon.types ?? []).map((t: any) => t.type?.name).filter(Boolean);

  const sprite = pokemon.sprites?.front_default ?? null;
  const backSprite = pokemon.sprites?.back_default ?? null;

  const stats = (pokemon.stats ?? []).map((s: any) => ({
    name: s.stat?.name ?? "unknown",
    value: Number(s.base_stat ?? 0)
  }));

  const generation = species.generation?.name ?? null;
  const region = generationToRegion(generation);

  const detail: PokemonDetail = {
    id: pokemon.id,
    name: pokemon.name,
    sprite,
    backSprite,
    types,
    heightDecimeters: Number(pokemon.height ?? 0),
    weightHectograms: Number(pokemon.weight ?? 0),
    stats,
    generation,
    region,
    cry: pokemon.cries ?? null
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
