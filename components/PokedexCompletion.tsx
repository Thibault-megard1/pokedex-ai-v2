'use client';

import { useEffect, useState } from 'react';
import { PokedexStats } from '@/app/api/pokedex-completion/route';

export default function PokedexCompletion() {
  const [stats, setStats] = useState<PokedexStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch('/api/pokedex-completion');
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (err) {
        console.error('Error fetching Pokédex stats:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="pokedex-screen p-4">
        <div className="flex items-center justify-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
          <span className="text-sm text-gray-700 dark:text-gray-200">Chargement...</span>
        </div>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const seenButNotCaught = stats.seenCount - stats.caughtCount;

  return (
    <div className="pokedex-screen p-6">
      <h2 className="text-pokemon text-lg mb-4 text-shadow">📊 PROGRESSION POKÉDEX</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Seen */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 border-2 border-blue-400 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-blue-800 dark:text-blue-200">VUS</span>
            <span className="text-2xl font-bold text-blue-900 dark:text-blue-100">
              {stats.seenCount}
            </span>
          </div>
          <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2 mb-1">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${stats.seenPercentage}%` }}
            ></div>
          </div>
          <span className="text-xs text-blue-700 dark:text-blue-300">
            {stats.seenPercentage.toFixed(1)}% du Pokédex National
          </span>
        </div>

        {/* Caught */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 border-2 border-green-400 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-green-800 dark:text-green-200">
              CAPTURÉS
            </span>
            <span className="text-2xl font-bold text-green-900 dark:text-green-100">
              {stats.caughtCount}
            </span>
          </div>
          <div className="w-full bg-green-200 dark:bg-green-800 rounded-full h-2 mb-1">
            <div
              className="bg-green-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${stats.caughtPercentage}%` }}
            ></div>
          </div>
          <span className="text-xs text-green-700 dark:text-green-300">
            {stats.caughtPercentage.toFixed(1)}% du Pokédex National
          </span>
        </div>

        {/* Total */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 border-2 border-purple-400 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-purple-800 dark:text-purple-200">
              TOTAL
            </span>
            <span className="text-2xl font-bold text-purple-900 dark:text-purple-100">
              {stats.totalPokemon}
            </span>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-purple-700 dark:text-purple-300">
              <span>Vus mais non capturés:</span>
              <span className="font-bold">{seenButNotCaught}</span>
            </div>
            <div className="flex justify-between text-xs text-purple-700 dark:text-purple-300">
              <span>Jamais rencontrés:</span>
              <span className="font-bold">{stats.totalPokemon - stats.seenCount}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2 justify-center">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-gray-400 rounded-full border border-gray-600"></div>
          <span className="text-xs text-gray-700 dark:text-gray-200">Non vu</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-blue-400 rounded-full border border-blue-600"></div>
          <span className="text-xs text-gray-700 dark:text-gray-200">Vu</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-green-400 rounded-full border border-green-600"></div>
          <span className="text-xs text-gray-700 dark:text-gray-200">Capturé</span>
        </div>
      </div>
    </div>
  );
}
