import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { readJsonFile, writeJsonFile, DATA_DIR } from "@/lib/utils";
import path from "path";

const FAVORITES_FILE = path.join(DATA_DIR, "favorites.json");

type Favorite = {
  userId: string;
  pokemonId: number;
  pokemonName: string;
  addedAt: string;
};

async function getFavorites(): Promise<Favorite[]> {
  try {
    return await readJsonFile<Favorite[]>(FAVORITES_FILE, []);
  } catch {
    return [];
  }
}

async function saveFavorites(favorites: Favorite[]) {
  await writeJsonFile(FAVORITES_FILE, favorites);
}

// GET - Récupérer les favoris de l'utilisateur
export async function GET(req: NextRequest) {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const favorites = await getFavorites();
  const userFavorites = favorites.filter(f => f.userId === session.userId);

  return NextResponse.json({ favorites: userFavorites });
}

// POST - Ajouter un favori
export async function POST(req: NextRequest) {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { pokemonId, pokemonName } = body;

  if (!pokemonId || !pokemonName) {
    return NextResponse.json({ error: "Missing pokemonId or pokemonName" }, { status: 400 });
  }

  const favorites = await getFavorites();
  
  // Vérifier si déjà favori
  const exists = favorites.some(f => f.userId === session.userId && f.pokemonId === pokemonId);
  if (exists) {
    return NextResponse.json({ error: "Already in favorites" }, { status: 400 });
  }

  favorites.push({
    userId: session.userId,
    pokemonId,
    pokemonName,
    addedAt: new Date().toISOString()
  });

  await saveFavorites(favorites);

  return NextResponse.json({ success: true });
}

// DELETE - Retirer un favori
export async function DELETE(req: NextRequest) {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const pokemonId = parseInt(url.searchParams.get("pokemonId") || "0");

  if (!pokemonId) {
    return NextResponse.json({ error: "Missing pokemonId" }, { status: 400 });
  }

  let favorites = await getFavorites();
  favorites = favorites.filter(f => !(f.userId === session.userId && f.pokemonId === pokemonId));

  await saveFavorites(favorites);

  return NextResponse.json({ success: true });
}