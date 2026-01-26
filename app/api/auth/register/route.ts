import { NextResponse } from "next/server";
import { z } from "zod";
import { registerUser, createSession } from "@/lib/auth";

const Body = z.object({
  username: z.string().min(3),
  password: z.string().min(6),
  confirmPassword: z.string().min(6)
});

export async function POST(req: Request) {
  // Inscrit un nouvel utilisateur, vérifie le double mot de passe, ouvre la session.
  try {
    const json = await req.json();
    const body = Body.parse(json);

    if (body.password !== body.confirmPassword) {
      return NextResponse.json({ error: "Les mots de passe ne correspondent pas." }, { status: 400 });
    }

    const user = await registerUser(body.username, body.password);
    await createSession(user);

    return NextResponse.json({ ok: true, user: { username: user.username } });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Erreur" }, { status: 400 });
  }
}
