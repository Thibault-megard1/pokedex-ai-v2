'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ProgressionStats } from '../api/progression/route';

export default function ProgressionPage() {
  const [stats, setStats] = useState<ProgressionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch('/api/progression');
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        } else {
          setError('Failed to load progression stats');
        }
      } catch (err) {
        setError('Error loading stats');
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto p-6 text-center">
        <p className="text-lg">Loading trainer progress...</p>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="container mx-auto p-6 text-center">
        <p className="text-red-500">{error || 'No data available'}</p>
        <Link href="/" className="text-blue-500 underline mt-4 inline-block">
          Return Home
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <Link href="/" className="text-blue-500 hover:underline">
          ← Back to Home
        </Link>
      </div>

      <h1 className="text-4xl font-bold mb-8 text-center">Trainer Progress</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Collection Stats */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-semibold mb-4 border-b pb-2">Collection</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-300">Total Pokémon Caught:</span>
              <span className="font-bold text-xl">{stats.totalPokemonCaught}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-300">In Team:</span>
              <span className="font-bold">{stats.teamSize}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-300">In PC Box:</span>
              <span className="font-bold">{stats.pcBoxSize}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-300">Badges Earned:</span>
              <span className="font-bold">{stats.badges.length}</span>
            </div>
          </div>
        </div>

        {/* Battle Stats */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-semibold mb-4 border-b pb-2">Battle Record</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-300">Battles Won:</span>
              <span className="font-bold text-green-600 text-xl">
                {stats.totalBattlesWon || '—'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-300">Battles Lost:</span>
              <span className="font-bold text-red-600 text-xl">
                {stats.totalBattlesLost || '—'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-300">Win Rate:</span>
              <span className="font-bold">
                {stats.totalBattlesWon + stats.totalBattlesLost > 0
                  ? `${Math.round(
                      (stats.totalBattlesWon / (stats.totalBattlesWon + stats.totalBattlesLost)) *
                        100
                    )}%`
                  : '—'}
              </span>
            </div>
          </div>
        </div>

        {/* Favorite Pokemon */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-semibold mb-4 border-b pb-2">Favorite Pokémon</h2>
          {stats.favoritePokemon ? (
            <div className="text-center">
              <img
                src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${stats.favoritePokemon.id}.png`}
                alt={stats.favoritePokemon.name}
                className="mx-auto w-32 h-32"
              />
              <p className="text-xl font-bold capitalize">{stats.favoritePokemon.name}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {stats.favoritePokemon.usage > 0
                  ? `Used in ${stats.favoritePokemon.usage} battle${stats.favoritePokemon.usage !== 1 ? 's' : ''}`
                  : 'Most leveled Pokémon'}
              </p>
            </div>
          ) : (
            <p className="text-center text-gray-500">No Pokémon caught yet</p>
          )}
        </div>

        {/* Most Encountered */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-semibold mb-4 border-b pb-2">Most Encountered</h2>
          {stats.mostEncounteredPokemon ? (
            <div className="text-center">
              <img
                src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${stats.mostEncounteredPokemon.id}.png`}
                alt={stats.mostEncounteredPokemon.name}
                className="mx-auto w-32 h-32"
              />
              <p className="text-xl font-bold capitalize">{stats.mostEncounteredPokemon.name}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Encountered {stats.mostEncounteredPokemon.encounters} time
                {stats.mostEncounteredPokemon.encounters !== 1 ? 's' : ''}
              </p>
            </div>
          ) : (
            <p className="text-center text-gray-500">—</p>
          )}
        </div>

        {/* Quiz Result */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-semibold mb-4 border-b pb-2">Quiz Result</h2>
          {stats.quizResultPokemon ? (
            <div className="text-center">
              <img
                src={stats.quizResultPokemon.sprite}
                alt={stats.quizResultPokemon.name}
                className="mx-auto w-32 h-32"
              />
              <p className="text-xl font-bold capitalize">{stats.quizResultPokemon.name}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Your personality match</p>
              <Link
                href="/quiz"
                className="text-blue-500 hover:underline text-sm inline-block mt-2"
              >
                Retake Quiz
              </Link>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-gray-500 mb-3">Take the personality quiz!</p>
              <Link
                href="/quiz"
                className="inline-block bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                Start Quiz
              </Link>
            </div>
          )}
        </div>

        {/* Playtime */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-semibold mb-4 border-b pb-2">Journey Stats</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-300">Total Playtime:</span>
              <span className="font-bold text-xl">{stats.totalPlaytimeFormatted}</span>
            </div>
            {stats.startDate && (
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">Trainer Since:</span>
                <span className="font-bold">
                  {new Date(stats.startDate).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Badges Display */}
      {stats.badges.length > 0 && (
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-semibold mb-4 border-b pb-2">Badges Earned</h2>
          <div className="flex flex-wrap gap-3">
            {stats.badges.map((badge, index) => (
              <div
                key={index}
                className="bg-yellow-100 dark:bg-yellow-900 px-4 py-2 rounded-full border-2 border-yellow-400"
              >
                <span className="font-bold text-yellow-800 dark:text-yellow-200 capitalize">
                  {badge}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-8 text-center text-sm text-gray-500">
        <p>All statistics are read-only and calculated from your save data.</p>
      </div>
    </div>
  );
}
