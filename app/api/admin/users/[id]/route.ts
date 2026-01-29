import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getUsers, saveUsers, getTeam } from "@/lib/db";
import { readJsonFile, DATA_DIR } from "@/lib/utils";
import path from "path";

type Params = { params: { id: string } };

export async function GET(req: NextRequest, { params }: Params) {
  try {
    await requireAdmin();
    
    const users = await getUsers();
    const user = users.find(u => u.id === params.id);
    
    if (!user) {
      return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
    }
    
    const team = await getTeam(params.id);
    
    // Try to get favorite Pokemon from favorites.json
    const favPath = path.join(DATA_DIR, "favorites.json");
    const favorites = await readJsonFile<Record<string, number[]>>(favPath, {});
    const favoritePokemons = favorites[params.id] || [];
    
    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        isAdmin: user.isAdmin || false,
        createdAt: user.createdAt,
        team: team,
        favoritePokemons: favoritePokemons
      }
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Erreur serveur" },
      { status: err.message?.includes("administrateur") ? 403 : 401 }
    );
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    await requireAdmin();
    
    const body = await req.json();
    const { isAdmin } = body;
    
    const users = await getUsers();
    const userIndex = users.findIndex(u => u.id === params.id);
    
    if (userIndex === -1) {
      return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
    }
    
    if (typeof isAdmin === "boolean") {
      users[userIndex].isAdmin = isAdmin;
    }
    
    await saveUsers(users);
    
    return NextResponse.json({ 
      success: true,
      user: {
        id: users[userIndex].id,
        username: users[userIndex].username,
        isAdmin: users[userIndex].isAdmin || false
      }
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Erreur serveur" },
      { status: err.message?.includes("administrateur") ? 403 : 401 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const admin = await requireAdmin();
    
    // Prevent self-deletion
    if (admin.id === params.id) {
      return NextResponse.json(
        { error: "Impossible de supprimer votre propre compte" },
        { status: 400 }
      );
    }
    
    const users = await getUsers();
    const filtered = users.filter(u => u.id !== params.id);
    
    if (filtered.length === users.length) {
      return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
    }
    
    await saveUsers(filtered);
    
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Erreur serveur" },
      { status: err.message?.includes("administrateur") ? 403 : 401 }
    );
  }
}
