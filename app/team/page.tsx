"use client";
import { BACKGROUNDS } from "@/lib/backgrounds";

import { useEffect, useMemo, useState } from "react";
import PokemonAutocomplete from "@/components/PokemonAutocomplete";
import EvolutionDisplay from "@/components/EvolutionDisplay";
import TeamStrategyBuilder from "@/components/TeamStrategyBuilder";
import TypeLogo from "@/components/TypeLogo";
import TeamShareModal from "@/components/TeamShareModal";
import { decodeTeam, validateTeam } from "@/lib/teamSharing";

type TeamSlot = { slot: number; pokemonId: number; pokemonName: string };
type Me = { username: string } | null;
const slots = [1, 2, 3, 4, 5, 6];

type EvolutionNode = {
  id: number;
  name: string;
  level?: number;
  item?: string;
  trigger?: string;
};

type PokeLite = {
  id: number;
  name: string;
  sprite: string | null;
  types: string[];
  stats: { name: string; value: number }[];
  evolutionStage?: number | null;
  evolutionChain?: EvolutionNode[];
  nextEvolutions?: EvolutionNode[];
};

function StatRow({ s }: { s: { name: string; value: number } }) {
  const percentage = Math.min(100, (s.value / 255) * 100);
  const color = s.value >= 120 ? "green" : s.value >= 80 ? "blue" : s.value >= 50 ? "yellow" : "red";
  
  return (
    <div className="flex items-center gap-3">
      <div className="w-24 text-xs font-semibold text-gray-700 dark:text-gray-300 capitalize pokemon-text">
        {s.name}
      </div>
      <div className="flex-1 h-4 bg-gray-900 rounded-full overflow-hidden border border-gray-700">
        <div 
          className="h-full bg-white transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="w-12 text-right text-sm font-bold text-gray-800 dark:text-gray-200">
        {s.value}
      </div>
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
  const [showShareModal, setShowShareModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importCode, setImportCode] = useState("");
  const [importSuccess, setImportSuccess] = useState(false);
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
    // Show success message if imported
    const imported = url.searchParams.get("imported");
    if (imported === "true") {
      setImportSuccess(true);
      setTimeout(() => setImportSuccess(false), 5000);
      url.searchParams.delete("imported");
      window.history.replaceState({}, "", url.toString());
    }
  }, []);
  
  useEffect(() => {
    sortedTeam.forEach(s => { void loadDetailFor(s.slot, s.pokemonName); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortedTeam.map(s => s.pokemonName).join("|")]);
  
  async function addPokemon() {
    setError(null);
    let name = addName.trim().toLowerCase();
    if (!name) return;

    // Résoudre le nom français en nom anglais si nécessaire
    try {
      const response = await fetch(`/api/pokemon-names/resolve?name=${encodeURIComponent(name)}`);
      if (response.ok) {
        const data = await response.json();
        name = data.englishName || name;
      }
    } catch {
      // En cas d'erreur, utiliser le nom tel quel
    }

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

  async function importTeam() {
    setError(null);
    try {
      let code = importCode.trim();
      
      // Extract from URL if full URL provided
      if (code.includes('/team/share?data=')) {
        const urlParams = new URL(code).searchParams;
        code = urlParams.get('data') || '';
      }
      
      if (!code) {
        setError('Veuillez entrer un code de partage');
        return;
      }

      const decoded = decodeTeam(code);
      const validation = validateTeam(decoded);
      
      if (!validation.valid) {
        setError(`Équipe invalide: ${validation.errors.join(', ')}`);
        return;
      }

      // Clear current team and add imported Pokémon
      const importedTeam: TeamSlot[] = decoded!.pokemon.map((p, idx) => ({
        slot: idx + 1,
        pokemonId: p.id,
        pokemonName: p.name
      }));

      const res = await fetch("/api/team", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ team: importedTeam })
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erreur lors de l'importation");
        return;
      }

      setTeam(data.team);
      setShowImportModal(false);
      setImportCode('');
      setImportSuccess(true);
      setTimeout(() => setImportSuccess(false), 5000);
    } catch (err) {
      console.error('Import failed:', err);
      setError('Code de partage invalide');
    }
  }

  if (!me) {
    return (
      <div className="page-bg min-h-screen" style={{ ["--bg-url" as any]: `url(${BACKGROUNDS.battle})` }}>
        <div className="page-content py-24 px-4">
          <div className="pokedex-panel max-w-2xl mx-auto pokedex-open-animation">
            <div className="pokedex-panel-content p-8 text-center">
              <div className="text-6xl mb-4">🔒</div>
              <h1 className="text-3xl font-bold text-pokemon mb-4">MON ÉQUIPE</h1>
              <p className="text-gray-600 mb-6">
                Vous devez être connecté pour gérer votre équipe Pokémon.
              </p>
              <div className="flex gap-3 justify-center">
                <a className="pokedex-button" href="/auth/login">
                  Connexion
                </a>
                <a className="pokedex-button-yellow" href="/auth/register">
                  Inscription
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-bg min-h-screen" style={{ ["--bg-url" as any]: `url(${BACKGROUNDS.battle})` }}>
      <div className="page-content py-24 px-4">
        
        {/* Import Success Message */}
        {importSuccess && (
          <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-bounce">
            ✅ Équipe importée avec succès !
          </div>
        )}

        {/* Header */}
        <div className="pokedex-panel max-w-6xl mx-auto mb-6 pokedex-open-animation">
          <div className="pokedex-panel-content p-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h1 className="text-3xl font-bold text-pokemon mb-2">MON ÉQUIPE POKÉMON</h1>
                <p className="text-sm text-gray-600">
                  Dresseur: <b className="text-pokemon">{me.username}</b> — {sortedTeam.length}/6 Pokémon
                </p>
              </div>
              
              <div className="flex gap-3 items-center">
                <div className="bg-blue-50 border-2 border-blue-300 rounded-lg px-4 py-2">
                  <div className="text-xs text-blue-600 font-bold pokemon-text">ÉQUIPE</div>
                  <div className="text-2xl font-bold text-blue-900">{sortedTeam.length}/6</div>
                </div>
                
                {/* Share and Import Buttons */}
                <button
                  onClick={() => setShowShareModal(true)}
                  disabled={sortedTeam.length === 0}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg font-bold text-sm transition-colors"
                >
                  🔗 Partager
                </button>
                <button
                  onClick={() => setShowImportModal(true)}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold text-sm transition-colors"
                >
                  📥 Importer
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Add Pokemon Section */}
        <div className="pokedex-screen max-w-6xl mx-auto mb-6 p-6">
          <h2 className="text-pokemon text-xl mb-4">➕ AJOUTER UN POKÉMON</h2>
          <div className="flex gap-3">
            <div className="flex-1">
              <PokemonAutocomplete
                id="team-add"
                value={addName}
                onChange={setAddName}
                placeholder="Rechercher un Pokémon (ex: pikachu)"
              />
            </div>
            <button className="pokedex-button-yellow min-w-[120px]" onClick={addPokemon}>
              Ajouter
            </button>
          </div>
          {error ? (
            <div className="mt-3 bg-red-50 border-2 border-red-300 rounded-lg p-3 text-sm text-red-700">
              ⚠️ {error}
            </div>
          ) : null}
        </div>

        {/* Team Grid */}
        <div className="max-w-6xl mx-auto mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(slot => {
              const s = sortedTeam.find(x => x.slot === slot);
              const d = s ? details[slot] : null;
              const expanded = expandedSlot === slot;

              return (
                <div key={slot} className="pokedex-card">
                  <div className="pokedex-card-header bg-gradient-to-r from-blue-500 to-blue-600">
                    <div className="flex items-center justify-between">
                      <span className="text-white font-bold pokemon-text text-sm">
                        SLOT {slot}
                      </span>
                      {s && (
                        <button 
                          className="bg-red-500 hover:bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full pokemon-text transition-colors" 
                          onClick={() => removeSlot(slot)}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="p-4">
                    {s && d ? (
                      <>
                        {/* Pokemon Info */}
                        <div className="flex flex-col items-center mb-4">
                          <div className="w-32 h-32 rounded-lg bg-gray-100 border-2 border-gray-300 flex items-center justify-center mb-3">
                            {d.sprite ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img 
                                src={d.sprite} 
                                alt={d.name} 
                                className="w-28 h-28 pixelated hover:scale-110 transition-transform" 
                              />
                            ) : (
                              <span className="text-4xl text-gray-400">?</span>
                            )}
                          </div>
                          
                          <h3 className="text-xl font-bold text-pokemon capitalize text-center">
                            {d.name}
                          </h3>
                          <p className="text-xs text-gray-600 pokemon-text">#{String(d.id).padStart(3, "0")}</p>
                          
                          {/* Types */}
                          {d.types?.length ? (
                            <div className="flex flex-wrap gap-2 mt-3 justify-center">
                              {d.types.map(t => (
                                <TypeLogo key={t} type={t} size={24} />
                              ))}
                            </div>
                          ) : null}
                        </div>

                        {/* Toggle Stats Button */}
                        <button
                          className="pokedex-button w-full text-sm"
                          onClick={() => {
                            setExpandedSlot(expanded ? null : slot);
                            void loadDetailFor(slot, s.pokemonName);
                          }}
                        >
                          {expanded ? "Masquer stats" : "Afficher stats"}
                        </button>

                        {/* Stats Section (Expanded) */}
                        {expanded && (
                          <div className="mt-4 pokedex-screen p-3 space-y-2">
                            <h4 className="text-xs font-bold pokemon-text mb-2">STATISTIQUES</h4>
                            {d.stats.map(st => <StatRow key={st.name} s={st} />)}
                            <div className="flex justify-between pt-2 mt-2 border-t-2 border-gray-300 text-sm">
                              <span className="font-bold text-gray-900 dark:text-gray-100">TOTAL</span>
                              <b className="text-blue-600">{d.stats.reduce((sum, s) => sum + s.value, 0)}</b>
                            </div>
                          </div>
                        )}

                        {/* Evolution Display */}
                        {expanded && d.evolutionChain && d.evolutionChain.length > 0 && (
                          <div className="mt-4">
                            <EvolutionDisplay
                              currentStage={d.evolutionStage ?? null}
                              evolutionChain={d.evolutionChain}
                              currentPokemonId={d.id}
                            />
                          </div>
                        )}
                      </>
                    ) : s && !d ? (
                      <div className="py-8 text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-blue-600 mx-auto"></div>
                        <p className="text-sm text-gray-600 mt-3">Chargement...</p>
                      </div>
                    ) : (
                      <div className="py-12 text-center">
                        <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gray-200 flex items-center justify-center">
                          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-red-500 to-red-700 opacity-30"></div>
                        </div>
                        <p className="text-gray-500 text-sm pokemon-text">SLOT VIDE</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Strategic Analysis */}
        {sortedTeam.length > 0 && Object.keys(details).length > 0 && (
          <div className="pokedex-panel max-w-6xl mx-auto">
            <div className="pokedex-panel-content p-6">
              <h2 className="text-pokemon text-2xl mb-4">🎯 ANALYSE STRATÉGIQUE</h2>
              <TeamStrategyBuilder 
                team={sortedTeam
                  .map(s => details[s.slot])
                  .filter((d): d is PokeLite => d !== null && d !== undefined)
                }
              />
            </div>
          </div>
        )}

        {/* Share Modal */}
        {showShareModal && (
          <TeamShareModal
            team={sortedTeam}
            teamName={me?.username ? `Équipe de ${me.username}` : 'Mon Équipe'}
            onClose={() => setShowShareModal(false)}
          />
        )}

        {/* Import Modal */}
        {showImportModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full">
              <div className="bg-gradient-to-r from-green-500 to-teal-600 text-white p-6 rounded-t-lg">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">📥 Importer une équipe</h2>
                  <button
                    onClick={() => {
                      setShowImportModal(false);
                      setImportCode('');
                      setError(null);
                    }}
                    className="text-white hover:text-gray-200 text-2xl font-bold"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                    Code de partage ou URL
                  </label>
                  <textarea
                    value={importCode}
                    onChange={(e) => setImportCode(e.target.value)}
                    placeholder="Collez ici le code de partage ou l'URL complète..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-sm font-mono resize-none"
                    rows={4}
                  />
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
                    ⚠️ {error}
                  </div>
                )}

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-sm text-yellow-800">
                    <strong>⚠️ Attention :</strong> L'importation remplacera votre équipe actuelle.
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={importTeam}
                    disabled={!importCode.trim()}
                    className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg font-bold transition-colors"
                  >
                    ✅ Importer
                  </button>
                  <button
                    onClick={() => {
                      setShowImportModal(false);
                      setImportCode('');
                      setError(null);
                    }}
                    className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-bold transition-colors"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
