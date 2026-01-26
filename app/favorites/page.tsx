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
      <div className="page-bg min-h-screen" style={{ backgroundImage: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" }}>
        <div className="page-content py-24 px-4">
          <div className="pokedex-panel max-w-2xl mx-auto">
            <div className="pokedex-panel-content p-8 text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-300 border-t-yellow-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Chargement des favoris...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-bg min-h-screen" style={{ backgroundImage: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" }}>
        <div className="page-content py-24 px-4">
          <div className="pokedex-panel max-w-2xl mx-auto">
            <div className="pokedex-panel-content p-8 text-center">
              <div className="text-6xl mb-4">🔒</div>
              <h2 className="text-2xl font-bold text-pokemon mb-2">ACCÈS RESTREINT</h2>
              <p className="text-red-600 mb-6">{error}</p>
              <a className="pokedex-button-yellow" href="/auth/login">
                Se connecter
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-bg min-h-screen" style={{ backgroundImage: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" }}>
      <div className="page-content py-24 px-4">
        
        {/* Header */}
        <div className="pokedex-panel max-w-6xl mx-auto mb-6 pokedex-open-animation">
          <div className="pokedex-panel-content p-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h1 className="text-3xl font-bold text-pokemon mb-2">⭐ MES FAVORIS</h1>
                <p className="text-sm text-gray-600">
                  {favorites.length} Pokémon dans votre collection
                </p>
              </div>
              
              <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg px-4 py-2">
                <div className="text-xs text-yellow-600 font-bold pokemon-text">TOTAL</div>
                <div className="text-2xl font-bold text-yellow-900">{favorites.length}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Empty State */}
        {pokemon.length === 0 ? (
          <div className="pokedex-panel max-w-2xl mx-auto">
            <div className="pokedex-panel-content p-12 text-center">
              <div className="text-6xl mb-4">⭐</div>
              <h2 className="text-2xl font-bold text-pokemon mb-2">AUCUN FAVORI</h2>
              <p className="text-gray-600 mb-6">
                Cliquez sur l'étoile ☆ sur la page d'un Pokémon pour l'ajouter à vos favoris
              </p>
              <a className="pokedex-button-yellow" href="/pokemon">
                Explorer le Pokédex
              </a>
            </div>
          </div>
        ) : (
          /* Grid */
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {pokemon.map((p) => (
                <PokemonCard key={p.id} p={p} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
