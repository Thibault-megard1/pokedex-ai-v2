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

/**
 * Ligne d'affichage d'une stat.
 * Cette fonction n'utilise pas d'intelligence artificielle.
 */
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

/**
 * Page de construction d'equipe.
 * Cette page n'utilise pas d'intelligence artificielle (hors appel API de suggestion).
 * Entree: interactions utilisateur. Sortie: UI + appels API internes.
 */
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
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [showSuggestionsModal, setShowSuggestionsModal] = useState(false);
  const [selectedSlotForSuggestion, setSelectedSlotForSuggestion] = useState<number | null>(null);
  const [optimizingOrder, setOptimizingOrder] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generatingTeam, setGeneratingTeam] = useState(false);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const sortedTeam = useMemo(() => [...team].sort((a, b) => a.slot - b.slot), [team]);
  
  /**
   * Charge l'utilisateur et l'equipe depuis l'API.
   * Cette fonction n'utilise pas d'intelligence artificielle.
   */
  async function load() {
    const meRes = await fetch("/api/me", { cache: "no-store" });
    const meData = await meRes.json();
    setMe(meData.user ?? null);
    const teamRes = await fetch("/api/team", { cache: "no-store" });
    const teamData = await teamRes.json();
    if (teamRes.ok) setTeam(teamData.team ?? []);
  }

  /**
   * Charge les details d'un Pokemon pour un slot.
   * Cette fonction n'utilise pas d'intelligence artificielle.
   */
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

  /**
   * Demande des suggestions d'equipe a l'API IA.
   * IA: oui (LLM cote serveur via /api/team/suggest).
   * Donnees envoyees: equipe courante + stats si dispo.
   */
  async function getAISuggestions(forSlot: number) {
    setLoadingSuggestions(true);
    setSelectedSlotForSuggestion(forSlot);
    setError(null);

    try {
      // Prepare team data with details
      const teamWithDetails = await Promise.all(
        sortedTeam.map(async (member) => {
          const detail = details[member.slot];
          if (detail) {
            return {
              pokemonId: member.pokemonId,
              pokemonName: member.pokemonName,
              types: detail.types,
              stats: detail.stats
            };
          }
          return {
            pokemonId: member.pokemonId,
            pokemonName: member.pokemonName
          };
        })
      );

      const res = await fetch('/api/team/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ team: teamWithDetails })
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Erreur lors de la génération de suggestions');
        setLoadingSuggestions(false);
        return;
      }

      setAiSuggestions(data.suggestions || []);
      setShowSuggestionsModal(true);
    } catch (err) {
      console.error('AI suggestion error:', err);
      setError('Erreur lors de la génération de suggestions');
    } finally {
      setLoadingSuggestions(false);
    }
  }

  /**
   * Ajoute un Pokemon suggere a un slot.
   * Cette fonction n'utilise pas d'intelligence artificielle.
   */
  async function addSuggestedPokemon(pokemonName: string) {
    if (selectedSlotForSuggestion === null) return;
    
    const res = await fetch("/api/team", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slot: selectedSlotForSuggestion, pokemonName })
    });
    const data = await res.json();
    if (res.ok) {
      setTeam(data.team);
      setShowSuggestionsModal(false);
      setAiSuggestions([]);
      setSelectedSlotForSuggestion(null);
    } else {
      setError(data.error ?? "Erreur lors de l'ajout");
    }
  }

  /**
   * Deplace un Pokemon dans l'ordre des slots.
   * Cette fonction n'utilise pas d'intelligence artificielle.
   */
  async function moveSlot(fromSlot: number, direction: 'up' | 'down') {
    const toSlot = direction === 'up' ? fromSlot - 1 : fromSlot + 1;
    if (toSlot < 1 || toSlot > 6) return;

    const fromMember = team.find(t => t.slot === fromSlot);
    const toMember = team.find(t => t.slot === toSlot);

    // Swap slots
    const updatedTeam = team.map(member => {
      if (member.slot === fromSlot) {
        return { ...member, slot: toSlot };
      }
      if (member.slot === toSlot) {
        return { ...member, slot: fromSlot };
      }
      return member;
    });

    // Update on server
    const res = await fetch("/api/team", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ team: updatedTeam })
    });

    const data = await res.json();
    if (res.ok) {
      setTeam(data.team);
      // Swap details
      setDetails(prev => {
        const newDetails = { ...prev };
        const fromDetail = newDetails[fromSlot];
        const toDetail = newDetails[toSlot];
        newDetails[fromSlot] = toDetail || null;
        newDetails[toSlot] = fromDetail || null;
        return newDetails;
      });
    } else {
      setError(data.error ?? "Erreur lors du déplacement");
    }
  }

  /**
   * Optimise l'ordre d'equipe via heuristiques de stats.
   * Cette fonction n'utilise pas d'intelligence artificielle.
   */
  async function optimizeTeamOrder() {
    if (sortedTeam.length === 0) return;
    
    setOptimizingOrder(true);
    setError(null);

    try {
      // Calculate optimal order based on stats and roles
      const teamWithStats = sortedTeam.map(member => {
        const detail = details[member.slot];
        if (!detail) return null;
        
        const stats = detail.stats;
        const hp = stats.find(s => s.name === 'hp')?.value || 0;
        const attack = stats.find(s => s.name === 'attack')?.value || 0;
        const defense = stats.find(s => s.name === 'defense')?.value || 0;
        const spAtk = stats.find(s => s.name === 'special-attack')?.value || 0;
        const spDef = stats.find(s => s.name === 'special-defense')?.value || 0;
        const speed = stats.find(s => s.name === 'speed')?.value || 0;

        // Calculate role scores
        const tankScore = (hp + defense + spDef) / 3;
        const attackerScore = Math.max(attack, spAtk);
        const speedScore = speed;
        const totalDefense = (defense + spDef) / 2;

        return {
          member,
          detail,
          tankScore,
          attackerScore,
          speedScore,
          totalDefense,
          hp
        };
      }).filter(Boolean);

      if (teamWithStats.length === 0) {
        setError("Aucune statistique disponible pour optimiser");
        setOptimizingOrder(false);
        return;
      }

      // Sort by optimal battle order:
      // 1. Fast sweepers first (high speed + attack)
      // 2. Balanced attackers middle
      // 3. Tanks/walls last (high defense/hp)
      const optimized = teamWithStats.sort((a, b) => {
        // Priority to fast sweepers
        const aSweeperScore = (a!.speedScore * 2 + a!.attackerScore) / 3;
        const bSweeperScore = (b!.speedScore * 2 + b!.attackerScore) / 3;
        
        return bSweeperScore - aSweeperScore;
      });

      // Reassign slots
      const reorderedTeam = optimized.map((item, index) => ({
        ...item!.member,
        slot: index + 1
      }));

      // Update on server
      const res = await fetch("/api/team", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ team: reorderedTeam })
      });

      const data = await res.json();
      if (res.ok) {
        setTeam(data.team);
        
        // Reorganize details
        const newDetails: Record<number, PokeLite | null> = {};
        optimized.forEach((item, index) => {
          newDetails[index + 1] = item!.detail;
        });
        setDetails(newDetails);
      } else {
        setError(data.error ?? "Erreur lors de l'optimisation");
      }
    } catch (err) {
      console.error('Optimize error:', err);
      setError('Erreur lors de l\'optimisation de l\'ordre');
    } finally {
      setOptimizingOrder(false);
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

  /**
   * Génère une équipe complète optimisée basée sur un type de départ.
   * IA: oui (Multi-agents via TeamBuildingOrchestrator).
   * Entrée: type Pokémon (water, fire, grass, etc.)
   * Sortie: équipe de 6 Pokémon optimisés
   */
  async function generateTeamByType(type: string) {
    if (!type) return;
    
    setGeneratingTeam(true);
    setError(null);

    try {
      const res = await fetch('/api/team/generate-by-type', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type })
      });

      const data = await res.json();
      
      if (!res.ok) {
        setError(data.error || 'Erreur lors de la génération de l\'équipe');
        setGeneratingTeam(false);
        return;
      }

      // Update team with generated Pokémon
      const res2 = await fetch("/api/team", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ team: data.team })
      });

      const teamData = await res2.json();
      if (!res2.ok) {
        setError(teamData.error ?? "Erreur lors de la sauvegarde de l'équipe");
        setGeneratingTeam(false);
        return;
      }

      setTeam(teamData.team);
      setShowGenerateModal(false);
      setSelectedType(null);
      
      // Reset details to force reload
      setDetails({});
    } catch (err) {
      console.error('Team generation error:', err);
      setError('Erreur lors de la génération de l\'équipe');
    } finally {
      setGeneratingTeam(false);
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
                
                {/* Optimize Order Button */}
                <button
                  onClick={optimizeTeamOrder}
                  disabled={sortedTeam.length < 2 || optimizingOrder}
                  className="px-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed text-white rounded-lg font-bold text-sm transition-all shadow-lg"
                >
                  {optimizingOrder ? "⏳ Optimisation..." : "⚡ Optimiser l'ordre"}
                </button>
                
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
                
                {/* Generate Team Button */}
                <button
                  onClick={() => setShowGenerateModal(true)}
                  className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white rounded-lg font-bold text-sm transition-all shadow-lg"
                >
                  ✨ Générer Équipe
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
                      <div className="flex items-center gap-2">
                        {/* Reorder buttons */}
                        {s && (
                          <>
                            <button
                              onClick={() => moveSlot(slot, 'up')}
                              disabled={slot === 1}
                              className="bg-blue-400 hover:bg-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed text-white text-xs font-bold px-2 py-1 rounded transition-colors"
                              title="Monter"
                            >
                              ▲
                            </button>
                            <button
                              onClick={() => moveSlot(slot, 'down')}
                              disabled={slot === 6}
                              className="bg-blue-400 hover:bg-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed text-white text-xs font-bold px-2 py-1 rounded transition-colors"
                              title="Descendre"
                            >
                              ▼
                            </button>
                          </>
                        )}
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
                      <div className="py-8 text-center">
                        <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gray-200 flex items-center justify-center">
                          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-red-500 to-red-700 opacity-30"></div>
                        </div>
                        <p className="text-gray-500 text-sm pokemon-text mb-4">SLOT VIDE</p>
                        
                        {/* AI Suggestion Button - only show if team has at least 1 Pokemon */}
                        {sortedTeam.length > 0 && (
                          <button
                            onClick={() => getAISuggestions(slot)}
                            disabled={loadingSuggestions}
                            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg font-bold text-xs transition-colors flex items-center gap-2 mx-auto"
                          >
                            {loadingSuggestions ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                <span>Analyse...</span>
                              </>
                            ) : (
                              <>
                                <span>🤖</span>
                                <span>Suggestion IA</span>
                              </>
                            )}
                          </button>
                        )}
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

        {/* AI Suggestions Modal */}
        {showSuggestionsModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <div className="bg-gradient-to-r from-purple-500 to-pink-600 text-white p-6 rounded-t-lg sticky top-0">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">🤖 Suggestions IA</h2>
                  <button
                    onClick={() => {
                      setShowSuggestionsModal(false);
                      setAiSuggestions([]);
                      setSelectedSlotForSuggestion(null);
                    }}
                    className="text-white hover:text-gray-200 text-2xl font-bold"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div className="p-6">
                {aiSuggestions.length > 0 ? (
                  <>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      Voici les meilleurs Pokémon suggérés pour compléter votre équipe :
                    </p>
                    
                    <div className="space-y-4">
                      {aiSuggestions.map((pokemon, idx) => (
                        <div 
                          key={pokemon.id}
                          className="border-2 border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-purple-500 transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            <div className="text-2xl font-bold text-purple-600">
                              #{idx + 1}
                            </div>
                            <div className="flex-1">
                              <h3 className="text-lg font-bold capitalize text-gray-900 dark:text-gray-100">
                                {pokemon.name}
                              </h3>
                              <div className="flex gap-2 mt-2">
                                {pokemon.types.map((type: string) => (
                                  <TypeLogo key={type} type={type} size={20} />
                                ))}
                              </div>
                              {pokemon.stats && (
                                <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                                  Total Stats: <strong>{pokemon.stats.reduce((sum: number, s: any) => sum + s.value, 0)}</strong>
                                </div>
                              )}
                            </div>
                            <button
                              onClick={() => addSuggestedPokemon(pokemon.name)}
                              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold text-sm transition-colors"
                            >
                              ➕ Ajouter
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-purple-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">Analyse de votre équipe en cours...</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Generate Team Modal */}
        {showGenerateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full max-h-[80vh] overflow-y-auto">
              <div className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white p-6 rounded-t-lg sticky top-0">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">✨ Générer une Équipe par Type</h2>
                  <button
                    onClick={() => {
                      setShowGenerateModal(false);
                      setSelectedType(null);
                    }}
                    className="text-white hover:text-gray-200 text-2xl font-bold"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div className="p-6">
                {!generatingTeam ? (
                  <>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                      Sélectionnez un type pour générer automatiquement une équipe optimale construite autour de ce type. L'IA multi-agents va analyser les synergies et créer une équipe équilibrée de 6 Pokémon.
                    </p>

                    {error && (
                      <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm mb-4">
                        ⚠️ {error}
                      </div>
                    )}

                    {sortedTeam.length > 0 && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-6">
                        <p className="text-sm text-yellow-800">
                          <strong>⚠️ Attention :</strong> Cette action remplacera votre équipe actuelle ({sortedTeam.length} Pokémon).
                        </p>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                      {[
                        { type: 'normal', emoji: '⚪', label: 'Normal' },
                        { type: 'fire', emoji: '🔥', label: 'Feu' },
                        { type: 'water', emoji: '💧', label: 'Eau' },
                        { type: 'electric', emoji: '⚡', label: 'Électrik' },
                        { type: 'grass', emoji: '🌿', label: 'Plante' },
                        { type: 'ice', emoji: '❄️', label: 'Glace' },
                        { type: 'fighting', emoji: '🥊', label: 'Combat' },
                        { type: 'poison', emoji: '☠️', label: 'Poison' },
                        { type: 'ground', emoji: '🌍', label: 'Sol' },
                        { type: 'flying', emoji: '🦅', label: 'Vol' },
                        { type: 'psychic', emoji: '🔮', label: 'Psy' },
                        { type: 'bug', emoji: '🐛', label: 'Insecte' },
                        { type: 'rock', emoji: '🪨', label: 'Roche' },
                        { type: 'ghost', emoji: '👻', label: 'Spectre' },
                        { type: 'dragon', emoji: '🐉', label: 'Dragon' },
                        { type: 'dark', emoji: '🌑', label: 'Ténèbres' },
                        { type: 'steel', emoji: '⚔️', label: 'Acier' },
                        { type: 'fairy', emoji: '🧚', label: 'Fée' }
                      ].map(({ type, emoji, label }) => (
                        <button
                          key={type}
                          onClick={() => setSelectedType(type)}
                          className={`p-4 rounded-lg border-2 transition-all ${
                            selectedType === type
                              ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-900 scale-105'
                              : 'border-gray-300 hover:border-cyan-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                          }`}
                        >
                          <div className="text-3xl mb-1">{emoji}</div>
                          <div className="text-xs font-bold text-gray-700 dark:text-gray-300">{label}</div>
                        </button>
                      ))}
                    </div>

                    <div className="flex gap-3 mt-6">
                      <button
                        onClick={() => selectedType && generateTeamByType(selectedType)}
                        disabled={!selectedType}
                        className="flex-1 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed text-white rounded-lg font-bold transition-all"
                      >
                        ✨ Générer l'équipe
                      </button>
                      <button
                        onClick={() => {
                          setShowGenerateModal(false);
                          setSelectedType(null);
                        }}
                        className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-bold transition-colors"
                      >
                        Annuler
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-300 border-t-cyan-500 mx-auto mb-4"></div>
                    <p className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">
                      ✨ Génération en cours...
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      L'IA multi-agents analyse les meilleures options pour votre équipe {selectedType}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
