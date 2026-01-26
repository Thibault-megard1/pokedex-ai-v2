import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentSession } from "@/lib/auth";
import { getTeam, setTeam } from "@/lib/db";
import { getPokemonDetail } from "@/lib/pokeapi";

const TeamBody = z.object({
  team: z.array(z.object({
    slot: z.number().int().min(1).max(6),
    pokemonId: z.number().int().nonnegative(),
    pokemonName: z.string().min(1)
  })).max(6)
});

export async function GET() {
  // Récupère l'équipe enregistrée pour l'utilisateur courant (ou tableau vide si non connecté).
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ team: [] });

  const team = await getTeam(session.userId);
  return NextResponse.json({ team });
}

export async function PUT(req: Request) {
  // Sauvegarde une équipe : valide le payload, vérifie chaque Pokémon, trie et stocke par slot.
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: "Non connecté." }, { status: 401 });

  try {
    const json = await req.json();
    const body = TeamBody.parse(json);

    const bySlot = new Map<number, { slot: number; pokemonName: string; pokemonId: number }>();
    for (const s of body.team) {
      if (bySlot.has(s.slot)) throw new Error("Slots dupliqués.");
      const detail = await getPokemonDetail(s.pokemonName);
      bySlot.set(s.slot, { slot: s.slot, pokemonName: detail.name, pokemonId: detail.id });
    }

    const normalized = Array.from(bySlot.values()).sort((a, b) => a.slot - b.slot);
    await setTeam(session.userId, normalized);

    return NextResponse.json({ ok: true, team: normalized });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Erreur" }, { status: 400 });
  }
}
