export function backgroundForPokedex(region?: string, type?: string): string {
  const r = (region ?? "").trim();
  const t = (type ?? "").trim().toLowerCase();

  if (r) return `/backgrounds/regions/${r.toLowerCase()}.jpg`;
  if (t) return `/backgrounds/types/${t}.jpg`;
  return `/backgrounds/pokedex.jpg`;
}

export const BACKGROUNDS = {
  home: "/backgrounds/home.jpg",
  team: "/backgrounds/team.jpg",
  auth: "/backgrounds/auth.jpg",
  battle: "/backgrounds/battle-arena.jpg",
  compare: "/backgrounds/compare.jpg"
};

export function cardBackgroundForPokemon(p: { id: number; region?: string | null; types: string[] }): string {
  // 1 chance sur 2: région si dispo, sinon type
  const useRegion = (p.id % 2 === 0); // stable (pas random à chaque reload)
  if (useRegion && p.region) {
    return `/backgrounds/regions/${p.region.toLowerCase()}.jpg`;
  }

  // fallback type: prend un type "pseudo-aléatoire" stable
  const idx = p.types.length ? (p.id % p.types.length) : 0;
  const t = (p.types[idx] ?? "normal").toLowerCase();
  return `/backgrounds/types/${t}.jpg`;
}

export function backgroundForPokemonDetail(p: { id: number; region?: string | null; types: string[] }): string {
  // "aléatoire" mais stable : basé sur l'id
  const pickRegion = (p.id % 2 === 0);

  if (pickRegion && p.region) {
    return `/backgrounds/regions/${p.region.toLowerCase()}.jpg`;
  }

  const idx = p.types.length ? (p.id % p.types.length) : 0;
  const t = (p.types[idx] ?? "normal").toLowerCase();
  return `/backgrounds/types/${t}.jpg`;
}
