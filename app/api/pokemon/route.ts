import { NextResponse } from "next/server";
import { z } from "zod";
import { getPokemonDetail } from "@/lib/pokeapi";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const name = url.searchParams.get("name") ?? "";
  const parsed = z.string().min(1).safeParse(name);
  if (!parsed.success) return NextResponse.json({ error: "Paramètre name manquant." }, { status: 400 });

  try {
    const p = await getPokemonDetail(parsed.data);
    return NextResponse.json({
      pokemon: {
        id: p.id,
        name: p.name,
        sprite: p.sprite,
        types: p.types,
        stats: p.stats
      }
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Erreur" }, { status: 400 });
  }
}
