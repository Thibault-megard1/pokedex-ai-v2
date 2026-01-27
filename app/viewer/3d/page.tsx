"use client";

import { useState, useRef, useEffect } from 'react';
import PokemonAutocomplete from '@/components/PokemonAutocomplete';

export default function Viewer3DPage() {
  const [pokemonName, setPokemonName] = useState('');
  const [pokemon, setPokemon] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [model3DAvailable, setModel3DAvailable] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  async function loadPokemon() {
    if (!pokemonName.trim()) return;
    
    setLoading(true);
    setError(null);
    setModel3DAvailable(false);
    
    try {
      const res = await fetch(`/api/pokemon?name=${encodeURIComponent(pokemonName.toLowerCase())}`);
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Pokémon non trouvé');
      }
      
      setPokemon(data.pokemon);
      
      // Check if 3D model available (simplified - using sprite as fallback)
      // In a real implementation, you would check a 3D model API
      setModel3DAvailable(false); // For now, always use sprite fallback
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Initialize Three.js scene (simplified version)
  useEffect(() => {
    if (!canvasRef.current || !pokemon) return;
    
    // For now, we'll use a simple 2D sprite display
    // Full Three.js implementation would require loading 3D models
    
    return () => {
      // Cleanup
    };
  }, [pokemon]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-4xl font-bold text-center mb-2 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            🎨 Visionneuse 3D Pokémon
          </h1>
          <p className="text-center text-gray-600 dark:text-gray-400">
            Explorez les Pokémon en 3D (fonctionnalité en développement)
          </p>
        </div>

        {/* Pokemon Selection */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-bold mb-4">Sélectionner un Pokémon</h2>
          <div className="flex gap-3">
            <div className="flex-1">
              <PokemonAutocomplete
                id="viewer-3d-pokemon"
                value={pokemonName}
                onChange={setPokemonName}
                placeholder="Rechercher un Pokémon..."
              />
            </div>
            <button
              onClick={loadPokemon}
              disabled={loading || !pokemonName.trim()}
              className="px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white rounded-lg font-bold transition-colors"
            >
              {loading ? '⏳' : '🔍'} Charger
            </button>
          </div>
          
          {error && (
            <div className="mt-3 bg-red-50 border border-red-200 text-red-700 rounded-lg p-3">
              ⚠️ {error}
            </div>
          )}
        </div>

        {/* Viewer */}
        {pokemon && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="text-center mb-4">
              <h2 className="text-3xl font-bold capitalize">{pokemon.name}</h2>
              <p className="text-gray-600">#{String(pokemon.id).padStart(3, '0')}</p>
            </div>

            {!model3DAvailable ? (
              <div className="bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-8">
                <div className="flex flex-col items-center">
                  {/* Sprite Display (Fallback) */}
                  {pokemon.sprite && (
                    <div className="relative">
                      <img
                        src={pokemon.sprite}
                        alt={pokemon.name}
                        className="w-64 h-64 object-contain"
                        style={{ imageRendering: 'pixelated' }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-full h-full bg-gradient-to-b from-transparent via-white/10 to-transparent"></div>
                      </div>
                    </div>
                  )}
                  
                  <div className="mt-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 rounded-lg p-4 max-w-md">
                    <p className="text-center text-yellow-800 dark:text-yellow-300">
                      <strong>⚠️ Modèle 3D non disponible</strong>
                    </p>
                    <p className="text-sm text-center text-yellow-700 dark:text-yellow-400 mt-2">
                      La visualisation 3D complète nécessite des modèles externes. 
                      Le sprite 2D est affiché à la place.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="relative bg-gray-900 rounded-lg" style={{ height: '500px' }}>
                <canvas ref={canvasRef} className="w-full h-full rounded-lg" />
                
                {/* Controls */}
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white/90 dark:bg-gray-800/90 backdrop-blur rounded-lg p-3 shadow-lg">
                  <div className="flex gap-2">
                    <button className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm font-bold">
                      🔄 Rotation
                    </button>
                    <button className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm font-bold">
                      🔍 Zoom
                    </button>
                    <button className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm font-bold">
                      🔆 Lumière
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Pokemon Info */}
            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 text-center">
                <div className="text-sm text-gray-600 dark:text-gray-400">Types</div>
                <div className="font-bold capitalize">{pokemon.types?.join(', ')}</div>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 text-center">
                <div className="text-sm text-gray-600 dark:text-gray-400">Taille</div>
                <div className="font-bold">{(pokemon.height / 10).toFixed(1)} m</div>
              </div>
              <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3 text-center">
                <div className="text-sm text-gray-600 dark:text-gray-400">Poids</div>
                <div className="font-bold">{(pokemon.weight / 10).toFixed(1)} kg</div>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 text-center">
                <div className="text-sm text-gray-600 dark:text-gray-400">Génération</div>
                <div className="font-bold">-</div>
              </div>
            </div>
          </div>
        )}

        {/* Info Box */}
        <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 rounded-lg p-4">
          <h3 className="font-bold text-blue-800 dark:text-blue-300 mb-2">💡 À propos de la visionneuse 3D</h3>
          <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1">
            <li>• Cette fonctionnalité est en développement</li>
            <li>• Les modèles 3D officiels ne sont pas publiquement disponibles via API</li>
            <li>• Le sprite 2D haute résolution est affiché en attendant</li>
            <li>• Une future version pourrait intégrer des modèles communautaires</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
