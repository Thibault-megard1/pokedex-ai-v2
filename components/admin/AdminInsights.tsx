'use client';

import { useEffect, useState } from 'react';
import { TYPE_CHART } from '@/lib/typeRelations';

const TYPE_LIST = Object.keys(TYPE_CHART);

export default function AdminInsights() {
  const [view, setView] = useState<'types' | 'quiz' | 'battle'>('types');
  const [debugOverlayEnabled, setDebugOverlayEnabled] = useState(false);

  useEffect(() => {
    try {
      setDebugOverlayEnabled(localStorage.getItem('adminDebugOverlay') === 'true');
    } catch {
      // ignore
    }
  }, []);

  const toggleDebugOverlay = () => {
    const next = !debugOverlayEnabled;
    setDebugOverlayEnabled(next);
    try {
      localStorage.setItem('adminDebugOverlay', next ? 'true' : 'false');
    } catch {
      // ignore
    }
    try {
      window.dispatchEvent(new CustomEvent('admin:debug-overlay', { detail: { enabled: next } }));
    } catch {
      // ignore
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          🔍 System Insights
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          Read-only visualizations of game mechanics and formulas
        </p>

        <div className="mb-6 bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-300 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold text-yellow-900 dark:text-yellow-200">
                Debug overlay (admin)
              </div>
              <div className="text-sm text-yellow-800 dark:text-yellow-300">
                Affiche collisions, warps et IDs des NPCs dans le jeu
              </div>
            </div>
            <button
              onClick={toggleDebugOverlay}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                debugOverlayEnabled ? 'bg-green-500' : 'bg-gray-300'
              }`}
              aria-pressed={debugOverlayEnabled}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                  debugOverlayEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* View Selector */}
        <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setView('types')}
            className={`px-4 py-2 font-semibold transition-colors ${
              view === 'types'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
            }`}
          >
            Type Effectiveness
          </button>
          <button
            onClick={() => setView('quiz')}
            className={`px-4 py-2 font-semibold transition-colors ${
              view === 'quiz'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
            }`}
          >
            Quiz Scoring
          </button>
          <button
            onClick={() => setView('battle')}
            className={`px-4 py-2 font-semibold transition-colors ${
              view === 'battle'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
            }`}
          >
            Battle Formulas
          </button>
        </div>

        {/* Type Effectiveness View */}
        {view === 'types' && (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              Table d'efficacite des types
            </h3>

            <div className="overflow-x-auto">
              <table className="min-w-full text-xs border border-gray-300 dark:border-gray-700">
                <thead className="bg-gray-100 dark:bg-gray-700">
                  <tr>
                    <th className="p-2 text-left">Defense \ Attaque</th>
                    {TYPE_LIST.map((type) => (
                      <th key={type} className="p-2 text-center capitalize">
                        {type}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {TYPE_LIST.map((defType) => (
                    <tr key={defType} className="border-t border-gray-200 dark:border-gray-700">
                      <td className="p-2 font-semibold capitalize bg-gray-50 dark:bg-gray-800">
                        {defType}
                      </td>
                      {TYPE_LIST.map((atkType) => {
                        const value = TYPE_CHART[defType][atkType];
                        const bg = value === 0
                          ? 'bg-gray-300 dark:bg-gray-600'
                          : value < 1
                          ? 'bg-yellow-200 dark:bg-yellow-700/40'
                          : value > 1
                          ? 'bg-red-200 dark:bg-red-700/40'
                          : 'bg-green-100 dark:bg-green-700/30';
                        return (
                          <td key={`${defType}-${atkType}`} className={`p-2 text-center ${bg}`}>
                            {value}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="text-xs text-gray-600 dark:text-gray-300">
              Valeurs: 0 = immunite, 0.5 = peu efficace, 1 = neutre, 2 = super efficace.
            </div>
          </div>
        )}

        {/* Quiz Scoring View */}
        {view === 'quiz' && (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              Poids du scoring du quiz
            </h3>

            <div className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 border-2 border-purple-400 rounded-lg p-4">
              <h4 className="font-semibold text-purple-900 dark:text-purple-100 mb-2">
                Synthese des poids
              </h4>
              <div className="space-y-3">
                {[
                  { label: 'Type matching', value: 40, desc: 'Types dominants du profil' },
                  { label: 'Stats correlation', value: 30, desc: 'Similarite des distributions' },
                  { label: 'Bonus Pokemon iconique', value: 10, desc: 'Bonus fixe (liste courte)' },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="flex items-center justify-between text-sm text-purple-900 dark:text-purple-100">
                      <span className="font-semibold">{item.label}</span>
                      <span>{item.value}</span>
                    </div>
                    <div className="h-2 bg-purple-200 dark:bg-purple-900/40 rounded">
                      <div
                        className="h-2 bg-purple-600 rounded"
                        style={{ width: `${item.value}%` }}
                      />
                    </div>
                    <div className="text-xs text-purple-800 dark:text-purple-200">
                      {item.desc}
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-purple-800 dark:text-purple-200 mt-3">
                Les scores initiaux proviennent des reponses (types, stats, habitats) avant la compatibilite finale.
              </p>
            </div>
          </div>
        )}

        {/* Battle Formulas View */}
        {view === 'battle' && (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              Formules de degats
            </h3>

            <div className="space-y-3">
              <div className="bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-800/30 border-2 border-red-400 rounded-lg p-4">
                <h4 className="font-semibold text-red-900 dark:text-red-100 mb-2">
                  Base Damage Formula
                </h4>
                <code className="block bg-white dark:bg-gray-800 p-3 rounded text-sm font-mono">
                  Damage = ((((2 * Level / 5 + 2) * Power * A/D) / 50) + 2) * Modifiers
                </code>
                <p className="text-xs text-red-800 dark:text-red-200 mt-2">
                  Modifiers: STAB, efficacite de type, facteur aleatoire, coup critique
                </p>
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 border-2 border-blue-400 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                  Type Effectiveness Multipliers
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-blue-800 dark:text-blue-200">Super Effective:</span>
                    <code className="bg-white dark:bg-gray-800 px-2 py-1 rounded">2.0x</code>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-800 dark:text-blue-200">Normal Damage:</span>
                    <code className="bg-white dark:bg-gray-800 px-2 py-1 rounded">1.0x</code>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-800 dark:text-blue-200">Not Very Effective:</span>
                    <code className="bg-white dark:bg-gray-800 px-2 py-1 rounded">0.5x</code>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-800 dark:text-blue-200">No Effect (Immune):</span>
                    <code className="bg-white dark:bg-gray-800 px-2 py-1 rounded">0.0x</code>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 border-2 border-green-400 rounded-lg p-4">
                <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2">
                  Experience Gain Formula
                </h4>
                <code className="block bg-white dark:bg-gray-800 p-3 rounded text-sm font-mono">
                  xp = (baseExp × enemyLevel) / 7
                </code>
                <p className="text-xs text-green-800 dark:text-green-200 mt-2">
                  Where: baseExp depends on the defeated Pokémon species, enemyLevel is the
                  level of the defeated Pokémon
                </p>
              </div>

              <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-900/30 dark:to-yellow-800/30 border-2 border-yellow-400 rounded-lg p-4">
                <h4 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-2">
                  Critical Hit
                </h4>
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  Random chance (typically 6.25%) to deal 1.5x damage
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
