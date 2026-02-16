import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getUsers, getTeamsDb } from "@/lib/db";
import { readJsonFile, DATA_DIR } from "@/lib/utils";
import path from "path";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();

    const users = await getUsers();
    const teamsDb = await getTeamsDb();

    // Get favorites
    const favPath = path.join(DATA_DIR, "favorites.json");
    const favorites = await readJsonFile<Record<string, number[]>>(favPath, {});

    // Get quiz results
    const quizPath = path.join(DATA_DIR, "quiz-results.json");
    const quizResults = await readJsonFile<Record<string, any>>(quizPath, {});

    // Compute analytics
    const totalUsers = users.length;
    const adminCount = users.filter(u => u.isAdmin).length;

    // Most common favorite Pokémon
    const favCounts: Record<number, number> = {};
    Object.values(favorites).forEach(favList => {
      favList.forEach(pokemonId => {
        favCounts[pokemonId] = (favCounts[pokemonId] || 0) + 1;
      });
    });

    const topFavorites = Object.entries(favCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([id, count]) => ({ pokemonId: parseInt(id), count }));

    // Quiz statistics
    const totalQuizCompletions = Object.keys(quizResults).length;
    const quizPokemonCounts: Record<string, number> = {};
    Object.values(quizResults).forEach((result: any) => {
      if (result?.result?.primary?.name) {
        const name = result.result.primary.name;
        quizPokemonCounts[name] = (quizPokemonCounts[name] || 0) + 1;
      }
    });

    const topQuizResults = Object.entries(quizPokemonCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, count]) => ({ pokemonName: name, count }));

    // Most common types in teams
    const typeCounts: Record<string, number> = {};
    for (const team of Object.values(teamsDb)) {
      for (const slot of team) {
        // We'd need to fetch type info, but for simplicity, we'll skip or use cached data
        // Just count Pokémon usage for now
      }
    }

    // Team statistics
    const teamsCount = Object.keys(teamsDb).length;
    const totalPokemonInTeams = Object.values(teamsDb).reduce((sum, team) => sum + team.length, 0);
    const avgTeamSize = teamsCount > 0 ? (totalPokemonInTeams / teamsCount).toFixed(1) : "0";

    return NextResponse.json({
      analytics: {
        totalUsers,
        adminCount,
        teamsCount,
        avgTeamSize,
        topFavorites,
        totalQuizCompletions,
        topQuizResults
      }
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Erreur serveur" },
      { status: err.message?.includes("administrateur") ? 403 : 401 }
    );
  }
}
