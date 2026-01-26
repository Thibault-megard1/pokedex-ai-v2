import { NextResponse } from "next/server";
import { z } from "zod";
import { getPokemonDetail } from "@/lib/pokeapi";

// API de comparaison : valide le body, appelle lib/pokeapi pour A et B, renvoie un JSON prêt à l'UI.
// Source des données : getPokemonDetail (fetch PokeAPI + cache maison côté lib/pokeapi).

export const dynamic = "force-dynamic";

function pickCryUrl(p: any): string | null {
  // selon ce que getPokemonDetail expose chez toi
  return (
    p?.cryUrl ??
    p?.cry?.latest ??
    p?.cry?.legacy ??
    p?.cries?.latest ??
    p?.cries?.legacy ??
    null
  );
}

const Body = z.object({
  a: z.string().min(1),
  b: z.string().min(1),
});

export async function POST(req: Request) {
  // Compare deux Pokémon : valide le body, récupère les détails et renvoie un payload prêt pour l'UI.
  try {
    const json = await req.json();
    const body = Body.parse(json);

    const a = await getPokemonDetail(body.a.trim());
    const b = await getPokemonDetail(body.b.trim());

    return NextResponse.json({
      a: {
        id: a.id,
        name: a.name,
        frenchName: a.frenchName,
        sprite: a.sprite,
        types: a.types,
        stats: a.stats,
        height: a.heightDecimeters,
        weight: a.weightHectograms,
        region: a.region ?? null,
        cryUrl: pickCryUrl(a),
      },
      b: {
        id: b.id,
        name: b.name,
        frenchName: b.frenchName,
        sprite: b.sprite,
        types: b.types,
        stats: b.stats,
        height: b.heightDecimeters,
        weight: b.weightHectograms,
        region: b.region ?? null,
        cryUrl: pickCryUrl(b),
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Erreur" }, { status: 400 });
  }
}
