"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BACKGROUNDS } from "@/lib/backgrounds";

type Me = { username: string } | null;

export default function HomePage() {
  const [me, setMe] = useState<Me>(null);

  async function refresh() {
    const res = await fetch("/api/me", { cache: "no-store" });
    const data = await res.json();
    setMe(data.user ?? null);
  }

  useEffect(() => { refresh(); }, []);

  const menuItems = [
    {
      title: "POKÉDEX",
      icon: "📖",
      description: "Explorez tous les Pokémon",
      href: "/pokemon",
      color: "from-red-500 to-red-600",
      requireAuth: false
    },
    {
      title: "ÉQUIPE",
      icon: "👥",
      description: "Gérez votre équipe",
      href: "/team",
      color: "from-blue-500 to-blue-600",
      requireAuth: true
    },
    {
      title: "COMBAT",
      icon: "⚔️",
      description: "Lancez un combat 1v1",
      href: "/battle",
      color: "from-purple-500 to-purple-600",
      requireAuth: true
    },
    {
      title: "TOURNOI",
      icon: "🏆",
      description: "Tournoi 6v6 vs IA",
      href: "/tournament",
      color: "from-yellow-500 to-yellow-600",
      requireAuth: true
    },
    {
      title: "QUIZ",
      icon: "🎮",
      description: "Quel Pokémon êtes-vous ?",
      href: "/quiz",
      color: "from-pink-500 to-pink-600",
      requireAuth: false
    },
    {
      title: "FAVORIS",
      icon: "⭐",
      description: "Vos Pokémon préférés",
      href: "/favorites",
      color: "from-amber-500 to-amber-600",
      requireAuth: true
    }
  ];

  return (
    <div
      className="page-bg min-h-screen"
      style={{ ["--bg-url" as any]: `url(${BACKGROUNDS.home})` }}
    >
      <div className="page-content py-24 px-4">
        
        {/* Hero Section */}
        <div className="pokedex-panel max-w-6xl mx-auto mb-8 pokedex-open-animation">
          <div className="pokedex-panel-content p-8 text-center">
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-lg pokeball-bounce">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-red-500 to-red-700"></div>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-pokemon">
                POKÉDEX AI
              </h1>
            </div>
            
            <p className="text-lg text-gray-700 max-w-2xl mx-auto mb-2">
              Bienvenue dans le Pokédex ultime ! Explorez tous les Pokémon, 
              créez votre équipe de rêve, et affrontez l'IA.
            </p>
            
            {!me && (
              <div className="mt-6 bg-yellow-50 border-2 border-yellow-400 rounded-lg p-4 inline-block">
                <p className="text-sm text-gray-700">
                  💡 <strong>Connectez-vous</strong> pour accéder aux combats, équipes et plus !
                </p>
                <div className="flex gap-3 mt-3 justify-center">
                  <Link href="/auth/login" className="pokedex-button text-xs">
                    Connexion
                  </Link>
                  <Link href="/auth/register" className="pokedex-button-yellow text-xs">
                    Inscription
                  </Link>
                </div>
              </div>
            )}
            
            {me && (
              <div className="mt-4 bg-green-50 border-2 border-green-400 rounded-lg p-3 inline-block">
                <p className="text-sm text-gray-700">
                  ✨ Bienvenue, <strong className="text-pokemon">{me.username}</strong> !
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Menu Grid */}
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {menuItems.map((item, index) => {
            const isLocked = item.requireAuth && !me;
            
            return (
              <Link
                key={item.href}
                href={isLocked ? "/auth/login" : item.href}
                className={`pokedex-card group relative overflow-hidden ${isLocked ? 'opacity-75' : ''}`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {isLocked && (
                  <div className="absolute top-3 right-3 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full z-10 pokemon-text">
                    🔒
                  </div>
                )}
                
                <div className={`pokedex-card-header bg-gradient-to-r ${item.color}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-4xl">{item.icon}</span>
                    <h3 className="text-white font-bold text-sm pokemon-text">
                      {item.title}
                    </h3>
                  </div>
                </div>
                
                <div className="p-6">
                  <p className="text-gray-700 text-center">
                    {item.description}
                  </p>
                  
                  {isLocked && (
                    <p className="text-xs text-red-600 text-center mt-3 font-semibold">
                      Connexion requise
                    </p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>

        {/* Stats Section */}
        {me && (
          <div className="max-w-6xl mx-auto mt-8">
            <div className="pokedex-screen p-6">
              <h2 className="text-pokemon text-xl mb-4">📊 STATISTIQUES</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white/80 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-red-600">???</div>
                  <div className="text-sm text-gray-600 mt-1">Pokémon vus</div>
                </div>
                <div className="bg-white/80 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-blue-600">???</div>
                  <div className="text-sm text-gray-600 mt-1">Combats gagnés</div>
                </div>
                <div className="bg-white/80 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-yellow-600">⭐</div>
                  <div className="text-sm text-gray-600 mt-1">Dresseur actif</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Links */}
        <div className="max-w-6xl mx-auto mt-8 text-center">
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/compare" className="btn">
              📊 Comparer
            </Link>
            <Link href="/damage-calculator" className="btn">
              🧮 Calculateur
            </Link>
            <Link href="/stats" className="btn">
              📈 Stats détaillées
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
