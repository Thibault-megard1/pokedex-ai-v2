"use client";

import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { ThemeToggle } from "./ThemeProvider";

type Me = { username: string } | null;

export default function NavBar() {
  const [me, setMe] = useState<Me>(null);
  const fetchingRef = useRef(false);

  async function refresh() {
    // Éviter les appels multiples simultanés
    if (fetchingRef.current) return;
    
    fetchingRef.current = true;
    try {
      const res = await fetch("/api/me", { cache: "no-store" });
      const data = await res.json();
      setMe(data.user ?? null);
    } finally {
      fetchingRef.current = false;
    }
  }

  useEffect(() => { refresh(); }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    await refresh();
    window.location.href = "/";
  }

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-white/90 backdrop-blur border-b border-gray-200">
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
              { href: "/favorites", label: "⭐ Favoris" },
              { href: "/battle", label: "Combat" },
              { href: "/tournament", label: "🏆 Tournoi" },
              { href: "/damage-calculator", label: "Calculateur" },
              { href: "/compare", label: "Comparer" },
              { href: "/team", label: "Équipe" },
              { href: "/quiz", label: "🎮 Quiz" },
              { href: "/stats", label: "📊 Stats" },
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
            <ThemeToggle />
            <span className="text-sm text-gray-600">
              Connecté : <b>{me.username}</b>
            </span>
            <button className="btn" onClick={logout}>
              Déconnexion
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <ThemeToggle />
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
