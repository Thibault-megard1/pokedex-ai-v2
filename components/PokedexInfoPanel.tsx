"use client";

import React, { useEffect, useState } from "react";
import { getLocalizedPokemonName, type PokemonSpeciesData } from "@/lib/pokedexFlavorText";

interface PokedexInfoPanelProps {
  pokemonId: number;
}

export default function PokedexInfoPanel({ pokemonId }: PokedexInfoPanelProps) {
  const [species, setSpecies] = useState<PokemonSpeciesData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/pokemon-species/${pokemonId}`)
      .then((res) => res.json())
      .then((data) => {
        setSpecies(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch species:", err);
        setLoading(false);
      });
  }, [pokemonId]);

  if (loading || !species) return null;

  const frenchName = getLocalizedPokemonName(species, "fr");
  const habitat = species.habitat?.name || null;
  const generation = species.generation?.name || null;

  return (
    <div className="w-full mb-4">
      <div className="grid grid-cols-2 gap-4 text-sm">
        {frenchName && frenchName !== species.name && (
          <div className="col-span-2">
            <span className="font-semibold text-gray-600 dark:text-gray-400">
              Nom français :
            </span>
            <span className="ml-2 text-gray-900 dark:text-gray-100">
              {frenchName}
            </span>
          </div>
        )}
        
        {habitat && (
          <div>
            <span className="font-semibold text-gray-600 dark:text-gray-400">
              Habitat :
            </span>
            <span className="ml-2 text-gray-900 dark:text-gray-100 capitalize">
              {habitat}
            </span>
          </div>
        )}

        {generation && (
          <div>
            <span className="font-semibold text-gray-600 dark:text-gray-400">
              Génération :
            </span>
            <span className="ml-2 text-gray-900 dark:text-gray-100 capitalize">
              {generation.replace("generation-", "Gen ")}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
