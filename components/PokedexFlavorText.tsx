"use client";
import React, { useEffect, useState } from "react";
import { getPokemonSpecies, FlavorTextEntry, PokemonSpeciesData } from "@/lib/pokemonSpeciesCache";
import PokedexScreen from "./pokedex/PokedexScreen";

const GENERATIONS = [
  { id: 1, name: "Génération 1", versionGroups: ["red-blue", "yellow", "gold-silver", "crystal"] },
  { id: 2, name: "Génération 2", versionGroups: ["gold-silver", "crystal"] },
  { id: 3, name: "Génération 3", versionGroups: ["ruby-sapphire", "emerald", "firered-leafgreen"] },
  { id: 4, name: "Génération 4", versionGroups: ["diamond-pearl", "platinum", "heartgold-soulsilver"] },
  { id: 5, name: "Génération 5", versionGroups: ["black-white", "black-2-white-2"] },
  { id: 6, name: "Génération 6", versionGroups: ["x-y", "omega-ruby-alpha-sapphire"] },
  { id: 7, name: "Génération 7", versionGroups: ["sun-moon", "ultra-sun-ultra-moon", "lets-go-pikachu-lets-go-eevee"] },
  { id: 8, name: "Génération 8", versionGroups: ["sword-shield", "brilliant-diamond-shining-pearl", "legends-arceus"] },
  { id: 9, name: "Génération 9", versionGroups: ["scarlet-violet"] },
];

function normalizeText(text: string) {
  return text.replace(/[\n\f\r]+/g, " ").replace(/\s+/g, " ").trim();
}

function dedupeEntries(entries: FlavorTextEntry[]) {
  const seen = new Set();
  return entries.filter(e => {
    const norm = normalizeText(e.flavor_text);
    if (seen.has(norm)) return false;
    seen.add(norm);
    return true;
  });
}

function getVersionGroup(version: string): string | null {
  // Map version to version_group (simplified)
  if (version.includes("red") || version.includes("blue") || version.includes("yellow")) return "red-blue";
  if (version.includes("gold") || version.includes("silver") || version.includes("crystal")) return "gold-silver";
  if (version.includes("ruby") || version.includes("sapphire") || version.includes("emerald")) return "ruby-sapphire";
  if (version.includes("firered") || version.includes("leafgreen")) return "firered-leafgreen";
  if (version.includes("diamond") || version.includes("pearl") || version.includes("platinum")) return "diamond-pearl";
  if (version.includes("heartgold") || version.includes("soulsilver")) return "heartgold-soulsilver";
  if (version.includes("black") && !version.includes("2")) return "black-white";
  if (version.includes("black-2") || version.includes("white-2")) return "black-2-white-2";
  if (version.includes("x") || version.includes("y")) return "x-y";
  if (version.includes("omega") || version.includes("alpha")) return "omega-ruby-alpha-sapphire";
  if (version.includes("sun") || version.includes("moon")) return "sun-moon";
  if (version.includes("ultra")) return "ultra-sun-ultra-moon";
  if (version.includes("lets-go")) return "lets-go-pikachu-lets-go-eevee";
  if (version.includes("sword") || version.includes("shield")) return "sword-shield";
  if (version.includes("brilliant") || version.includes("shining")) return "brilliant-diamond-shining-pearl";
  if (version.includes("arceus")) return "legends-arceus";
  if (version.includes("scarlet") || version.includes("violet")) return "scarlet-violet";
  return null;
}

function getBestEntry(entries: FlavorTextEntry[], pref: any) {
  // Try to match user preference
  if (pref?.mode === "version_group" && pref.value) {
    const found = entries.find(e => getVersionGroup(e.version.name) === pref.value);
    if (found) return found;
  }
  if (pref?.mode === "generation" && pref.value) {
    const gen = GENERATIONS.find(g => g.id === Number(pref.value));
    if (gen) {
      const found = entries.find(e => gen.versionGroups.includes(getVersionGroup(e.version.name) || ""));
      if (found) return found;
    }
  }
  // Fallback: first entry
  return entries[0] || null;
}

