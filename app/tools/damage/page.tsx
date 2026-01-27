"use client";

import { useState, useEffect } from 'react';
import PokemonAutocomplete from '@/components/PokemonAutocomplete';
import {
  calculateDamage,
  getTypeEffectiveness,
  getEffectivenessText,
  formatDamageRange,
  type Pokemon,
  type Move,
  type Modifiers,
  type BattleConditions,
  type Weather,
  type Terrain,
  type Screen,
  type Item,
} from '@/lib/advancedDamageCalculator';

export default function DamageCalculatorPage() {
  const [attackerName, setAttackerName] = useState('');
  const [defenderName, setDefenderName] = useState('');
  const [moveName, setMoveName] = useState('');
  
  const [attacker, setAttacker] = useState<Pokemon | null>(null);
  const [defender, setDefender] = useState<Pokemon | null>(null);
  const [move, setMove] = useState<Move | null>(null);
  const [moves, setMoves] = useState<Move[]>([]);
  
  const [attackerModifiers, setAttackerModifiers] = useState<Modifiers>({
    attackBoost: 0,
    defenseBoost: 0,
    specialAttackBoost: 0,
    specialDefenseBoost: 0,
    item: 'none',
  });
  
  const [defenderModifiers, setDefenderModifiers] = useState<Modifiers>({
    attackBoost: 0,
    defenseBoost: 0,
    specialAttackBoost: 0,
    specialDefenseBoost: 0,
    item: 'none',
  });
  
  const [conditions, setConditions] = useState<BattleConditions>({
    weather: 'none',
    terrain: 'none',
    attackerScreen: 'none',
    defenderScreen: 'none',
  });
  
  const [loading, setLoading] = useState({ attacker: false, defender: false, moves: false });
  const [error, setError] = useState<string | null>(null);

  async function loadPokemon(name: string, role: 'attacker' | 'defender') {
    if (!name.trim()) return;
    
    setLoading(prev => ({ ...prev, [role]: true }));
    setError(null);
    
    try {
      const res = await fetch(`/api/pokemon?name=${encodeURIComponent(name.toLowerCase())}`);
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Pokémon non trouvé');
      }
      
      const pokemon: Pokemon = {
        name: data.pokemon.name,
        level: 100,
        attack: data.pokemon.stats.find((s: any) => s.name === 'attack')?.value || 0,
        defense: data.pokemon.stats.find((s: any) => s.name === 'defense')?.value || 0,
        specialAttack: data.pokemon.stats.find((s: any) => s.name === 'special-attack')?.value || 0,
        specialDefense: data.pokemon.stats.find((s: any) => s.name === 'special-defense')?.value || 0,
        hp: data.pokemon.stats.find((s: any) => s.name === 'hp')?.value || 0,
        types: data.pokemon.types || [],
      };
      
      if (role === 'attacker') {
        setAttacker(pokemon);
        // Load moves for attacker
        await loadMoves(name);
      } else {
        setDefender(pokemon);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(prev => ({ ...prev, [role]: false }));
    }
  }

  async function loadMoves(pokemonName: string) {
    setLoading(prev => ({ ...prev, moves: true }));
    
    try {
      const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonName.toLowerCase()}`);
      const data = await res.json();
      
      // Fetch move details (limited to first 20 for performance)
      const movePromises = data.moves.slice(0, 20).map(async (m: any) => {
        const moveRes = await fetch(m.move.url);
        const moveData = await moveRes.json();
        
        return {
          name: moveData.name,
          power: moveData.power || 0,
          type: moveData.type.name,
          category: moveData.damage_class.name as 'physical' | 'special',
        };
      });
      
      const loadedMoves = await Promise.all(movePromises);
      const damageMoves = loadedMoves.filter(m => m.power > 0);
      
      setMoves(damageMoves);
    } catch (err) {
      console.error('Failed to load moves:', err);
    } finally {
      setLoading(prev => ({ ...prev, moves: false }));
    }
  }

  function selectMove(moveName: string) {
    const selectedMove = moves.find(m => m.name === moveName);
    if (selectedMove) {
      setMove(selectedMove);
      setMoveName(moveName);
    }
  }

  const result = attacker && defender && move
    ? calculateDamage(attacker, defender, move, attackerModifiers, defenderModifiers, conditions)
    : null;
    
  const effectiveness = move && defender
    ? getTypeEffectiveness(move.type, defender.types)
    : 1;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-4xl font-bold text-center mb-2 bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
            ⚔️ Calculateur de Dégâts Pro
          </h1>
          <p className="text-center text-gray-600 dark:text-gray-400">
            Calculez les dégâts avec modificateurs avancés
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          {/* Attacker */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-4 text-red-600">⚔️ Attaquant</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block font-bold mb-2">Pokémon</label>
                <div className="flex gap-2">
                  <PokemonAutocomplete
                    id="attacker"
                    value={attackerName}
                    onChange={setAttackerName}
                    placeholder="Sélectionner l'attaquant..."
                  />
                  <button
                    onClick={() => loadPokemon(attackerName, 'attacker')}
                    disabled={loading.attacker}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold"
                  >
                    {loading.attacker ? '⏳' : '🔍'}
                  </button>
                </div>
              </div>
              
              {attacker && (
                <>
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <p className="font-bold capitalize">{attacker.name}</p>
                    <div className="grid grid-cols-2 gap-2 text-sm mt-2">
                      <div>Atk: {attacker.attack}</div>
                      <div>SpA: {attacker.specialAttack}</div>
                      <div>Types: {attacker.types.join(', ')}</div>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block font-bold mb-2">Niveau</label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={attacker.level}
                      onChange={(e) => setAttacker({ ...attacker, level: parseInt(e.target.value) || 100 })}
                      className="w-full px-4 py-2 border rounded-lg"
                    />
                  </div>
                  
                  <div>
                    <label className="block font-bold mb-2">Boosts de stats</label>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-sm">Atk: {attackerModifiers.attackBoost >= 0 ? '+' : ''}{attackerModifiers.attackBoost}</label>
                        <input
                          type="range"
                          min="-6"
                          max="6"
                          value={attackerModifiers.attackBoost}
                          onChange={(e) => setAttackerModifiers({ ...attackerModifiers, attackBoost: parseInt(e.target.value) })}
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label className="text-sm">SpA: {attackerModifiers.specialAttackBoost >= 0 ? '+' : ''}{attackerModifiers.specialAttackBoost}</label>
                        <input
                          type="range"
                          min="-6"
                          max="6"
                          value={attackerModifiers.specialAttackBoost}
                          onChange={(e) => setAttackerModifiers({ ...attackerModifiers, specialAttackBoost: parseInt(e.target.value) })}
                          className="w-full"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block font-bold mb-2">Objet</label>
                    <select
                      value={attackerModifiers.item}
                      onChange={(e) => setAttackerModifiers({ ...attackerModifiers, item: e.target.value as Item })}
                      className="w-full px-4 py-2 border rounded-lg"
                    >
                      <option value="none">Aucun</option>
                      <option value="lifeOrb">Life Orb (×1.3)</option>
                      <option value="choiceBand">Choice Band (Atk ×1.5)</option>
                      <option value="choiceSpecs">Choice Specs (SpA ×1.5)</option>
                    </select>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Defender */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-4 text-blue-600">🛡️ Défenseur</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block font-bold mb-2">Pokémon</label>
                <div className="flex gap-2">
                  <PokemonAutocomplete
                    id="defender"
                    value={defenderName}
                    onChange={setDefenderName}
                    placeholder="Sélectionner le défenseur..."
                  />
                  <button
                    onClick={() => loadPokemon(defenderName, 'defender')}
                    disabled={loading.defender}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold"
                  >
                    {loading.defender ? '⏳' : '🔍'}
                  </button>
                </div>
              </div>
              
              {defender && (
                <>
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="font-bold capitalize">{defender.name}</p>
                    <div className="grid grid-cols-2 gap-2 text-sm mt-2">
                      <div>HP: {defender.hp}</div>
                      <div>Def: {defender.defense}</div>
                      <div>SpD: {defender.specialDefense}</div>
                      <div>Types: {defender.types.join(', ')}</div>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block font-bold mb-2">Niveau</label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={defender.level}
                      onChange={(e) => setDefender({ ...defender, level: parseInt(e.target.value) || 100 })}
                      className="w-full px-4 py-2 border rounded-lg"
                    />
                  </div>
                  
                  <div>
                    <label className="block font-bold mb-2">Boosts de stats</label>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-sm">Def: {defenderModifiers.defenseBoost >= 0 ? '+' : ''}{defenderModifiers.defenseBoost}</label>
                        <input
                          type="range"
                          min="-6"
                          max="6"
                          value={defenderModifiers.defenseBoost}
                          onChange={(e) => setDefenderModifiers({ ...defenderModifiers, defenseBoost: parseInt(e.target.value) })}
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label className="text-sm">SpD: {defenderModifiers.specialDefenseBoost >= 0 ? '+' : ''}{defenderModifiers.specialDefenseBoost}</label>
                        <input
                          type="range"
                          min="-6"
                          max="6"
                          value={defenderModifiers.specialDefenseBoost}
                          onChange={(e) => setDefenderModifiers({ ...defenderModifiers, specialDefenseBoost: parseInt(e.target.value) })}
                          className="w-full"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block font-bold mb-2">Écran défensif</label>
                    <select
                      value={conditions.defenderScreen}
                      onChange={(e) => setConditions({ ...conditions, defenderScreen: e.target.value as Screen })}
                      className="w-full px-4 py-2 border rounded-lg"
                    >
                      <option value="none">Aucun</option>
                      <option value="reflect">Reflect (physique)</option>
                      <option value="lightScreen">Light Screen (spécial)</option>
                      <option value="auroraVeil">Aurora Veil (les deux)</option>
                    </select>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Move Selection */}
        {attacker && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-2xl font-bold mb-4">🎯 Capacité</h2>
            
            {loading.moves ? (
              <p>Chargement des capacités...</p>
            ) : moves.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {moves.map(m => (
                  <button
                    key={m.name}
                    onClick={() => selectMove(m.name)}
                    className={`p-3 rounded-lg border-2 text-left transition-colors ${
                      moveName === m.name
                        ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20'
                        : 'border-gray-300 hover:border-purple-400'
                    }`}
                  >
                    <p className="font-bold capitalize">{m.name.replace('-', ' ')}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {m.type} • {m.category} • {m.power} BP
                    </p>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-gray-600 dark:text-gray-300">Aucune capacité chargée</p>
            )}
          </div>
        )}

        {/* Battle Conditions */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-bold mb-4">🌦️ Conditions de Combat</h2>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold mb-2">Météo</label>
              <select
                value={conditions.weather}
                onChange={(e) => setConditions({ ...conditions, weather: e.target.value as Weather })}
                className="w-full px-4 py-2 border rounded-lg"
              >
                <option value="none">Aucune</option>
                <option value="sun">☀️ Soleil (Feu ×1.5, Eau ×0.5)</option>
                <option value="rain">🌧️ Pluie (Eau ×1.5, Feu ×0.5)</option>
                <option value="sand">🏜️ Tempête de sable</option>
                <option value="snow">❄️ Neige</option>
              </select>
            </div>
            
            <div>
              <label className="block font-bold mb-2">Terrain</label>
              <select
                value={conditions.terrain}
                onChange={(e) => setConditions({ ...conditions, terrain: e.target.value as Terrain })}
                className="w-full px-4 py-2 border rounded-lg"
              >
                <option value="none">Aucun</option>
                <option value="electric">⚡ Électrique (×1.3)</option>
                <option value="grassy">🌿 Herbu (×1.3)</option>
                <option value="psychic">🔮 Psychique (×1.3)</option>
                <option value="misty">🌫️ Brumeux</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results */}
        {result && (
          <div className="bg-gradient-to-br from-purple-500 to-pink-600 text-white rounded-lg shadow-xl p-6">
            <h2 className="text-3xl font-bold mb-4 text-center">💥 Résultats</h2>
            
            <div className="grid md:grid-cols-3 gap-4 mb-4">
              <div className="bg-white/20 backdrop-blur rounded-lg p-4 text-center">
                <div className="text-sm opacity-90">Dégâts</div>
                <div className="text-3xl font-bold">{result.minDamage} - {result.maxDamage}</div>
              </div>
              
              <div className="bg-white/20 backdrop-blur rounded-lg p-4 text-center">
                <div className="text-sm opacity-90">Pourcentage HP</div>
                <div className="text-3xl font-bold">{result.minPercent.toFixed(1)}% - {result.maxPercent.toFixed(1)}%</div>
              </div>
              
              <div className="bg-white/20 backdrop-blur rounded-lg p-4 text-center">
                <div className="text-sm opacity-90">Chance de KO</div>
                <div className="text-3xl font-bold">{result.koChance}</div>
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <p className="text-center">
                <strong>Efficacité:</strong> {getEffectivenessText(effectiveness)} (×{effectiveness})
              </p>
              {result.isKO && (
                <p className="text-center mt-2 text-yellow-300 font-bold text-xl">
                  ⚡ KO GARANTI !
                </p>
              )}
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">
            ⚠️ {error}
          </div>
        )}
      </div>
    </div>
  );
}
