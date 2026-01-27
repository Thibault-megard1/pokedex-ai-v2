// Pokemon categories for team building

export const STARTERS = [
  "bulbasaur", "charmander", "squirtle",
  "chikorita", "cyndaquil", "totodile",
  "treecko", "torchic", "mudkip",
  "turtwig", "chimchar", "piplup",
  "snivy", "tepig", "oshawott",
  "chespin", "fennekin", "froakie",
  "rowlet", "litten", "popplio",
  "grookey", "scorbunny", "sobble",
  "sprigatito", "fuecoco", "quaxly"
];

export const EARLY_ROUTE_POKEMON = [
  "pidgey", "rattata", "spearow", "caterpie", "weedle",
  "hoothoot", "sentret", "ledyba", "spinarak",
  "poochyena", "zigzagoon", "wurmple", "taillow",
  "starly", "bidoof", "kricketot",
  "patrat", "lillipup", "purrloin",
  "bunnelby", "fletchling", "scatterbug",
  "pikipek", "yungoos", "grubbin",
  "skwovet", "rookidee", "blipbug",
  "lechonk", "tarountula"
];

export const LEGENDARY_POKEMON = [
  "articuno", "zapdos", "moltres", "mewtwo", "mew",
  "raikou", "entei", "suicune", "lugia", "ho-oh", "celebi",
  "regirock", "regice", "registeel", "latias", "latios", "kyogre", "groudon", "rayquaza", "jirachi", "deoxys",
  "uxie", "mesprit", "azelf", "dialga", "palkia", "heatran", "regigigas", "giratina", "cresselia", "phione", "manaphy", "darkrai", "shaymin", "arceus",
  "victini", "cobalion", "terrakion", "virizion", "tornadus", "thundurus", "reshiram", "zekrom", "landorus", "kyurem", "keldeo", "meloetta", "genesect",
  "xerneas", "yveltal", "zygarde", "diancie", "hoopa", "volcanion",
  "type-null", "silvally", "tapu-koko", "tapu-lele", "tapu-bulu", "tapu-fini", "cosmog", "cosmoem", "solgaleo", "lunala", "nihilego", "buzzwole", "pheromosa", "xurkitree", "celesteela", "kartana", "guzzlord", "necrozma", "magearna", "marshadow", "poipole", "naganadel", "stakataka", "blacephalon", "zeraora", "meltan", "melmetal",
  "zacian", "zamazenta", "eternatus", "kubfu", "urshifu", "zarude", "regieleki", "regidrago", "glastrier", "spectrier", "calyrex",
  "enamorus", "wo-chien", "chien-pao", "ting-lu", "chi-yu", "koraidon", "miraidon", "walking-wake", "iron-leaves", "okidogi", "munkidori", "fezandipiti", "ogerpon", "terapagos", "pecharunt"
];

export function isPokemonStarter(name: string): boolean {
  return STARTERS.includes(name.toLowerCase());
}

export function isPokemonEarlyRoute(name: string): boolean {
  return EARLY_ROUTE_POKEMON.includes(name.toLowerCase());
}

export function isPokemonLegendary(name: string): boolean {
  return LEGENDARY_POKEMON.includes(name.toLowerCase());
}

export function getPokemonCategory(name: string): "starter" | "early-route" | "legendary" | "standard" {
  const lower = name.toLowerCase();
  if (STARTERS.includes(lower)) return "starter";
  if (EARLY_ROUTE_POKEMON.includes(lower)) return "early-route";
  if (LEGENDARY_POKEMON.includes(lower)) return "legendary";
  return "standard";
}
