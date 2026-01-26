import { NextResponse } from "next/server";
import { z } from "zod";
import { verifyLogin, createSession } from "@/lib/auth";

const Body = z.object({
  username: z.string().min(1),
  password: z.string().min(1)
});

export async function POST(req: Request) {
  // Authentifie un utilisateur, crée la session si les identifiants sont valides.
  try {
    const json = await req.json();
    const body = Body.parse(json);

    const user = await verifyLogin(body.username, body.password);
    await createSession(user);

    return NextResponse.json({ ok: true, user: { username: user.username } });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Erreur" }, { status: 400 });
  }
}
