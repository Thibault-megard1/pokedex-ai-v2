"use client";

import { useState, useEffect } from 'react';
import PokemonAutocomplete from '@/components/PokemonAutocomplete';
import {
  NATURES,
  createPerfectIVs,
  createEmptyEVs,
  calculateAllStats,
  validateIVs,
  validateEVs,
  getTotalEVs,
  COMMON_EV_SPREADS,
  type BaseStats,
  type IVs,
  type EVs,
  type CalculatedStats,
} from '@/lib/ivEvCalculator';

export default function IvEvCalculatorPage() {
  const [pokemonName, setPokemonName] = useState('');
  const [baseStats, setBaseStats] = useState<BaseStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [level, setLevel] = useState(100);
  const [nature, setNature] = useState('Hardy');
  const [ivs, setIvs] = useState<IVs>(createPerfectIVs());
  const [evs, setEvs] = useState<EVs>(createEmptyEVs());
  
  const [calculatedStats, setCalculatedStats] = useState<CalculatedStats | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const totalEvs = getTotalEVs(evs);
  const remainingEvs = 510 - totalEvs;

  // Recalcule les stats finales a chaque modification d'entree.
  useEffect(() => {
    if (!baseStats) return;
    
    const ivValidation = validateIVs(ivs);
    const evValidation = validateEVs(evs);
    
    const errors = [...ivValidation.errors, ...evValidation.errors];
    setValidationErrors(errors);
    
    if (errors.length === 0) {
      const stats = calculateAllStats(baseStats, ivs, evs, level, nature);
      setCalculatedStats(stats);
    } else {
      setCalculatedStats(null);
    }
  }, [baseStats, ivs, evs, level, nature]);

  async function loadPokemon() {
    // Charge les stats de base depuis l'API interne.
    if (!pokemonName.trim()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const res = await fetch(`/api/pokemon?name=${encodeURIComponent(pokemonName.toLowerCase())}`);
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Pokémon non trouvé');
      }
      
      // Extract base stats from API response
      const stats: BaseStats = {
        hp: data.pokemon.stats.find((s: any) => s.name === 'hp')?.value || 0,
        attack: data.pokemon.stats.find((s: any) => s.name === 'attack')?.value || 0,
        defense: data.pokemon.stats.find((s: any) => s.name === 'defense')?.value || 0,
        specialAttack: data.pokemon.stats.find((s: any) => s.name === 'special-attack')?.value || 0,
        specialDefense: data.pokemon.stats.find((s: any) => s.name === 'special-defense')?.value || 0,
        speed: data.pokemon.stats.find((s: any) => s.name === 'speed')?.value || 0,
      };
      
      setBaseStats(stats);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function setIV(stat: keyof IVs, value: number) {
    // Clamp [0..31] pour respecter les IVs.
    setIvs(prev => ({ ...prev, [stat]: Math.max(0, Math.min(31, value)) }));
  }

  function setEV(stat: keyof EVs, value: number) {
    // Clamp [0..252] et limite globale a 510 EVs.
    const clamped = Math.max(0, Math.min(252, value));
    const newEvs = { ...evs, [stat]: clamped };
    const total = getTotalEVs(newEvs);
    
    if (total <= 510) {
      setEvs(newEvs);
    }
  }

  function applyEvSpread(spreadKey: string) {
    // Applique un repartition EV predefinie.
    const spread = COMMON_EV_SPREADS[spreadKey];
    if (spread) {
      setEvs(spread.evs);
    }
  }

  function resetIVs() {
    // Remet les IVs a 31 partout.
    setIvs(createPerfectIVs());
  }

  function resetEVs() {
    // Remet les EVs a 0 partout.
    setEvs(createEmptyEVs());
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-4xl font-bold text-center mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            📊 Calculateur IV/EV
          </h1>
          <p className="text-center text-gray-600 dark:text-gray-400">
            Calculez les statistiques finales de vos Pokémon compétitifs
          </p>
        </div>

        {/* Pokemon Selection */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-bold mb-4">1️⃣ Sélectionner un Pokémon</h2>
          <div className="flex gap-3">
            <div className="flex-1">
              <PokemonAutocomplete
                id="iv-ev-pokemon"
                value={pokemonName}
                onChange={setPokemonName}
                placeholder="Rechercher un Pokémon..."
              />
            </div>
            <button
              onClick={loadPokemon}
              disabled={loading || !pokemonName.trim()}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-bold transition-colors"
            >
              {loading ? '⏳' : '🔍'} Charger
            </button>
          </div>
          
          {error && (
            <div className="mt-3 bg-red-50 border border-red-200 text-red-700 rounded-lg p-3">
              ⚠️ {error}
            </div>
          )}
          
          {baseStats && (
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <h3 className="font-bold mb-2 capitalize">{pokemonName} - Stats de base</h3>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-3 text-sm">
                <div><strong>HP:</strong> {baseStats.hp}</div>
                <div><strong>Atk:</strong> {baseStats.attack}</div>
                <div><strong>Def:</strong> {baseStats.defense}</div>
                <div><strong>SpA:</strong> {baseStats.specialAttack}</div>
                <div><strong>SpD:</strong> {baseStats.specialDefense}</div>
                <div><strong>Spe:</strong> {baseStats.speed}</div>
              </div>
            </div>
          )}
        </div>

        {baseStats && (
          <>
            {/* Level and Nature */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
              <h2 className="text-2xl font-bold mb-4">2️⃣ Niveau et Nature</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block font-bold mb-2">Niveau (1-100)</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={level}
                    onChange={(e) => setLevel(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-2">Nature</label>
                  <select
                    value={nature}
                    onChange={(e) => setNature(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  >
                    {Object.keys(NATURES).map(n => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* IVs */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">3️⃣ IVs (Individual Values: 0-31)</h2>
                <button
                  onClick={resetIVs}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-bold"
                >
                  ✨ Max (31)
                </button>
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                {(['hp', 'attack', 'defense', 'specialAttack', 'specialDefense', 'speed'] as const).map(stat => (
                  <div key={stat}>
                    <label className="block font-bold mb-2 capitalize">
                      {stat === 'specialAttack' ? 'Special Attack' : stat === 'specialDefense' ? 'Special Defense' : stat}
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="31"
                      value={ivs[stat]}
                      onChange={(e) => setIV(stat, parseInt(e.target.value) || 0)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* EVs */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold">4️⃣ EVs (Effort Values: 0-252)</h2>
                  <p className={`text-sm ${remainingEvs < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                    Total: {totalEvs}/510 | Restants: {remainingEvs}
                  </p>
                </div>
                <button
                  onClick={resetEVs}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm font-bold"
                >
                  🔄 Reset
                </button>
              </div>
              
              {/* Common spreads */}
              <div className="mb-4 flex flex-wrap gap-2">
                {Object.entries(COMMON_EV_SPREADS).map(([key, spread]) => (
                  <button
                    key={key}
                    onClick={() => applyEvSpread(key)}
                    className="px-3 py-1 bg-purple-100 hover:bg-purple-200 text-purple-800 rounded-lg text-sm font-bold"
                    title={spread.description}
                  >
                    {spread.description}
                  </button>
                ))}
              </div>
              
              <div className="grid md:grid-cols-3 gap-4">
                {(['hp', 'attack', 'defense', 'specialAttack', 'specialDefense', 'speed'] as const).map(stat => (
                  <div key={stat}>
                    <label className="block font-bold mb-2 capitalize">
                      {stat === 'specialAttack' ? 'Special Attack' : stat === 'specialDefense' ? 'Special Defense' : stat}
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="252"
                      step="4"
                      value={evs[stat]}
                      onChange={(e) => setEV(stat, parseInt(e.target.value) || 0)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Validation Errors */}
            {validationErrors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <h3 className="font-bold text-red-800 mb-2">⚠️ Erreurs de validation</h3>
                <ul className="list-disc list-inside text-red-700 text-sm">
                  {validationErrors.map((err, idx) => (
                    <li key={idx}>{err}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Calculated Stats */}
            {calculatedStats && (
              <div className="bg-gradient-to-br from-green-500 to-blue-600 text-white rounded-lg shadow-xl p-6">
                <h2 className="text-3xl font-bold mb-4 text-center">📈 Statistiques Finales</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                  <div className="bg-white/20 backdrop-blur rounded-lg p-4 text-center">
                    <div className="text-sm opacity-90">HP</div>
                    <div className="text-3xl font-bold">{calculatedStats.hp}</div>
                  </div>
                  <div className="bg-white/20 backdrop-blur rounded-lg p-4 text-center">
                    <div className="text-sm opacity-90">Attack</div>
                    <div className="text-3xl font-bold">{calculatedStats.attack}</div>
                  </div>
                  <div className="bg-white/20 backdrop-blur rounded-lg p-4 text-center">
                    <div className="text-sm opacity-90">Defense</div>
                    <div className="text-3xl font-bold">{calculatedStats.defense}</div>
                  </div>
                  <div className="bg-white/20 backdrop-blur rounded-lg p-4 text-center">
                    <div className="text-sm opacity-90">Sp. Atk</div>
                    <div className="text-3xl font-bold">{calculatedStats.specialAttack}</div>
                  </div>
                  <div className="bg-white/20 backdrop-blur rounded-lg p-4 text-center">
                    <div className="text-sm opacity-90">Sp. Def</div>
                    <div className="text-3xl font-bold">{calculatedStats.specialDefense}</div>
                  </div>
                  <div className="bg-white/20 backdrop-blur rounded-lg p-4 text-center">
                    <div className="text-sm opacity-90">Speed</div>
                    <div className="text-3xl font-bold">{calculatedStats.speed}</div>
                  </div>
                </div>
                <div className="text-center border-t border-white/30 pt-4">
                  <div className="text-sm opacity-90">Total des Stats</div>
                  <div className="text-4xl font-bold">{calculatedStats.total}</div>
                </div>
              </div>
            )}

            {/* Info Box */}
            <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 rounded-lg p-4">
              <h3 className="font-bold text-blue-800 dark:text-blue-300 mb-2">💡 Informations</h3>
              <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1">
                <li>• Les <strong>IVs</strong> vont de 0 à 31 (parfait = 31)</li>
                <li>• Les <strong>EVs</strong> vont de 0 à 252 par stat, maximum 510 au total</li>
                <li>• 4 EVs = +1 stat au niveau 100</li>
                <li>• La <strong>nature</strong> augmente une stat de 10% et en réduit une autre de 10%</li>
                <li>• Les natures neutres (Hardy, Docile, etc.) ne modifient aucune stat</li>
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
