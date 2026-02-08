"use client";

import React, { useEffect, useState } from "react";
import PokedexScreen from "./pokedex/PokedexScreen";
import PokedexSelector from "./PokedexSelector";
import {
  type PokemonSpeciesData,
  type PokedexPreference,
  normalizeFlavorText,
  selectBestFlavorText,
  getLocalizedGenus,
} from "@/lib/pokedexFlavorText";
import { getVersionDisplayName } from "@/lib/pokedexMetadata";

interface PokedexFlavorTextProps {
  pokemonId: number;
  pokemonName: string;
}

export default function PokedexFlavorText({
  pokemonId,
  pokemonName,
}: PokedexFlavorTextProps) {
  const [species, setSpecies] = useState<PokemonSpeciesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [preference, setPreference] = useState<PokedexPreference>({
    lang: "fr",
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [versionGroups, setVersionGroups] = useState<any[]>([]);

  // Load species data and user preferences on mount
  useEffect(() => {
    setLoading(true);

    // Load preference from localStorage
    const storedPref = localStorage.getItem("pokedexDisplayPref");
    if (storedPref) {
      try {
        const parsed = JSON.parse(storedPref);
        // Validate that preference has required fields
        if (parsed.generation && parsed.version) {
          setPreference(parsed);
        }
      } catch (e) {
        console.error("Failed to parse stored preference:", e);
      }
    }

    // Fetch species data from API
    fetch(`/api/pokemon-species/${pokemonId}`)
      .then((res) => res.json())
      .then((data) => {
        setSpecies(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch species:", err);
        setError(true);
        setLoading(false);
      });

    // Load version groups for selection logic
    fetch("/api/pokedex-metadata")
      .then((res) => res.json())
      .then((data) => {
        setVersionGroups(data.versionGroups || []);
      })
      .catch((err) => {
        console.error("Failed to load metadata:", err);
      });
  }, [pokemonId]);

  const handleApplyPreference = (newPref: PokedexPreference) => {
    setPreference(newPref);
    // Save to localStorage
    localStorage.setItem("pokedexDisplayPref", JSON.stringify(newPref));
    setModalOpen(false);
  };

  if (loading) {
    return (
      <div className="w-full flex justify-center items-center min-h-[120px]">
        <div className="animate-pulse text-gray-400 text-sm">
          Chargement de la description...
        </div>
      </div>
    );
  }

  if (error || !species) {
    return (
      <PokedexScreen>
        <span className="text-center block">Description indisponible</span>
      </PokedexScreen>
    );
  }

  // Check if preference is complete
  const isPreferenceComplete = preference.generation && preference.version;

  // Select the best flavor text based on preferences
  const bestEntry = isPreferenceComplete
    ? selectBestFlavorText(
        species.flavor_text_entries,
        preference,
        versionGroups
      )
    : null;

  const displayText = bestEntry
    ? normalizeFlavorText(bestEntry.flavor_text)
    : isPreferenceComplete
    ? "Aucune description disponible pour cette version."
    : "⚠️ Veuillez sélectionner une génération et un jeu.";

  const sourceLabel = bestEntry
    ? getVersionDisplayName(bestEntry.version.name)
    : undefined;

  const isEnglish = bestEntry?.language.name === "en" && preference.lang === "fr";
  const genus = getLocalizedGenus(species, preference.lang);

  return (
    <div className="w-full">
      {/* Genus (Category) */}
      {genus && (
        <div className="mb-3 text-center">
          <span className="inline-block px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg text-sm font-semibold">
            {genus}
          </span>
        </div>
      )}

      {/* Pokédex Screen with Description */}
      <PokedexScreen
        sourceLabel={sourceLabel}
        onChangeSource={() => setModalOpen(true)}
        showChangeSource={true}
        scrollHint={true}
      >
        <span className="block w-full whitespace-pre-line">
          {displayText}
          {isEnglish && (
            <span className="ml-2 px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded align-middle">
              EN
            </span>
          )}
        </span>
      </PokedexScreen>

      {/* Selector Modal */}
      {modalOpen && (
        <PokedexSelector
          species={species}
          currentPreference={preference}
          onApply={handleApplyPreference}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  );
}
