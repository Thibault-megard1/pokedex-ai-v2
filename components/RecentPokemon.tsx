"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatPokemonName } from "@/lib/pokemonNames.utils";

type RecentPokemon = {
  id: number;
  name: string;
  sprite: string | null;
  timestamp: number;
};

const MAX_RECENT = 10;
const STORAGE_KEY = "pokemon-history";

export function addToHistory(pokemon: { id: number; name: string; sprite: string | null }) {
  if (typeof window === "undefined") return;
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    let history: RecentPokemon[] = stored ? JSON.parse(stored) : [];
    
    // Retirer l'existant si déjà présent
    history = history.filter(p => p.id !== pokemon.id);
    
    // Ajouter en tête
    history.unshift({
      ...pokemon,
      timestamp: Date.now()
    });
    
    // Limiter à MAX_RECENT
    history = history.slice(0, MAX_RECENT);
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  } catch (err) {
    console.error("Error saving to history:", err);
  }
}

export default function RecentPokemon() {
  const [history, setHistory] = useState<RecentPokemon[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setHistory(JSON.parse(stored));
      }
    } catch (err) {
      console.error("Error loading history:", err);
    }
  }, []);

  if (history.length === 0) return null;

  // Fonction pour supprimer l'historique
  const handleClearHistory = () => {
    localStorage.removeItem("recentPokemon");
    setHistory([]);
  };

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">🕒 Récemment consultés</h3>
        {history.length > 0 && (
          <button
            onClick={handleClearHistory}
            className="text-xs text-red-500 hover:underline focus:outline-none ml-2"
            title="Effacer l'historique"
          >
            Vider
          </button>
        )}
      </div>
      <div className="flex gap-2 overflow-x-auto pb-2">
        {history.slice(0, 8).map((p) => {
          const displayName = formatPokemonName(p.name).primary;
          return (
            <Link
              key={p.id}
              href={`/pokemon/${p.name}`}
              className="flex-shrink-0 w-20 flex flex-col items-center p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
            >
              {p.sprite ? (
                <img src={p.sprite} alt={displayName} className="w-16 h-16 pixelated" />
              ) : (
                <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded" />
              )}
              <span className="text-xs text-gray-700 dark:text-gray-300 capitalize truncate w-full text-center mt-1">
                {displayName}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
