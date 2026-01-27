"use client";

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { decodeTeam, validateTeam, type SharedTeam } from '@/lib/teamSharing';

interface Pokemon {
  id: number;
  name: string;
  sprite: string | null;
  types: string[];
  evolutionLevel?: number;
}

export default function SharedTeamPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [team, setTeam] = useState<SharedTeam | null>(null);
  const [pokemon, setPokemon] = useState<Pokemon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const data = searchParams.get('data');
    
    if (!data) {
      setError('Aucune donnée d\'équipe trouvée dans l\'URL');
      setLoading(false);
      return;
    }

    // Decode team
    const decodedTeam = decodeTeam(data);
    const validation = validateTeam(decodedTeam);
    
    if (!validation.valid) {
      setError(`Équipe invalide: ${validation.errors.join(', ')}`);
      setLoading(false);
      return;
    }

    setTeam(decodedTeam!);
    
    // Fetch Pokémon details
    fetchPokemonDetails(decodedTeam!);
  }, [searchParams]);

  async function fetchPokemonDetails(team: SharedTeam) {
    try {
      const promises = team.pokemon.map(async (p) => {
        const res = await fetch(`/api/pokemon/${p.id}`);
        const data = await res.json();
        return {
          id: data.id,
          name: data.name,
          sprite: data.sprite,
          types: data.types,
          evolutionLevel: p.evolutionLevel
        };
      });

      const pokemonData = await Promise.all(promises);
      setPokemon(pokemonData);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch Pokémon:', err);
      setError('Erreur lors du chargement des Pokémon');
      setLoading(false);
    }
  }

  function handleImport() {
    if (!team) return;
    
    try {
      // Get existing teams
      const stored = localStorage.getItem('teams');
      const teams = stored ? JSON.parse(stored) : [];
      
      // Add imported team
      teams.push({
        name: `${team.name} (Importée)`,
        pokemon: pokemon.map(p => ({
          slot: pokemon.indexOf(p) + 1,
          pokemonId: p.id,
          pokemonName: p.name,
          evolutionLevel: p.evolutionLevel || 0
        })),
        createdAt: Date.now()
      });
      
      localStorage.setItem('teams', JSON.stringify(teams));
      
      // Redirect to team page
      router.push('/team?imported=true');
    } catch (err) {
      console.error('Failed to import team:', err);
      setError('Erreur lors de l\'importation de l\'équipe');
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement de l'équipe...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <div className="text-5xl mb-4">❌</div>
            <h2 className="text-2xl font-bold text-red-800 mb-2">Erreur</h2>
            <p className="text-red-700 mb-6">{error}</p>
            <button
              onClick={() => router.push('/team')}
              className="btn bg-red-600 hover:bg-red-700 text-white"
            >
              Retour au Team Builder
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">🎁 Équipe Partagée</h1>
          <p className="text-gray-600">Une équipe a été partagée avec vous !</p>
        </div>

        {/* Team Info */}
        {team && (
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-1">{team.name}</h2>
                <p className="text-blue-100">
                  {pokemon.length} Pokémon • {team.evolutionPoints || 0} points d'évolution
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-blue-100">Partagée le</p>
                <p className="font-semibold">
                  {team.createdAt ? new Date(team.createdAt).toLocaleDateString('fr-FR') : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Pokémon Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          {pokemon.map((p, idx) => (
            <div key={idx} className="card p-4 hover:shadow-lg transition-shadow">
              {p.sprite && (
                <img 
                  src={p.sprite} 
                  alt={p.name}
                  className="w-24 h-24 mx-auto mb-2"
                />
              )}
              <h3 className="font-bold text-center capitalize mb-2">{p.name}</h3>
              <div className="flex flex-wrap gap-1 justify-center mb-2">
                {p.types.map(type => (
                  <span 
                    key={type}
                    className="text-xs px-2 py-1 rounded bg-gray-200 text-gray-800"
                  >
                    {type}
                  </span>
                ))}
              </div>
              {p.evolutionLevel && p.evolutionLevel > 0 && (
                <div className="text-center text-sm text-blue-600">
                  ⚡ Évolution niveau {p.evolutionLevel}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-4 justify-center">
          <button
            onClick={handleImport}
            className="btn bg-green-600 hover:bg-green-700 text-white"
          >
            ✅ Importer cette équipe
          </button>
          <button
            onClick={() => router.push('/team')}
            className="btn bg-gray-600 hover:bg-gray-700 text-white"
          >
            ← Retour
          </button>
        </div>

        {/* Info Box */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>💡 Info :</strong> L'importation ajoutera cette équipe à votre collection locale. 
            Vous pourrez la modifier et l'utiliser dans vos combats.
          </p>
        </div>
      </div>
    </div>
  );
}
