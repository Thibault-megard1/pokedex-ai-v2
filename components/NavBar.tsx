"use client";

import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { ThemeToggle } from "./ThemeProvider";

type Me = { username: string } | null;

export default function NavBar() {
  const [me, setMe] = useState<Me>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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

  const navLinks = [
    { href: "/", label: "Accueil", icon: "🏠" },
    { href: "/pokemon", label: "Pokédex", icon: "📖" },
    { href: "/favorites", label: "Favoris", icon: "⭐" },
    { href: "/team", label: "Équipe", icon: "👥" },
    { href: "/battle", label: "Combat", icon: "⚔️" },
    { href: "/tournament", label: "Tournoi", icon: "🏆" },
    { href: "/quiz", label: "Quiz", icon: "🎮" },
    { href: "/compare", label: "Comparer", icon: "📊" },
    { href: "/stats", label: "Stats", icon: "📈" },
  ];

  return (
    <header className="fixed top-0 left-0 w-full z-50 shadow-lg">
      {/* Pokédex Header Bar */}
      <div className="bg-gradient-to-b from-red-600 to-red-700 border-b-4 border-red-800">
        <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
          
          {/* Logo / Brand */}
          <Link
            href="/pokemon"
            className="flex items-center gap-3 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all no-underline group">
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-red-700"></div>
            </div>
            <span className="text-white font-bold text-xl pokemon-text hidden sm:block">
              POKÉDEX
            </span>
          </Link>

          {/* Desktop Navigation */}
          {me && (
            <nav className="hidden lg:flex items-center gap-1">
              {navLinks.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="px-3 py-2 rounded-md text-sm font-medium text-white hover:bg-white/20 transition-all no-underline flex items-center gap-2"
                >
                  <span>{link.icon}</span>
                  <span className="hidden xl:inline">{link.label}</span>
                </Link>
              ))}
            </nav>
          )}

          {/* Auth Section */}
          <div className="flex items-center gap-2">
            <ThemeToggle />
            
            {me ? (
              <div className="flex items-center gap-2">
                <span className="hidden sm:block text-sm text-white/90 bg-white/10 px-3 py-1.5 rounded-lg">
                  <span className="hidden md:inline">Dresseur: </span>
                  <b>{me.username}</b>
                </span>
                <button 
                  onClick={logout}
                  className="px-4 py-2 rounded-lg bg-white/20 hover:bg-white/30 text-white font-medium text-sm transition-all"
                >
                  Déconnexion
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link 
                  className="px-4 py-2 rounded-lg bg-white/20 hover:bg-white/30 text-white font-medium text-sm transition-all no-underline" 
                  href="/auth/login"
                >
                  Connexion
                </Link>
                <Link 
                  className="px-4 py-2 rounded-lg bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-bold text-sm transition-all no-underline shadow-lg" 
                  href="/auth/register"
                >
                  Inscription
                </Link>
              </div>
            )}

            {/* Mobile Menu Toggle */}
            {me && (
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-all"
              >
                {mobileMenuOpen ? "✕" : "☰"}
              </button>
            )}
          </div>
        </div>

        {/* Mobile Menu */}
        {me && mobileMenuOpen && (
          <div className="lg:hidden bg-red-700 border-t border-red-800">
            <nav className="px-4 py-3 flex flex-col gap-1">
              {navLinks.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-2 rounded-lg text-white hover:bg-white/20 transition-all no-underline flex items-center gap-3"
                >
                  <span>{link.icon}</span>
                  <span>{link.label}</span>
                </Link>
              ))}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
