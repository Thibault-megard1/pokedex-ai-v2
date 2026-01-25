"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Me = { username: string } | null;

export default function NavBar() {
  const [me, setMe] = useState<Me>(null);

  async function refresh() {
    const res = await fetch("/api/me", { cache: "no-store" });
    const data = await res.json();
    setMe(data.user ?? null);
  }

  useEffect(() => { refresh(); }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    await refresh();
    window.location.href = "/";
  }

  return (
    <div className="border-b bg-white">
      <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between">
        <Link href="/" className="font-semibold text-lg">Pokédex AI</Link>
        <nav className="flex items-center gap-4">
          <Link href="/pokemon">Pokémon</Link>
          <Link href="/battle">Combat</Link>
          <Link href="/team">Équipe</Link>

          {me ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Connecté : <b>{me.username}</b></span>
              <button className="btn" onClick={logout}>Déconnexion</button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link className="btn" href="/auth/login">Connexion</Link>
              <Link className="btn btn-primary" href="/auth/register">Inscription</Link>
            </div>
          )}
        </nav>
      </div>
    </div>
  );
}
