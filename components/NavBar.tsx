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
    <header className="fixed top-0 left-0 w-full z-50">
      <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">

        {/* Logo */}
        <Link
          href="/pokemon"
          className="px-3 py-1.5 rounded-md text-base font-semibold text-gray-900 hover:bg-gray-100 transition no-underline">
          Pokédex
        </Link>

        {/* Navigation */}
        {me && (
          <nav className="flex items-center gap-2">
            {[
              { href: "/pokemon", label: "Pokémon" },
              { href: "/battle", label: "Combat" },
              { href: "/team", label: "Équipe" },
            ].map(link => (
              <Link
                key={link.href}
                href={link.href}
                className="px-3 py-1.5 rounded-md text-sm font-medium text-gray-800
                          hover:bg-gray-100
                          no-underline"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        )}

        {/* Auth */}
        {me ? (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">
              Connecté : <b>{me.username}</b>
            </span>
            <button className="btn" onClick={logout}>
              Déconnexion
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link className="btn" href="/auth/login">
              Connexion
            </Link>
            <Link className="btn btn-primary" href="/auth/register">
              Inscription
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
