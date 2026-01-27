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

export async function POST(req: Request) {
  // Ajoute un Pokémon à un slot spécifique
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: "Non connecté." }, { status: 401 });

  try {
    const json = await req.json();
    const { slot, pokemonName } = json;

    if (!slot || !pokemonName) {
      return NextResponse.json({ error: "Slot et pokemonName requis." }, { status: 400 });
    }

    if (slot < 1 || slot > 6) {
      return NextResponse.json({ error: "Slot doit être entre 1 et 6." }, { status: 400 });
    }

    // Get current team
    const currentTeam = await getTeam(session.userId);

    // Check if slot is already occupied
    const existingSlot = currentTeam.find(t => t.slot === slot);
    if (existingSlot) {
      return NextResponse.json({ error: "Ce slot est déjà occupé." }, { status: 400 });
    }

    // Verify Pokemon exists
    const detail = await getPokemonDetail(pokemonName);

    // Add to team
    const newMember = {
      slot,
      pokemonName: detail.name,
      pokemonId: detail.id
    };

    const updatedTeam = [...currentTeam, newMember].sort((a, b) => a.slot - b.slot);
    await setTeam(session.userId, updatedTeam);

    return NextResponse.json({ ok: true, team: updatedTeam });
  } catch (e: any) {
    console.error("POST /api/team error:", e);
    return NextResponse.json({ error: e?.message ?? "Erreur" }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  // Supprime un Pokémon d'un slot spécifique
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: "Non connecté." }, { status: 401 });

  try {
    const { searchParams } = new URL(req.url);
    const slotParam = searchParams.get("slot");
    
    if (!slotParam) {
      return NextResponse.json({ error: "Slot requis." }, { status: 400 });
    }

    const slot = parseInt(slotParam, 10);
    if (isNaN(slot) || slot < 1 || slot > 6) {
      return NextResponse.json({ error: "Slot doit être entre 1 et 6." }, { status: 400 });
    }

    // Get current team
    const currentTeam = await getTeam(session.userId);

    // Remove from team
    const updatedTeam = currentTeam.filter(t => t.slot !== slot);
    await setTeam(session.userId, updatedTeam);

    return NextResponse.json({ ok: true, team: updatedTeam });
  } catch (e: any) {
    console.error("DELETE /api/team error:", e);
    return NextResponse.json({ error: e?.message ?? "Erreur" }, { status: 400 });
  }
}
