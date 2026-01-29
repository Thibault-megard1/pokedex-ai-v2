import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getUsers } from "@/lib/db";
import { getTeamsDb } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    
    const users = await getUsers();
    const teamsDb = await getTeamsDb();
    
    // Enrich user data with team info
    const enrichedUsers = users.map(user => ({
      id: user.id,
      username: user.username,
      isAdmin: user.isAdmin || false,
      createdAt: user.createdAt,
      teamSize: teamsDb[user.id]?.length || 0
    }));
    
    return NextResponse.json({ users: enrichedUsers });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Erreur serveur" },
      { status: err.message?.includes("administrateur") ? 403 : 401 }
    );
  }
}
