"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

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

  return (
    <div className="card p-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">🕒 Récemment consultés</h3>
      <div className="flex gap-2 overflow-x-auto pb-2">
        {history.slice(0, 8).map((p) => (
          <Link
            key={p.id}
            href={`/pokemon/${p.name}`}
            className="flex-shrink-0 w-20 flex flex-col items-center p-2 rounded-lg hover:bg-gray-100 transition"
          >
            {p.sprite ? (
              <img src={p.sprite} alt={p.name} className="w-16 h-16 pixelated" />
            ) : (
              <div className="w-16 h-16 bg-gray-200 rounded" />
            )}
            <span className="text-xs capitalize truncate w-full text-center mt-1">
              {p.name}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
