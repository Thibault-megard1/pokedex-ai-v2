"use client";

import { useEffect, useState } from "react";
import PokemonCard from "@/components/PokemonCard";
import type { PokemonBasic } from "@/lib/types";

type Favorite = {
  userId: string;
  pokemonId: number;
  pokemonName: string;
  addedAt: string;
};

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [pokemon, setPokemon] = useState<PokemonBasic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadFavorites();
  }, []);

  async function loadFavorites() {
    try {
      const res = await fetch("/api/favorites");
      if (!res.ok) {
        setError("Non connecté");
        setLoading(false);
        return;
      }

      const data = await res.json();
      setFavorites(data.favorites);

      // Charger les détails de chaque Pokémon
      const pokemonData: PokemonBasic[] = [];
      for (const fav of data.favorites) {
        try {
          const pRes = await fetch(`/api/autocomplete?q=${fav.pokemonName}`);
          const pData = await pRes.json();
          if (pData.suggestions && pData.suggestions.length > 0) {
            pokemonData.push(pData.suggestions[0]);
          }
        } catch (err) {
          console.error(`Error loading pokemon ${fav.pokemonName}:`, err);
        }
      }

      setPokemon(pokemonData);
      setLoading(false);
    } catch (err) {
      setError("Erreur lors du chargement des favoris");
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="page-content mt-24">
        <div className="card p-8 text-center">
          <p className="text-gray-600">Chargement des favoris...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-content mt-24">
        <div className="card p-8 text-center">
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-content mt-24 space-y-4">
      <div className="card p-6">
        <h1 className="text-2xl font-bold mb-2">⭐ Mes Pokémon Favoris</h1>
        <p className="text-gray-600">{favorites.length} Pokémon dans vos favoris</p>
      </div>

      {pokemon.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-gray-500">Aucun favori pour le moment</p>
          <p className="text-sm text-gray-400 mt-2">
            Cliquez sur l'étoile ☆ sur la page d'un Pokémon pour l'ajouter à vos favoris
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {pokemon.map((p) => (
            <PokemonCard key={p.id} p={p} />
          ))}
        </div>
      )}
    </div>
  );
}
