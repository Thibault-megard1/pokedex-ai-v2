"use client";

import { useState } from "react";
import Link from "next/link";
import PokemonAutocomplete from "@/components/PokemonAutocomplete";
import { calculateDamage, calculateCriticalDamage, ITEMS, NATURES, type CalculatorInput } from "@/lib/damageCalculator";
import TypeBadge from "@/components/TypeBadge";
import type { BadgeKey } from "@/lib/typeBadgesSprite";

type PokeLite = {
  name: string;
  types: string[];
  stats: { name: string; value: number }[];
};

export default function DamageCalculatorPage() {
  const [attackerName, setAttackerName] = useState("");
  const [defenderName, setDefenderName] = useState("");
  const [attacker, setAttacker] = useState<PokeLite | null>(null);
  const [defender, setDefender] = useState<PokeLite | null>(null);

  const [movePower, setMovePower] = useState(80);
  const [moveType, setMoveType] = useState("normal");
  const [isPhysical, setIsPhysical] = useState(true);
  const [level, setLevel] = useState(50);
  
  const [attackerNature, setAttackerNature] = useState("Hardy");
  const [defenderNature, setDefenderNature] = useState("Hardy");
  const [attackerEVs, setAttackerEVs] = useState(0);
  const [defenderEVs, setDefenderEVs] = useState(0);
  const [item, setItem] = useState("none");
  const [weatherBoost, setWeatherBoost] = useState(false);

  const [result, setResult] = useState<ReturnType<typeof calculateDamage> | null>(null);
  const [critResult, setCritResult] = useState<ReturnType<typeof calculateCriticalDamage> | null>(null);

  async function loadPokemon(name: string, type: "attacker" | "defender") {
    try {
      const res = await fetch(`/api/pokemon?name=${encodeURIComponent(name)}`);
      const data = await res.json();
      if (res.ok) {
        if (type === "attacker") {
          setAttacker(data.pokemon);
          if (data.pokemon.types[0]) setMoveType(data.pokemon.types[0]);
        } else {
          setDefender(data.pokemon);
        }
      }
    } catch (err) {
      console.error("Error loading pokemon:", err);
    }
  }

  function calculate() {
    if (!attacker || !defender) return;

    const atkStat = isPhysical ? "attack" : "special-attack";
    const defStat = isPhysical ? "defense" : "special-defense";

    const atkBase = attacker.stats.find(s => s.name === atkStat)?.value || 100;
    const defBase = defender.stats.find(s => s.name === defStat)?.value || 100;

    const atkNature = NATURES.find(n => n.name === attackerNature);
    const defNature = NATURES.find(n => n.name === defenderNature);

    const input: CalculatorInput = {
      attackerLevel: level,
      attackerAttack: atkBase,
      defenderDefense: defBase,
      movePower,
      attackerType: attacker.types,
      defenderType: defender.types,
      moveType,
      isPhysical,
      attackerNature: atkNature ? { increased: atkNature.increased || undefined, decreased: atkNature.decreased || undefined } : undefined,
      defenderNature: defNature ? { increased: defNature.increased || undefined, decreased: defNature.decreased || undefined } : undefined,
      attackerEVs,
      defenderEVs,
      itemMultiplier: ITEMS[item as keyof typeof ITEMS]?.multiplier || 1,
      weatherBoost
    };

    setResult(calculateDamage(input));
    setCritResult(calculateCriticalDamage(input));
  }

  return (
    <div className="page-content mt-24 space-y-4">
      <div className="card p-6">
        <h1 className="text-2xl font-bold mb-2">🧮 Calculateur de Dégâts Avancé</h1>
        <p className="text-gray-600">Calculs basés sur les formules officielles Pokémon</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Attaquant */}
        <div className="card p-5">
          <h3 className="font-bold text-lg mb-3">⚔️ Attaquant</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Pokémon</label>
              <PokemonAutocomplete
                id="attacker"
                value={attackerName}
                onChange={(val) => {
                  setAttackerName(val);
                  if (val) loadPokemon(val, "attacker");
                }}
                placeholder="Pikachu"
              />
            </div>

            {attacker && (
              <div className="p-3 bg-blue-50 rounded flex items-center gap-3">
                <img src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${attacker.stats.find(s => s.name === "hp")?.value || 1}.png`} 
                     alt={attacker.name} className="w-16 h-16" />
                <div>
                  <p className="font-bold capitalize">{attacker.name}</p>
                  <div className="flex gap-1">
                    {attacker.types.map(t => (
                      <TypeBadge key={t} kind={t as BadgeKey} width={70} />
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-1">Nature</label>
              <select className="input" value={attackerNature} onChange={(e) => setAttackerNature(e.target.value)}>
                {NATURES.map(n => (
                  <option key={n.name} value={n.name}>{n.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">EVs (0-252)</label>
              <input 
                type="number" 
                className="input" 
                min="0" 
                max="252" 
                value={attackerEVs} 
                onChange={(e) => setAttackerEVs(Number(e.target.value))} 
              />
            </div>
          </div>
        </div>

        {/* Défenseur */}
        <div className="card p-5">
          <h3 className="font-bold text-lg mb-3">🛡️ Défenseur</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Pokémon</label>
              <PokemonAutocomplete
                id="defender"
                value={defenderName}
                onChange={(val) => {
                  setDefenderName(val);
                  if (val) loadPokemon(val, "defender");
                }}
                placeholder="Charizard"
              />
            </div>

            {defender && (
              <div className="p-3 bg-red-50 rounded flex items-center gap-3">
                <img src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${defender.stats.find(s => s.name === "hp")?.value || 1}.png`} 
                     alt={defender.name} className="w-16 h-16" />
                <div>
                  <p className="font-bold capitalize">{defender.name}</p>
                  <div className="flex gap-1">
                    {defender.types.map(t => (
                      <TypeBadge key={t} kind={t as BadgeKey} width={70} />
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-1">Nature</label>
              <select className="input" value={defenderNature} onChange={(e) => setDefenderNature(e.target.value)}>
                {NATURES.map(n => (
                  <option key={n.name} value={n.name}>{n.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">EVs (0-252)</label>
              <input 
                type="number" 
                className="input" 
                min="0" 
                max="252" 
                value={defenderEVs} 
                onChange={(e) => setDefenderEVs(Number(e.target.value))} 
              />
            </div>
          </div>
        </div>
      </div>

      {/* Paramètres de l'attaque */}
      <div className="card p-5">
        <h3 className="font-bold text-lg mb-3">💥 Attaque</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Puissance</label>
            <input 
              type="number" 
              className="input" 
              value={movePower} 
              onChange={(e) => setMovePower(Number(e.target.value))} 
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Type</label>
            <select className="input" value={moveType} onChange={(e) => setMoveType(e.target.value)}>
              {["normal", "fire", "water", "electric", "grass", "ice", "fighting", "poison", "ground", "flying", "psychic", "bug", "rock", "ghost", "dragon", "dark", "steel", "fairy"].map(type => (
                <option key={type} value={type} className="capitalize">{type}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Catégorie</label>
            <select className="input" value={isPhysical ? "physical" : "special"} onChange={(e) => setIsPhysical(e.target.value === "physical")}>
              <option value="physical">Physique</option>
              <option value="special">Spéciale</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Niveau</label>
            <input 
              type="number" 
              className="input" 
              min="1" 
              max="100" 
              value={level} 
              onChange={(e) => setLevel(Number(e.target.value))} 
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Objet tenu</label>
            <select className="input" value={item} onChange={(e) => setItem(e.target.value)}>
              {Object.entries(ITEMS).map(([key, val]) => (
                <option key={key} value={key}>{val.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <label className="flex items-center gap-2">
              <input 
                type="checkbox" 
                checked={weatherBoost} 
                onChange={(e) => setWeatherBoost(e.target.checked)} 
              />
              <span className="text-sm">Boost Météo</span>
            </label>
          </div>
        </div>

        <button 
          className="btn btn-primary mt-4 w-full" 
          onClick={calculate}
          disabled={!attacker || !defender}
        >
          Calculer les dégâts
        </button>
      </div>

      {/* Résultats */}
      {result && (
        <div className="card p-5">
          <h3 className="font-bold text-lg mb-3">📊 Résultats</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 border-2 border-blue-300 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Dégâts normaux</p>
              <p className="text-3xl font-bold text-blue-900">
                {result.minDamage} - {result.maxDamage}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Efficacité: ×{result.effectiveness}
              </p>
            </div>

            {critResult && (
              <div className="p-4 bg-red-50 border-2 border-red-300 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Coup critique</p>
                <p className="text-3xl font-bold text-red-900">
                  {critResult.minDamage} - {critResult.maxDamage}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Efficacité: ×{critResult.effectiveness}
                </p>
              </div>
            )}
          </div>

          <div className="mt-4 space-y-2">
            <p className="text-sm font-semibold">Modificateurs appliqués:</p>
            <div className="flex flex-wrap gap-2">
              {result.description.map((desc, i) => (
                <span key={i} className="px-2 py-1 bg-gray-100 rounded text-xs">
                  {desc}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="card p-4 text-center">
        <Link href="/battle" className="btn">
          ← Retour au Combat Simple
        </Link>
      </div>
    </div>
  );
}
