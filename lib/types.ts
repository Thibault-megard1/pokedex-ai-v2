export type User = {
  id: string;
  username: string;
  passwordHash: string;
  createdAt: string;
  isAdmin?: boolean; // Optional to support existing users
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
  frenchName?: string | null;
  sprite: string | null;
  backSprite?: string | null;
  types: string[];
  region?: string | null;
};

export type Move = {
  name: string;
  type?: string; // Type de l'attaque (fire, water, etc.)
  learnMethod: string; // "level-up" | "machine" | "tutor" | "egg"
  levelLearnedAt?: number;
  machineNumber?: string; // "TM01", "HM05", etc.
};

export type Nature = {
  name: string;
  increasedStat?: string | null;
  decreasedStat?: string | null;
};

export type PokemonForm = {
  id: number;
  name: string;
  frenchName?: string | null;
  formName: string; // "mega", "alola", "galar", "gmax", etc.
  sprite: string | null;
  types: string[];
  stats: { name: string; value: number }[];
  isMega?: boolean;
  isGmax?: boolean;
  isRegionalForm?: boolean;
  formType?: "mega" | "gmax" | "regional" | "other";
  requiredItem?: string | null;
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
  shinySprite?: string | null;    // sprite shiny
  moves?: Move[];                 // liste des attaques
  natures?: Nature[];             // natures possibles (toutes les natures Pokémon)
  forms?: PokemonForm[];          // formes alternatives (mega, gmax, régionales, etc.)
};

export type PokemonQueryParams = {
  page: number;
  pageSize: number;
  q?: string;
  type?: string;
  region?: string;
  sort?: "id" | "name" | "height" | "weight" | "total" | "hp" | "attack" | "defense" | "speed";
  order?: "asc" | "desc";
  includeForms?: boolean; // Inclure les méga-évolutions et Gigamax dans les résultats
};

export type PokemonQueryResult = {
  items: PokemonBasic[];
  total: number;
  totalPages: number;
};
