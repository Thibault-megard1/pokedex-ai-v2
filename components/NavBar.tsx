"use client";

import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { ThemeToggle } from "./ThemeProvider";
import { MenuGroup } from "./MenuGroup";

type Me = { username: string } | null;

export default function NavBar() {
  const [me, setMe] = useState<Me>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openGroup, setOpenGroup] = useState<string | null>(null);
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

  // Grouped navigation structure
  const menuGroups = [
    {
      id: "pokedex",
      title: "Pokédex",
      icon: "/icons/ui/nav-pokedex.png",
      items: [
        { href: "/pokemon", label: "Liste", icon: "/icons/ui/ic-pokemon.png" },
        { href: "/favorites", label: "Favoris", icon: "/icons/ui/ic-success.png" },
        { href: "/compare", label: "Comparer", icon: "/icons/ui/ic-filter.png" },
        { href: "/stats", label: "Statistiques", icon: "/icons/ui/ic-search.png" },
      ]
    },
    {
      id: "battle",
      title: "Combat",
      icon: "/icons/ui/nav-battle.png",
      items: [
        { href: "/battle", label: "1v1", icon: "/icons/ui/nav-battle.png" },
        { href: "/tournament", label: "Tournoi 6v6", icon: "/icons/ui/ic-success.png" },
        { href: "/damage-calculator", label: "Calculateur", icon: "/icons/ui/ic-filter.png" },
      ]
    },
    {
      id: "trainer",
      title: "Dresseur",
      icon: "/icons/ui/ic-trainer.png",
      items: [
        { href: "/team", label: "Mon Équipe", icon: "/icons/ui/nav-team.png" },
        { href: "/quiz", label: "Quiz", icon: "/icons/ui/nav-quiz.png" },
      ]
    }
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
              <Link
                href="/"
                className="px-3 py-2 rounded-md text-sm font-medium text-white hover:bg-white/20 transition-all no-underline flex items-center gap-2"
              >
                <img src="/icons/ui/ic-home.png" alt="Home" className="w-5 h-5" />
                <span>Accueil</span>
              </Link>
              
              {menuGroups.map(group => (
                <div key={group.id} className="relative group/nav">
                  <button className="px-3 py-2 rounded-md text-sm font-medium text-white hover:bg-white/20 transition-all flex items-center gap-2">
                    <img src={group.icon} alt={group.title} className="w-5 h-5" />
                    <span>{group.title}</span>
                    <span className="text-xs">▾</span>
                  </button>
                  
                  {/* Dropdown Menu */}
                  <div className="absolute top-full left-0 mt-1 hidden group-hover/nav:block bg-red-700 rounded-lg shadow-xl border-2 border-red-800 min-w-[180px] z-50">
                    <div className="py-2">
                      {group.items.map(item => (
                        <Link
                          key={item.href}
                          href={item.href}
                          className="px-4 py-2 text-sm text-white hover:bg-white/20 transition-all no-underline flex items-center gap-2 whitespace-nowrap"
                        >
                          <img src={item.icon} alt={item.label} className="w-4 h-4" />
                          <span>{item.label}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
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
            <nav className="px-4 py-3 space-y-2">
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-2 rounded-lg text-white hover:bg-white/20 transition-all no-underline flex items-center gap-3"
              >
                <img src="/icons/ui/ic-home.png" alt="Home" className="w-5 h-5" />
                <span>Accueil</span>
              </Link>
              
              {menuGroups.map(group => (
                <MenuGroup
                  key={group.id}
                  title={group.title}
                  icon={group.icon}
                  items={group.items}
                  isOpen={openGroup === group.id}
                  onToggle={() => setOpenGroup(openGroup === group.id ? null : group.id)}
                />
              ))}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
