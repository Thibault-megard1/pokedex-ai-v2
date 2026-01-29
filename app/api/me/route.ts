import { NextResponse } from "next/server";
import { getCurrentSession, getUserFromRequest } from "@/lib/auth";

export async function GET() {
  // Retourne la session courante (ou null) pour identifier l'utilisateur côté client.
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ user: null });
  
  // Get full user info including isAdmin
  const user = await getUserFromRequest();
  
  return NextResponse.json({ 
    user: { 
      username: session.username, 
      userId: session.userId,
      isAdmin: user?.isAdmin || false
    } 
  });
}
