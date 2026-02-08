"use client";

import React, { useState, useEffect } from "react";
import {
  type FlavorTextEntry,
  type PokemonSpeciesData,
  type PokedexPreference,
  normalizeFlavorText,
  deduplicateFlavorTexts,
  selectBestFlavorText,
} from "@/lib/pokedexFlavorText";
import { getVersionDisplayName } from "@/lib/pokedexMetadata";

interface PokedexSelectorProps {
  species: PokemonSpeciesData;
  currentPreference: PokedexPreference;
  onApply: (preference: PokedexPreference) => void;
  onClose: () => void;
}

interface GenerationInfo {
  id: number;
  name: string;
  region: string;
  versionGroups: string[];
}

interface VersionGroupInfo {
  name: string;
  generation: string;
  versions: Array<{ name: string }>;
  order: number;
}

export default function PokedexSelector({
  species,
  currentPreference,
  onApply,
  onClose,
}: PokedexSelectorProps) {
  const [generations, setGenerations] = useState<GenerationInfo[]>([]);
  const [versionGroups, setVersionGroups] = useState<VersionGroupInfo[]>([]);
  const [selectedGen, setSelectedGen] = useState<number | null>(
    currentPreference.generation || null
  );
  const [selectedVersion, setSelectedVersion] = useState<string | null>(
    currentPreference.version || null
  );
  const [selectedLang, setSelectedLang] = useState<"fr" | "en">(
    currentPreference.lang || "fr"
  );
  const [loading, setLoading] = useState(true);

  // Load metadata on mount
  useEffect(() => {
    fetch("/api/pokedex-metadata")
      .then((res) => res.json())
      .then((data) => {
        setGenerations(data.generations || []);
        setVersionGroups(data.versionGroups || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load metadata:", err);
        setLoading(false);
      });
  }, []);

  // Add ESC key handler for accessibility
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Get versions for selected generation
  const availableVersions = React.useMemo(() => {
    if (!selectedGen) return [];
    
    const gen = generations.find((g) => g.id === selectedGen);
    if (!gen) return [];

    const versions: string[] = [];
    for (const vgName of gen.versionGroups) {
      const vg = versionGroups.find((g) => g.name === vgName);
      if (vg) {
        versions.push(...vg.versions.map((v) => v.name));
      }
    }
    return versions;
  }, [selectedGen, generations, versionGroups]);

  // Get flavor texts for current language
  const flavorTexts = React.useMemo(() => {
    let entries = species.flavor_text_entries.filter(
      (e) => e.language.name === selectedLang
    );
    if (entries.length === 0 && selectedLang === "fr") {
      entries = species.flavor_text_entries.filter(
        (e) => e.language.name === "en"
      );
    }
    return deduplicateFlavorTexts(entries);
  }, [species, selectedLang]);

  // Get preview text based on current selection
  const previewEntry = React.useMemo(() => {
    return selectBestFlavorText(
      flavorTexts,
      {
        lang: selectedLang,
        generation: selectedGen || undefined,
        version: selectedVersion || undefined,
      },
      versionGroups
    );
  }, [flavorTexts, selectedLang, selectedGen, selectedVersion, versionGroups]);

  const handleApply = () => {
    // Require both generation and version
    if (!selectedGen || !selectedVersion) {
      alert("Veuillez sélectionner une génération ET une version.");
      return;
    }
    onApply({
      lang: selectedLang,
      generation: selectedGen,
      version: selectedVersion,
    });
  };

  const isSelectionComplete = selectedGen !== null && selectedVersion !== null;

  const handleSetDefault = () => {
    // Require both generation and version
    if (!selectedGen || !selectedVersion) {
      alert("Veuillez sélectionner une génération ET une version.");
      return;
    }
    const preference: PokedexPreference = {
      lang: selectedLang,
      generation: selectedGen,
      version: selectedVersion,
    };
    localStorage.setItem("pokedexDisplayPref", JSON.stringify(preference));
    onApply(preference);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-2xl w-full mx-4 shadow-2xl">
          <div className="text-center text-gray-500">Chargement...</div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-2xl w-full mx-4 shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">
          Choisir la source Pokédex
        </h2>

        {/* Language selector */}
        <div className="mb-4">
          <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
            Langue :
          </label>
          <div className="flex gap-2">
            <button
              className={`px-4 py-2 rounded-lg border-2 transition ${
                selectedLang === "fr"
                  ? "bg-blue-500 text-white border-blue-500"
                  : "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600"
              }`}
              onClick={() => setSelectedLang("fr")}
            >
              Français
            </button>
            <button
              className={`px-4 py-2 rounded-lg border-2 transition ${
                selectedLang === "en"
                  ? "bg-blue-500 text-white border-blue-500"
                  : "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600"
              }`}
              onClick={() => setSelectedLang("en")}
            >
              English
            </button>
          </div>
        </div>

        {/* Generation selector */}
        <div className="mb-4">
          <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
            Génération <span className="text-red-500">*</span> :
          </label>
          <select
            className="w-full px-3 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            value={selectedGen || ""}
            onChange={(e) => {
              const val = e.target.value;
              setSelectedGen(val ? Number(val) : null);
              setSelectedVersion(null); // Reset version when generation changes
            }}
          >
            <option value="" disabled>
              -- Sélectionnez une génération --
            </option>
            {generations.map((gen) => (
              <option key={gen.id} value={gen.id}>
                Génération {gen.id} - {gen.region}
              </option>
            ))}
          </select>
        </div>

        {/* Version selector */}
        {selectedGen && (
          <div className="mb-4">
            <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
              Jeu / Version <span className="text-red-500">*</span> :
            </label>
            <select
              className="w-full px-3 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              value={selectedVersion || ""}
              onChange={(e) => setSelectedVersion(e.target.value || null)}
            >
              <option value="" disabled>
                -- Sélectionnez une version --
              </option>
              {availableVersions.map((version) => (
                <option key={version} value={version}>
                  {getVersionDisplayName(version)}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Preview */}
        <div className="mb-4">
          <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
            Aperçu :
          </label>
          <div className="bg-gray-100 dark:bg-gray-900 border-2 border-gray-300 dark:border-gray-600 rounded-lg p-4 max-h-48 overflow-y-auto">
            {previewEntry ? (
              <div>
                <p className="text-gray-900 dark:text-gray-100 mb-2">
                  {normalizeFlavorText(previewEntry.flavor_text)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Source : {getVersionDisplayName(previewEntry.version.name)}
                </p>
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400">
                Aucune description disponible
              </p>
            )}
          </div>
        </div>

        {/* Available entries count */}
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          {flavorTexts.length} description(s) disponible(s) en {selectedLang === "fr" ? "français" : "anglais"}
        </p>

        {/* Validation message */}
        {!isSelectionComplete && (
          <p className="text-sm text-red-500 dark:text-red-400 mb-2">
            ⚠️ Vous devez sélectionner une génération ET une version.
          </p>
        )}

        {/* Actions */}
        <div className="flex gap-2 justify-end">
          <button
            className="px-4 py-2 rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition"
            onClick={onClose}
          >
            Annuler
          </button>
          <button
            className="px-4 py-2 rounded-lg border-2 border-yellow-500 bg-yellow-500 text-white hover:bg-yellow-600 hover:border-yellow-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleSetDefault}
            disabled={!isSelectionComplete}
          >
            Définir par défaut
          </button>
          <button
            className="px-4 py-2 rounded-lg border-2 border-blue-600 bg-blue-600 text-white hover:bg-blue-700 hover:border-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleApply}
            disabled={!isSelectionComplete}
          >
            Appliquer
          </button>
        </div>
      </div>
    </div>
  );
}
