export type User = {
  id: string;
  username: string;
  passwordHash: string;
  createdAt: string;
};

export type TeamSlot = {
  slot: number; // 1..6
  pokemonId: number;
  pokemonName: string;
};

export type Session = {
  token: string;
  userId: string;
  username: string;
  createdAt: string;
};

export type PokemonBasic = {
  id: number;
  name: string;
  sprite: string | null;
  backSprite?: string | null;
  types: string[];
  region?: string | null;
};

export type PokemonDetail = PokemonBasic & {
  heightDecimeters: number;
  weightHectograms: number;
  stats: { name: string; value: number }[];
  generation?: string | null;
  region?: string | null;
  cry?: { latest?: string | null; legacy?: string | null } | null;
  evolutionStage?: number | null; // 1 = base, 2 = stage 1, 3 = stage 2
  evolutionIds?: number[];        // ids des évolutions possibles (toutes branches)

};

export type PokemonQueryParams = {
  page: number;
  pageSize: number;
  q?: string;
  type?: string;
  region?: string;
  sort?: "id" | "name" | "height" | "weight" | "total" | "hp" | "attack" | "defense" | "speed";
  order?: "asc" | "desc";
};

export type PokemonQueryResult = {
  items: PokemonBasic[];
  total: number;
  totalPages: number;
};
