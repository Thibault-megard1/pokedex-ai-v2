import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";

export async function GET() {
  // Retourne la session courante (ou null) pour identifier l'utilisateur côté client.
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ user: null });
  return NextResponse.json({ user: { username: session.username, userId: session.userId } });
}
