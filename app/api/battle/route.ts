import { NextResponse } from "next/server";
import { z } from "zod";
import { getPokemonDetail } from "@/lib/pokeapi";
import { fight, estimateWinChance } from "@/lib/battle";

export const dynamic = "force-dynamic";

const Body = z.object({
  a: z.string().min(1),
  b: z.string().min(1)
});

export async function POST(req: Request) {
  // Prépare un duel : charge deux Pokémon, estime les chances et exécute la simulation.
  try {
    const json = await req.json();
    const body = Body.parse(json);

    const a = await getPokemonDetail(body.a);
    const b = await getPokemonDetail(body.b);

    const chanceA = estimateWinChance(a, b);
    const result = fight(a, b);

    const aCry = a.cry?.latest ?? a.cry?.legacy ?? null;
    const bCry = b.cry?.latest ?? b.cry?.legacy ?? null;

    return NextResponse.json({
      result: {
        a: { name: a.name, sprite: a.sprite, backSprite: a.backSprite ?? null, types: a.types, stats: a.stats, cry: aCry },
        b: { name: b.name, sprite: b.sprite, backSprite: b.backSprite ?? null, types: b.types, stats: b.stats, cry: bCry },
        chanceA,
        ...result
      }
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Erreur" }, { status: 400 });
  }
}
