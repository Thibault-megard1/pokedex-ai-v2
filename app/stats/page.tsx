"use client";

import { useEffect, useState } from "react";
import TypeBadge from "@/components/TypeBadge";
import type { BadgeKey } from "@/lib/typeBadgesSprite";

type UserStats = {
  favoriteTypes: Record<string, number>;
  favoriteGeneration: string | null;
  teamSize: number;
  favoritesCount: number;
  notesCount: number;
  quizResult?: {
    primary: {
      id: number;
      name: string;
      sprite_url?: string;
      confidence: number;
      reasons: string[];
    };
    completedAt: string;
  };
};

export default function StatsPage() {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    try {
      // Recupere l'activite utilisateur depuis les endpoints internes.
      // Charger l'équipe
      const teamRes = await fetch("/api/team");
      const teamData = await teamRes.json();

      // Charger les favoris
      const favRes = await fetch("/api/favorites");
      const favData = await favRes.json();

      // Charger les notes
      const notesRes = await fetch("/api/notes");
      const notesData = await notesRes.json();

      // Charger le résultat du quiz
      const quizRes = await fetch("/api/quiz-result");
      const quizData = await quizRes.json();

      // Analyse simple des types preferes a partir de l'equipe.
      const typeCount: Record<string, number> = {};

      if (teamData.team) {
        // Charger les détails de chaque Pokémon de l'équipe
        for (const member of teamData.team) {
          try {
            const pokRes = await fetch(`/api/pokemon?name=${member.pokemonName}`);
            const pokData = await pokRes.json();
            if (pokData.pokemon) {
              pokData.pokemon.types.forEach((type: string) => {
                typeCount[type] = (typeCount[type] || 0) + 1;
              });
            }
          } catch (err) {
            console.error(err);
          }
        }
      }

      setStats({
        favoriteTypes: typeCount,
        favoriteGeneration: null,
        teamSize: teamData.team?.length || 0,
        favoritesCount: favData.favorites?.length || 0,
        notesCount: notesData.notes?.length || 0,
        quizResult: quizData.result ? {
          primary: quizData.result.result.primary,
          completedAt: quizData.result.completedAt
        } : undefined
      });

      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="page-content mt-24">
        <div className="card p-8 text-center">
          <p className="text-gray-600">Chargement des statistiques...</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="page-content mt-24">
        <div className="card p-8 text-center">
          <p className="text-red-600">Erreur lors du chargement</p>
        </div>
      </div>
    );
  }

  const sortedTypes = Object.entries(stats.favoriteTypes)
    .sort((a, b) => b[1] - a[1]);

  return (
    <div className="page-content mt-24 space-y-4">
      <div className="card p-6">
        <h1 className="text-2xl font-bold mb-2">📊 Mes Statistiques</h1>
        <p className="text-gray-600">Aperçu de votre activité Pokédex</p>
      </div>

      {/* Vue d'ensemble */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-6">
          <div className="text-4xl font-bold text-blue-600">{stats.teamSize}</div>
          <div className="text-sm text-gray-600 mt-1">Pokémon dans l'équipe</div>
        </div>
        
        <div className="card p-6">
          <div className="text-4xl font-bold text-yellow-600">{stats.favoritesCount}</div>
          <div className="text-sm text-gray-600 mt-1">Favoris</div>
        </div>
        
        <div className="card p-6">
          <div className="text-4xl font-bold text-green-600">{stats.notesCount}</div>
          <div className="text-sm text-gray-600 mt-1">Notes rédigées</div>
        </div>
      </div>

      {/* Types préférés */}
      {sortedTypes.length > 0 && (
        <div className="card p-6">
          <h2 className="text-xl font-bold mb-4">⭐ Types les plus utilisés</h2>
          <div className="space-y-3">
            {sortedTypes.map(([type, count]) => {
              const percentage = Math.round((count / stats.teamSize) * 100);
              
              return (
                <div key={type} className="flex items-center gap-3">
                  <div className="min-w-[120px]">
                    <TypeBadge kind={type as BadgeKey} width={110} />
                  </div>
                  
                  <div className="flex-1">
                    <div className="h-6 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-6 bg-blue-500 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                  
                  <span className="text-sm font-semibold min-w-[60px] text-right">
                    {count} ({percentage}%)
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Activité récente */}
      <div className="card p-6">
        <h2 className="text-xl font-bold mb-4">📈 Progression</h2>
        <div className="space-y-3">
          <div className="flex justify-between items-center p-3 bg-blue-50 rounded">
            <span className="text-sm">Équipe complète</span>
            <span className="font-bold text-blue-600">
              {stats.teamSize === 6 ? "✅ Oui" : `${stats.teamSize}/6`}
            </span>
          </div>

          <div className="flex justify-between items-center p-3 bg-yellow-50 rounded">
            <span className="text-sm">Collection de favoris</span>
            <span className="font-bold text-yellow-600">{stats.favoritesCount} Pokémon</span>
          </div>

          <div className="flex justify-between items-center p-3 bg-green-50 rounded">
            <span className="text-sm">Notes et stratégies</span>
            <span className="font-bold text-green-600">{stats.notesCount} rédigées</span>
          </div>
        </div>
      </div>

      {/* Quiz Result */}
      {stats.quizResult && (
        <div className="card p-6 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-2 border-purple-200 dark:border-purple-700">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <span>🔮</span>
            <span>Résultat du Quiz de Personnalité</span>
          </h2>

          <div className="flex items-center gap-6 mb-4">
            {stats.quizResult.primary.sprite_url && (
              <img
                src={stats.quizResult.primary.sprite_url}
                alt={stats.quizResult.primary.name}
                className="w-24 h-24 pixelated"
              />
            )}

            <div className="flex-1">
              <div className="text-2xl font-bold capitalize text-purple-900 dark:text-purple-100 mb-2">
                {stats.quizResult.primary.name}
              </div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm font-semibold text-purple-700 dark:text-purple-300">
                  Correspondance:
                </span>
                <div className="flex-1 bg-white dark:bg-gray-800 rounded-full h-6 overflow-hidden">
                  <div
                    className="h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-xs font-bold"
                    style={{ width: `${stats.quizResult.primary.confidence}%` }}
                  >
                    {stats.quizResult.primary.confidence}%
                  </div>
                </div>
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                Complété le {new Date(stats.quizResult.completedAt).toLocaleDateString('fr-FR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </div>
            </div>
          </div>

          {stats.quizResult.primary.reasons && stats.quizResult.primary.reasons.length > 0 && (
            <div className="mt-4 pt-4 border-t border-purple-200 dark:border-purple-700">
              <div className="text-sm font-semibold text-purple-700 dark:text-purple-300 mb-2">
                Pourquoi ce Pokémon vous correspond:
              </div>
              <ul className="space-y-1">
                {stats.quizResult.primary.reasons.slice(0, 3).map((reason, idx) => (
                  <li key={idx} className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2">
                    <span className="text-purple-500">•</span>
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
