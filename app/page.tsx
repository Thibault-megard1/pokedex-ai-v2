"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BACKGROUNDS } from "@/lib/backgrounds";
import { SectionMenu } from "@/components/SectionMenu";

type Me = { username: string } | null;

export default function HomePage() {
  const [me, setMe] = useState<Me>(null);

  async function refresh() {
    const res = await fetch("/api/me", { cache: "no-store" });
    const data = await res.json();
    setMe(data.user ?? null);
  }

  useEffect(() => { refresh(); }, []);

  // Primary Actions - Always visible
  const primaryActions = [
    {
      href: "/pokemon",
      label: "POKÉDEX",
      icon: "/icons/ui/nav-pokedex.png",
      description: "Explorer tous les Pokémon",
      color: "bg-gradient-to-r from-red-500 to-red-600",
      requireAuth: false
    },
    {
      href: "/team",
      label: "ÉQUIPE",
      icon: "/icons/ui/nav-team.png",
      description: "Créer et gérer votre équipe",
      color: "bg-gradient-to-r from-blue-500 to-blue-600",
      requireAuth: true
    },
    {
      href: "/battle",
      label: "COMBAT",
      icon: "/icons/ui/nav-battle.png",
      description: "Affronter l'IA en combat 1v1",
      color: "bg-gradient-to-r from-purple-500 to-purple-600",
      requireAuth: true
    }
  ];

  // Battle Features - Secondary section
  const battleFeatures = [
    {
      href: "/tournament",
      label: "TOURNOI",
      icon: "/icons/ui/ic-success.png",
      description: "Combat épique 6v6",
      color: "bg-gradient-to-r from-yellow-500 to-yellow-600",
      requireAuth: true
    },
    {
      href: "/damage-calculator",
      label: "CALCULATEUR",
      icon: "/icons/ui/ic-filter.png",
      description: "Calculer les dégâts",
      color: "bg-gradient-to-r from-green-500 to-green-600",
      requireAuth: false
    }
  ];

  // Tools & Features - Utility section
  const toolsFeatures = [
    {
      href: "/favorites",
      label: "FAVORIS",
      icon: "/icons/ui/ic-success.png",
      description: "Vos Pokémon préférés",
      color: "bg-gradient-to-r from-amber-500 to-amber-600",
      requireAuth: true
    },
    {
      href: "/compare",
      label: "COMPARER",
      icon: "/icons/ui/ic-filter.png",
      description: "Comparer 2 Pokémon",
      color: "bg-gradient-to-r from-teal-500 to-teal-600",
      requireAuth: false
    },
    {
      href: "/stats",
      label: "STATS",
      icon: "/icons/ui/ic-search.png",
      description: "Statistiques détaillées",
      color: "bg-gradient-to-r from-indigo-500 to-indigo-600",
      requireAuth: false
    }
  ];

  // Fun Features - Entertainment section
  const funFeatures = [
    {
      href: "/quiz",
      label: "QUIZ",
      icon: "/icons/ui/nav-quiz.png",
      description: "Quel Pokémon êtes-vous ?",
      color: "bg-gradient-to-r from-pink-500 to-pink-600",
      requireAuth: false
    }
  ];

  return (
    <div
      className="page-bg min-h-screen"
      style={{ ["--bg-url" as any]: `url(${BACKGROUNDS.home})` }}
    >
      <div className="page-content py-24 px-4">
        
        {/* Hero Section */}
        <div className="pokedex-panel max-w-6xl mx-auto mb-12 pokedex-open-animation">
          <div className="pokedex-panel-content p-8 text-center">
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-lg pokeball-bounce">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-red-500 to-red-700"></div>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-pokemon">
                POKÉDEX AI
              </h1>
            </div>
            
            <p className="text-lg text-gray-700 dark:text-gray-300 max-w-2xl mx-auto mb-4">
              Bienvenue dans le Pokédex ultime ! Explorez tous les Pokémon, 
              créez votre équipe de rêve, et affrontez l'IA.
            </p>
            
            {!me ? (
              <div className="mt-6 bg-yellow-50 dark:bg-yellow-900/30 border-2 border-yellow-400 dark:border-yellow-600 rounded-lg p-4 inline-block">
                <p className="text-sm text-gray-700 dark:text-gray-200 mb-3 flex items-center justify-center gap-2">
                  <img src="/icons/ui/ic-search.png" alt="Info" className="w-4 h-4" />
                  <strong>Connectez-vous</strong> pour débloquer toutes les fonctionnalités !
                </p>
                <div className="flex gap-3 justify-center">
                  <Link href="/auth/login" className="pokedex-button text-xs">
                    Connexion
                  </Link>
                  <Link href="/auth/register" className="pokedex-button-yellow text-xs">
                    Inscription
                  </Link>
                </div>
              </div>
            ) : (
              <div className="mt-4 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/30 dark:to-blue-900/30 border-2 border-green-400 dark:border-green-600 rounded-lg p-4 inline-block">
                <p className="text-sm text-gray-700 dark:text-gray-200 flex items-center justify-center gap-2">
                  <img src="/icons/ui/ic-success.png" alt="Success" className="w-4 h-4" />
                  Bienvenue, <strong className="text-pokemon text-lg">{me.username}</strong> !
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                  Prêt pour l'aventure ?
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Primary Actions Hub */}
        <div className="max-w-6xl mx-auto mb-12">
          <h2 className="text-pokemon text-3xl mb-6 text-center flex items-center justify-center gap-3">
            <img src="/icons/ui/nav-battle.png" alt="Action" className="w-8 h-8" />
            ACTIONS PRINCIPALES
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {primaryActions.map((item, index) => {
              const isLocked = item.requireAuth && !me;
              
              return (
                <Link
                  key={item.href}
                  href={isLocked ? "/auth/login" : item.href}
                  className={`pokedex-card group relative overflow-hidden transform transition-all hover:scale-105 ${isLocked ? 'opacity-75' : ''}`}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  {isLocked && (
                    <div className="absolute top-3 right-3 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full z-10 pokemon-text flex items-center gap-1">
                      <img src="/icons/ui/ic-error.png" alt="Locked" className="w-3 h-3" />
                    </div>
                  )}
                  
                  <div className={`pokedex-card-header ${item.color} py-10`}>
                    <div className="flex flex-col items-center justify-center gap-4">
                      <img src={item.icon} alt={item.label} className="w-16 h-16 transform group-hover:scale-110 transition-transform" />
                      <h3 className="text-white font-bold text-2xl pokemon-text text-center">
                        {item.label}
                      </h3>
                    </div>
                  </div>
                  
                  <div className="p-6 bg-white/90 dark:bg-slate-800/90">
                    <p className="text-gray-700 dark:text-gray-300 text-center font-medium">
                      {item.description}
                    </p>
                    
                    {isLocked && (
                      <p className="text-xs text-red-600 dark:text-red-400 text-center mt-3 font-semibold flex items-center justify-center gap-1">
                        <img src="/icons/ui/ic-error.png" alt="Locked" className="w-3 h-3" />
                        Connexion requise
                      </p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Battle Section */}
        {me && (
          <div className="max-w-6xl mx-auto mb-12">
            <SectionMenu
              title="⛔️ COMBAT & STRATÉGIE"
              items={battleFeatures}
              columns={2}
            />
          </div>
        )}

        {/* Tools Section */}
        <div className="max-w-6xl mx-auto mb-12">
          <SectionMenu
            title="🔧 OUTILS & FONCTIONNALITÉS"
            items={toolsFeatures}
            isLocked={!me && toolsFeatures.some(f => f.requireAuth)}
            columns={3}
          />
        </div>

        {/* Fun Section */}
        <div className="max-w-6xl mx-auto mb-12">
          <SectionMenu
            title="DIVERTISSEMENT"
            items={funFeatures}
            columns={1}
          />
        </div>

        {/* Stats Section - Only for logged users */}
        {me && (
          <div className="max-w-6xl mx-auto mt-12">
            <div className="pokedex-screen p-6">
              <h2 className="text-pokemon text-xl mb-4 flex items-center gap-2">
                <img src="/icons/ui/ic-search.png" alt="Stats" className="w-6 h-6" />
                <span>VOTRE PROGRESSION</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white/80 dark:bg-slate-800/80 rounded-lg p-4 text-center border-2 border-red-400 dark:border-red-600">
                  <div className="text-3xl font-bold text-red-600 dark:text-red-400 pokemon-text">???</div>
                  <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">Pokémon découverts</div>
                </div>
                <div className="bg-white/80 dark:bg-slate-800/80 rounded-lg p-4 text-center border-2 border-blue-400 dark:border-blue-600">
                  <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 pokemon-text">???</div>
                  <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">Combats gagnés</div>
                </div>
                <div className="bg-white/80 dark:bg-slate-800/80 rounded-lg p-4 text-center border-2 border-yellow-400 dark:border-yellow-600">
                  <img src="/icons/ui/ic-success.png" alt="Star" className="w-12 h-12 mx-auto" />
                  <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">Dresseur actif</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
