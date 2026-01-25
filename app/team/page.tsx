"use client";
import { BACKGROUNDS } from "@/lib/backgrounds";

import { useEffect, useMemo, useState } from "react";
import { typeStyle } from "@/lib/typeStyle";

type TeamSlot = { slot: number; pokemonId: number; pokemonName: string };
type Me = { username: string } | null;

type PokeLite = {
  id: number;
  name: string;
  sprite: string | null;
  types: string[];
  stats: { name: string; value: number }[];
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
      <div className="card p-6">
        <h1 className="text-xl font-semibold">Mon équipe</h1>
        <p className="text-sm text-gray-600 mt-1">Connecté : <b>{me.username}</b></p>

        <div className="mt-4 flex gap-2">
          <input
            className="input"
            value={addName}
            onChange={(e) => setAddName(e.target.value)}
            placeholder="Ajouter un Pokémon (nom ex: pikachu)"
          />
          <button className="btn btn-primary" onClick={addPokemon}>Ajouter</button>
        </div>

        {error ? <div className="text-sm text-red-600 mt-2">{error}</div> : null}
      </div>

      <div className="card p-6">
        <h2 className="text-lg font-semibold">Slots (max 6)</h2>

        <div className="mt-3 space-y-3">
  {[1, 2, 3, 4, 5, 6].map(slot => {
    const s = sortedTeam.find(x => x.slot === slot);
    const d = s ? details[slot] : null;
    const expanded = expandedSlot === slot;

    return (
      <div key={slot} className="border rounded-xl p-4 bg-gray-50">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-14 h-14 rounded-xl bg-white border flex items-center justify-center overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {d?.sprite ? <img src={d.sprite} alt={d.name} className="w-14 h-14" /> : <span className="text-xs text-gray-500">—</span>}
            </div>
            <div className="min-w-0">
              <div className="text-sm text-gray-600">Slot {slot}</div>
              <div className="font-semibold capitalize truncate">{s ? s.pokemonName : "— vide —"}</div>

              {d?.types?.length ? (
                <div className="flex flex-wrap gap-2 mt-1">
                  {d.types.map(t => {
                    const ts = typeStyle(t);
                    return (
                      <span key={t} className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm border ${ts.badgeClass}`}>
                        <span aria-hidden>{ts.icon}</span>
                        <span className="capitalize">{t}</span>
                      </span>
                    );
                  })}
                </div>
              ) : null}
            </div>
          </div>

          {s ? (
            <div className="flex items-center gap-2 shrink-0">
              <button
                className="btn"
                onClick={() => {
                  setExpandedSlot(expanded ? null : slot);
                  void loadDetailFor(slot, s.pokemonName);
                }}
              >
                {expanded ? "Masquer stats" : "Voir stats"}
              </button>
              <button className="btn" onClick={() => removeSlot(slot)}>Retirer</button>
            </div>
          ) : null}
        </div>

        {s && expanded ? (
          <div className="mt-3 border-t pt-3">
            {d ? (
              <div className="space-y-1">
                {d.stats.map(st => <StatRow key={st.name} s={st} />)}
              </div>
            ) : (
              <div className="text-sm text-gray-600">Chargement des stats...</div>
            )}
          </div>
        ) : null}
      </div>
    );
  })}
        </div>

        <p className="text-xs text-gray-500 mt-3">Stockage local dans <code>data/teams.json</code>.</p>
      </div>
    </div>
  );
}