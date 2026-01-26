"use client";
import { BACKGROUNDS } from "@/lib/backgrounds";

import { useEffect, useMemo, useState } from "react";
import PokemonAutocomplete from "@/components/PokemonAutocomplete";
import EvolutionDisplay from "@/components/EvolutionDisplay";
import TeamStrategyBuilder from "@/components/TeamStrategyBuilder";
import TypeBadge from "@/components/TypeBadge";
import type { BadgeKey } from "@/lib/typeBadgesSprite";

type TeamSlot = { slot: number; pokemonId: number; pokemonName: string };
type Me = { username: string } | null;
const slots = [1, 2, 3, 4, 5, 6];

type EvolutionNode = {
  id: number;
  name: string;
  level?: number;
  item?: string;
  trigger?: string;
};

type PokeLite = {
  id: number;
  name: string;
  sprite: string | null;
  types: string[];
  stats: { name: string; value: number }[];
  evolutionStage?: number | null;
  evolutionChain?: EvolutionNode[];
  nextEvolutions?: EvolutionNode[];
};

function StatRow({ s }: { s: { name: string; value: number } }) {
  const percentage = Math.min(100, (s.value / 255) * 100);
  const color = s.value >= 120 ? "green" : s.value >= 80 ? "blue" : s.value >= 50 ? "yellow" : "red";
  
  return (
    <div className="flex items-center gap-3">
      <div className="w-24 text-xs font-semibold text-gray-700 capitalize pokemon-text">
        {s.name}
      </div>
      <div className="flex-1 h-4 bg-gray-200 rounded-full overflow-hidden border border-gray-300">
        <div 
          className={`h-full hp-bar-${color} transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="w-12 text-right text-sm font-bold text-gray-800">
        {s.value}
      </div>
    </div>
  );
}

export default function TeamPage() {
  const [me, setMe] = useState<Me>(null);
  const [team, setTeam] = useState<TeamSlot[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [addName, setAddName] = useState<string>("");
  const [details, setDetails] = useState<Record<number, PokeLite | null>>({});
  const [expandedSlot, setExpandedSlot] = useState<number | null>(null);
  const sortedTeam = useMemo(() => [...team].sort((a, b) => a.slot - b.slot), [team]);
  
  async function load() {
    const meRes = await fetch("/api/me", { cache: "no-store" });
    const meData = await meRes.json();
    setMe(meData.user ?? null);
    const teamRes = await fetch("/api/team", { cache: "no-store" });
    const teamData = await teamRes.json();
    if (teamRes.ok) setTeam(teamData.team ?? []);
  }

  async function loadDetailFor(slot: number, name: string) {
    if (details[slot]) return;
    const res = await fetch(`/api/pokemon?name=${encodeURIComponent(name)}`, { cache: "no-store" });
    const data = await res.json();
    if (res.ok) {
      setDetails(prev => ({ ...prev, [slot]: data.pokemon as PokeLite }));
    } else {
      setDetails(prev => ({ ...prev, [slot]: null }));
    }
  }

  useEffect(() => {
    load();
    const url = new URL(window.location.href);
    const add = url.searchParams.get("add");
    if (add) {
      setAddName(add);
      url.searchParams.delete("add");
      window.history.replaceState({}, "", url.toString());
    }
  }, []);
  
  useEffect(() => {
    sortedTeam.forEach(s => { void loadDetailFor(s.slot, s.pokemonName); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortedTeam.map(s => s.pokemonName).join("|")]);
  
  async function addPokemon() {
    setError(null);
    const name = addName.trim().toLowerCase();
    if (!name) return;

    const next = [...sortedTeam];
    if (next.length >= 6) {
      setError("Équipe pleine (max 6).");
      return;
    }

    const used = new Set(next.map(s => s.slot));
    let slot = 1;
    while (used.has(slot) && slot <= 6) slot++;
    if (slot > 6) {
      setError("Aucun slot disponible.");
      return;
    }

    next.push({ slot, pokemonId: 0, pokemonName: name });
    const res = await fetch("/api/team", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ team: next })
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Erreur");
      return;
    }
    setTeam(data.team);
    setAddName("");
  }

  async function removeSlot(slot: number) {
    setError(null);
    const next = sortedTeam.filter(s => s.slot !== slot);
    const res = await fetch("/api/team", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ team: next })
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Erreur");
      return;
    }
    setTeam(data.team);
    setDetails(prev => {
      const copy = { ...prev };
      delete copy[slot];
      return copy;
    });
    if (expandedSlot === slot) setExpandedSlot(null);
  }

  if (!me) {
    return (
      <div className="page-bg min-h-screen" style={{ ["--bg-url" as any]: `url(${BACKGROUNDS.battle})` }}>
        <div className="page-content py-24 px-4">
          <div className="pokedex-panel max-w-2xl mx-auto pokedex-open-animation">
            <div className="pokedex-panel-content p-8 text-center">
              <div className="text-6xl mb-4">🔒</div>
              <h1 className="text-3xl font-bold text-pokemon mb-4">MON ÉQUIPE</h1>
              <p className="text-gray-600 mb-6">
                Vous devez être connecté pour gérer votre équipe Pokémon.
              </p>
              <div className="flex gap-3 justify-center">
                <a className="pokedex-button" href="/auth/login">
                  Connexion
                </a>
                <a className="pokedex-button-yellow" href="/auth/register">
                  Inscription
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-bg min-h-screen" style={{ ["--bg-url" as any]: `url(${BACKGROUNDS.battle})` }}>
      <div className="page-content py-24 px-4">
        
        {/* Header */}
        <div className="pokedex-panel max-w-6xl mx-auto mb-6 pokedex-open-animation">
          <div className="pokedex-panel-content p-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h1 className="text-3xl font-bold text-pokemon mb-2">MON ÉQUIPE POKÉMON</h1>
                <p className="text-sm text-gray-600">
                  Dresseur: <b className="text-pokemon">{me.username}</b> — {sortedTeam.length}/6 Pokémon
                </p>
              </div>
              
              <div className="bg-blue-50 border-2 border-blue-300 rounded-lg px-4 py-2">
                <div className="text-xs text-blue-600 font-bold pokemon-text">ÉQUIPE</div>
                <div className="text-2xl font-bold text-blue-900">{sortedTeam.length}/6</div>
              </div>
            </div>
          </div>
        </div>

        {/* Add Pokemon Section */}
        <div className="pokedex-screen max-w-6xl mx-auto mb-6 p-6">
          <h2 className="text-pokemon text-xl mb-4">➕ AJOUTER UN POKÉMON</h2>
          <div className="flex gap-3">
            <div className="flex-1">
              <PokemonAutocomplete
                id="team-add"
                value={addName}
                onChange={setAddName}
                placeholder="Rechercher un Pokémon (ex: pikachu)"
              />
            </div>
            <button className="pokedex-button-yellow min-w-[120px]" onClick={addPokemon}>
              Ajouter
            </button>
          </div>
          {error ? (
            <div className="mt-3 bg-red-50 border-2 border-red-300 rounded-lg p-3 text-sm text-red-700">
              ⚠️ {error}
            </div>
          ) : null}
        </div>

        {/* Team Grid */}
        <div className="max-w-6xl mx-auto mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(slot => {
              const s = sortedTeam.find(x => x.slot === slot);
              const d = s ? details[slot] : null;
              const expanded = expandedSlot === slot;

              return (
                <div key={slot} className="pokedex-card">
                  <div className="pokedex-card-header bg-gradient-to-r from-blue-500 to-blue-600">
                    <div className="flex items-center justify-between">
                      <span className="text-white font-bold pokemon-text text-sm">
                        SLOT {slot}
                      </span>
                      {s && (
                        <button 
                          className="bg-red-500 hover:bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full pokemon-text transition-colors" 
                          onClick={() => removeSlot(slot)}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="p-4">
                    {s && d ? (
                      <>
                        {/* Pokemon Info */}
                        <div className="flex flex-col items-center mb-4">
                          <div className="w-32 h-32 rounded-lg bg-gray-100 border-2 border-gray-300 flex items-center justify-center mb-3">
                            {d.sprite ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img 
                                src={d.sprite} 
                                alt={d.name} 
                                className="w-28 h-28 pixelated hover:scale-110 transition-transform" 
                              />
                            ) : (
                              <span className="text-4xl text-gray-400">?</span>
                            )}
                          </div>
                          
                          <h3 className="text-xl font-bold text-pokemon capitalize text-center">
                            {d.name}
                          </h3>
                          <p className="text-xs text-gray-600 pokemon-text">#{String(d.id).padStart(3, "0")}</p>
                          
                          {/* Types */}
                          {d.types?.length ? (
                            <div className="flex flex-wrap gap-2 mt-3 justify-center">
                              {d.types.map(t => (
                                <TypeBadge key={t} kind={t as BadgeKey} width={90} />
                              ))}
                            </div>
                          ) : null}
                        </div>

                        {/* Toggle Stats Button */}
                        <button
                          className="pokedex-button w-full text-sm"
                          onClick={() => {
                            setExpandedSlot(expanded ? null : slot);
                            void loadDetailFor(slot, s.pokemonName);
                          }}
                        >
                          {expanded ? "Masquer stats" : "Afficher stats"}
                        </button>

                        {/* Stats Section (Expanded) */}
                        {expanded && (
                          <div className="mt-4 pokedex-screen p-3 space-y-2">
                            <h4 className="text-xs font-bold pokemon-text mb-2">STATISTIQUES</h4>
                            {d.stats.map(st => <StatRow key={st.name} s={st} />)}
                          </div>
                        )}

                        {/* Evolution Display */}
                        {expanded && d.evolutionChain && d.evolutionChain.length > 0 && (
                          <div className="mt-4">
                            <EvolutionDisplay
                              currentStage={d.evolutionStage ?? null}
                              evolutionChain={d.evolutionChain}
                              currentPokemonId={d.id}
                            />
                          </div>
                        )}
                      </>
                    ) : s && !d ? (
                      <div className="py-8 text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-blue-600 mx-auto"></div>
                        <p className="text-sm text-gray-600 mt-3">Chargement...</p>
                      </div>
                    ) : (
                      <div className="py-12 text-center">
                        <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gray-200 flex items-center justify-center">
                          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-red-500 to-red-700 opacity-30"></div>
                        </div>
                        <p className="text-gray-500 text-sm pokemon-text">SLOT VIDE</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Strategic Analysis */}
        {sortedTeam.length > 0 && Object.keys(details).length > 0 && (
          <div className="pokedex-panel max-w-6xl mx-auto">
            <div className="pokedex-panel-content p-6">
              <h2 className="text-pokemon text-2xl mb-4">🎯 ANALYSE STRATÉGIQUE</h2>
              <TeamStrategyBuilder 
                team={sortedTeam
                  .map(s => details[s.slot])
                  .filter((d): d is PokeLite => d !== null && d !== undefined)
                }
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
