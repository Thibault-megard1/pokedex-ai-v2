import { NextResponse } from "next/server";
import { destroySession } from "@/lib/auth";

export async function POST() {
  // Détruit la session active et confirme la déconnexion.
  await destroySession();
  return NextResponse.json({ ok: true });
}
