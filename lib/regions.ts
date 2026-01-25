export function generationToRegion(gen: string | null | undefined): string | null {
  if (!gen) return null;
  const g = gen.toLowerCase();
  if (g.includes("generation-i")) return "Kanto";
  if (g.includes("generation-ii")) return "Johto";
  if (g.includes("generation-iii")) return "Hoenn";
  if (g.includes("generation-iv")) return "Sinnoh";
  if (g.includes("generation-v")) return "Unova";
  if (g.includes("generation-vi")) return "Kalos";
  if (g.includes("generation-vii")) return "Alola";
  if (g.includes("generation-viii")) return "Galar";
  if (g.includes("generation-ix")) return "Paldea";
  return null;
}

export const REGION_OPTIONS = [
  "Kanto","Johto","Hoenn","Sinnoh","Unova","Kalos","Alola","Galar","Paldea"
] as const;

export const TYPE_OPTIONS = [
  "normal","fire","water","electric","grass","ice","fighting","poison","ground","flying",
  "psychic","bug","rock","ghost","dragon","dark","steel","fairy"
] as const;
