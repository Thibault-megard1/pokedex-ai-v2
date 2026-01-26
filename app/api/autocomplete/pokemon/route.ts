import { NextResponse } from "next/server";

export async function GET(req: Request) {
  // Renvoie jusqu'à 20 noms de Pokémon qui commencent par la requête q.
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").toLowerCase();

  if (!q) return NextResponse.json({ items: [] });

  const res = await fetch("https://pokeapi.co/api/v2/pokemon?limit=2000");
  const data = await res.json();

  const items = (data.results ?? [])
    .map((p: any) => p.name)
    .filter((name: string) => name.startsWith(q))
    .slice(0, 20);

  return NextResponse.json({ items });
}