export default function PokedexFlavorText({ pokemonId, pokemonName }: { pokemonId: number, pokemonName: string }) {
  const [species, setSpecies] = useState<PokemonSpeciesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [preference, setPreference] = useState<any>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedGen, setSelectedGen] = useState<number | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [lang, setLang] = useState<'fr'|'en'>('fr');

  useEffect(() => {
    setLoading(true);
    getPokemonSpecies(pokemonId.toString())
      .then(data => {
        setSpecies(data);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
    // Load preference
    const pref = localStorage.getItem('pokedexFlavorPreference');
    if (pref) setPreference(JSON.parse(pref));
  }, [pokemonId]);

  if (loading) return (
    <div className="w-full flex justify-center items-center min-h-[120px]">
      <div className="animate-pulse text-gray-400 text-sm">Chargement de la description...</div>
    </div>
  );
  if (error || !species) return (
    <PokedexScreen>
      <span className="text-center block">Description indisponible</span>
    </PokedexScreen>
  );

  // Filter and dedupe entries
  let entries = species.flavor_text_entries.filter(e => e.language.name === 'fr');
  let isEnglish = false;
  if (!entries.length) {
    entries = species.flavor_text_entries.filter(e => e.language.name === 'en');
    isEnglish = true;
    setLang('en');
  }
  entries = dedupeEntries(entries);

  // Pick best entry
  const bestEntry = getBestEntry(entries, preference);
  const displayText = bestEntry ? normalizeText(bestEntry.flavor_text) : 'Description indisponible';
  const versionGroup = bestEntry ? getVersionGroup(bestEntry.version.name) : null;

  return (
    <div className="w-full">
      <PokedexScreen
        sourceLabel={versionGroup ? versionGroup.replace(/-/g, ' ') : undefined}
        onChangeSource={() => setModalOpen(true)}
        showChangeSource={true}
        scrollHint={true}
      >
        <span className="block w-full whitespace-pre-line font-pokedex">
          {displayText}
          {isEnglish && (
            <span className="ml-2 px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded align-middle">EN</span>
          )}
        </span>
      </PokedexScreen>
      {modalOpen && (
        <div className="pokedex-flavor-modal">
          <div className="pokedex-flavor-modal-content">
            <h3 className="font-bold mb-2">Choisir la génération ou le jeu</h3>
            <label>Génération :
              <select value={selectedGen ?? ''} onChange={e => setSelectedGen(Number(e.target.value))}>
                <option value="">--</option>
                {GENERATIONS.map(g => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </label>
            <label>Jeu/version :
              <select value={selectedGroup ?? ''} onChange={e => setSelectedGroup(e.target.value)}>
                <option value="">--</option>
                {GENERATIONS.find(g => g.id === selectedGen)?.versionGroups.map(vg => (
                  <option key={vg} value={vg}>{vg.replace(/-/g, ' ')}</option>
                ))}
              </select>
            </label>
            <div className="mt-2 max-h-40 overflow-y-auto">
              {entries.filter(e =>
                (!selectedGroup || getVersionGroup(e.version.name) === selectedGroup) &&
                (!selectedGen || GENERATIONS.find(g => g.id === selectedGen)?.versionGroups.includes(getVersionGroup(e.version.name) || ''))
              ).map((e, i) => (
                <div key={i} className="mb-2">
                  <span>{normalizeText(e.flavor_text)}</span>
                  <span className="ml-2 text-xs text-gray-500">({e.version.name})</span>
                </div>
              ))}
            </div>
            <button className="mt-2 px-2 py-1 text-xs bg-pokedex-red text-white border-2 border-pokedex-red rounded hover:bg-white hover:text-pokedex-red transition" onClick={() => {
              // Save preference
              const mode = selectedGroup ? 'version_group' : selectedGen ? 'generation' : null;
              const value = selectedGroup || selectedGen;
              if (mode && value) {
                localStorage.setItem('pokedexFlavorPreference', JSON.stringify({ mode, value, lang }));
                setPreference({ mode, value, lang });
              }
              setModalOpen(false);
            }}>
              Définir par défaut
            </button>
            <button className="ml-2 px-2 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded" onClick={() => setModalOpen(false)}>
              Annuler
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
