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
  return (
    <div className="flex items-center gap-2 text-sm">
      <div className="w-28 text-gray-700 capitalize">{s.name}</div>
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden border">
        <div className="h-2 bg-gray-800" style={{ width: `${Math.min(100, s.value)}%` }} />
      </div>
      <div className="w-8 text-right">{s.value}</div>
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
      <div className="card p-6">
        <h1 className="text-xl font-semibold">Mon équipe</h1>
        <p className="text-gray-600 mt-2">Tu dois être connecté pour gérer ton équipe.</p>
        <div className="mt-4 flex gap-2">
          <a className="btn btn-primary" href="/auth/login">Connexion</a>
          <a className="btn" href="/auth/register">Inscription</a>
        </div>
      </div>
  );
  }

  return (
    <div className="space-y-4">
      <div className="card p-6 mt-24">
        <h1 className="text-xl font-semibold">Mon équipe</h1>
        <p className="text-sm text-gray-600 mt-1">Connecté : <b>{me.username}</b></p>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ajouter un Pokémon à l'équipe
          </label>
          <div className="flex gap-2">
            <div className="flex-1">
              <PokemonAutocomplete
                id="team-add"
                value={addName}
                onChange={setAddName}
                placeholder="Rechercher un Pokémon (ex: pikachu)"
              />
            </div>
            <button className="btn btn-primary" onClick={addPokemon}>Ajouter</button>
          </div>
        </div>

        {error ? <div className="text-sm text-red-600 mt-2">{error}</div> : null}
      </div>

      <div className="card p-6">
        <h2 className="text-lg font-semibold">Slots (max 6)</h2>

        <div className="mt-3 space-y-3">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[1, 2, 3, 4, 5, 6].map(slot => {
            const s = sortedTeam.find(x => x.slot === slot);
            const d = s ? details[slot] : null;
            const expanded = expandedSlot === slot;

            return (
              <div key={slot} className="border-2 rounded-xl p-5 bg-gradient-to-br from-gray-50 to-white shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 min-w-0 flex-1">
                    {/* Sprite plus grand et plus visible */}
                    <div className="w-24 h-24 rounded-xl bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-gray-200 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                      {d?.sprite ? (
                        <img 
                          src={d.sprite} 
                          alt={d.name} 
                          className="w-20 h-20 pixelated hover:scale-110 transition-transform" 
                        />
                      ) : (
                        <span className="text-2xl text-gray-400">?</span>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="text-xs text-gray-500 font-medium uppercase tracking-wide">
                        Slot {slot}
                      </div>
                      <div className="text-xl font-bold capitalize truncate mt-1 text-gray-800">
                        {s ? s.pokemonName : "— vide —"}
                      </div>
                      
                      {d?.id && (
                        <div className="text-sm text-gray-600 mt-0.5">
                          #{d.id}
                        </div>
                      )}

                      {d?.types?.length ? (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {d.types.map(t => (
                            <TypeBadge key={t} kind={t as BadgeKey} width={85} />
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </div>

                  {s ? (
                    <div className="flex flex-col gap-2 shrink-0">
                      <button
                        className="btn text-sm whitespace-nowrap"
                        onClick={() => {
                          setExpandedSlot(expanded ? null : slot);
                          void loadDetailFor(slot, s.pokemonName);
                        }}
                      >
                        {expanded ? "Masquer" : "Voir stats"}
                      </button>
                      <button 
                        className="btn text-sm bg-red-50 hover:bg-red-100 border-red-200 text-red-700 whitespace-nowrap" 
                        onClick={() => removeSlot(slot)}
                      >
                        Retirer
                      </button>
                    </div>
                  ) : null}
                </div>

                {s && expanded && d ? (
                  <div className="mt-4 border-t pt-4 space-y-4">
                    {/* Section Stats */}
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-3">Statistiques</h3>
                      <div className="space-y-2">
                        {d.stats.map(st => <StatRow key={st.name} s={st} />)}
                      </div>
                    </div>

                    {/* Section Évolutions */}
                    {d.evolutionChain && d.evolutionChain.length > 0 && (
                      <EvolutionDisplay
                        currentStage={d.evolutionStage ?? null}
                        evolutionChain={d.evolutionChain}
                        currentPokemonId={d.id}
                      />
                    )}
                  </div>
                ) : s && expanded && !d ? (
                  <div className="mt-4 border-t pt-4">
                    <div className="text-sm text-gray-600 flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-blue-600"></div>
                      Chargement des détails...
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>

        </div>
      </div>

      {/* Analyse Stratégique */}
      {sortedTeam.length > 0 && Object.keys(details).length > 0 && (
        <div className="card p-6">
          <h2 className="text-lg font-semibold mb-4">🎯 Analyse Stratégique</h2>
          <TeamStrategyBuilder 
            team={sortedTeam
              .map(s => details[s.slot])
              .filter((d): d is PokeLite => d !== null && d !== undefined)
            }
          />
        </div>
      )}
    </div>
  );
}