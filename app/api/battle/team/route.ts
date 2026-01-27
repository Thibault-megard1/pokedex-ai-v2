import { NextResponse } from "next/server";
import { z } from "zod";
import { getPokemonDetail } from "@/lib/pokeapi";
import { fight } from "@/lib/battle";

export const dynamic = "force-dynamic";

const Body = z.object({
  teamA: z.array(z.string().min(1)),
  teamB: z.array(z.string().min(1))
});

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const body = Body.parse(json);

    if (body.teamA.length === 0 || body.teamB.length === 0) {
      return NextResponse.json(
        { error: "Both teams must have at least one Pokemon" },
        { status: 400 }
      );
    }

    // Load all Pokemon data
    const teamAData = await Promise.all(
      body.teamA.map(name => getPokemonDetail(name))
    );
    const teamBData = await Promise.all(
      body.teamB.map(name => getPokemonDetail(name))
    );

    // Simulate team battle
    const rounds: {
      round: number;
      pokemonA: string;
      pokemonB: string;
      winner: "A" | "B";
      turnsCount: number;
    }[] = [];

    let teamARemaining = [...teamAData];
    let teamBRemaining = [...teamBData];
    let roundNumber = 1;

    // Battle until one team has no Pokemon left
    while (teamARemaining.length > 0 && teamBRemaining.length > 0) {
      const pokemonA = teamARemaining[0];
      const pokemonB = teamBRemaining[0];

      // Fight between current Pokemon
      const result = fight(pokemonA, pokemonB);

      rounds.push({
        round: roundNumber,
        pokemonA: pokemonA.name,
        pokemonB: pokemonB.name,
        winner: result.winner,
        turnsCount: result.turns.length
      });

      // Remove knocked out Pokemon
      if (result.winner === "A") {
        teamBRemaining.shift();
      } else {
        teamARemaining.shift();
      }

      roundNumber++;
    }

    // Determine overall winner
    const winner = teamARemaining.length > 0 ? "A" : "B";

    // Format remaining teams
    const formatTeam = (team: any[]) => team.map(p => ({
      baseName: p.name,
      currentName: p.name,
      sprite: p.sprite,
      types: p.types,
      stats: p.stats,
      evolutionLevel: 0,
      category: "standard" as const
    }));

    return NextResponse.json({
      winner,
      teamA: formatTeam(teamARemaining),
      teamB: formatTeam(teamBRemaining),
      rounds
    });
  } catch (e: any) {
    console.error("Team battle error:", e);
    return NextResponse.json(
      { error: e?.message ?? "Battle error" },
      { status: 400 }
    );
  }
}
