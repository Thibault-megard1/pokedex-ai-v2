"use client";

import { useState, useEffect } from "react";
import PokemonAutocomplete from "@/components/PokemonAutocomplete";
import TypeLogo from "@/components/TypeLogo";
import { 
  initializeBattle, 
  executeTurn, 
  getBattleSummary 
} from "@/lib/battle/engine";
import { createOptimalEvolutionAllocation } from "@/lib/battle/evolution";
import { 
  generateOpponentTeam, 
  type TournamentRules,
  type TeamGenerationResult 
} from "@/lib/ai/teamBuilder";
import { useAdminView } from "@/components/AdminViewProvider";
import { AdminDebugPanel } from "@/components/AdminDebugComponents";
import { initializeStatStages } from "@/lib/battle/effects";
import type { 
  BattleTeam, 
  BattlePokemon, 
  BattleState,
  BattlePokemonStats 
} from "@/lib/battle/types";

type PokemonSlot = {
  name: string;
  sprite: string | null;
  types: string[];
  stats: BattlePokemonStats;
  moves: Array<{ name: string; type: string; power: number; damageClass: string; accuracy: number }>;
  evolutionChain: string[];
};

// Helper function to fetch real moves for a Pokemon at a specific level
async function fetchPokemonMoves(pokemonName: string, targetLevel: number) {
  try {
    const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonName}`);
    if (!res.ok) throw new Error(`Failed to fetch ${pokemonName}`);
    
    const data = await res.json();
    const levelUpMoves: Array<{ name: string; level: number; type: string; power: number; damageClass: string; accuracy: number }> = [];
    
    if (data.moves && Array.isArray(data.moves)) {
      for (const moveData of data.moves) {
        const moveName = moveData.move?.name;
        if (!moveName) continue;
        
        const versionDetail = moveData.version_group_details?.find(
          (vd: any) => vd.move_learn_method?.name === "level-up"
        );
        
        if (versionDetail) {
          const learnLevel = versionDetail.level_learned_at || 1;
          
          if (learnLevel <= targetLevel) {
            try {
              const moveRes = await fetch(moveData.move.url);
              const moveDetail = await moveRes.json();
              
              levelUpMoves.push({
                name: moveName,
                level: learnLevel,
                type: moveDetail.type?.name || "normal",
                power: moveDetail.power || 60,
                damageClass: moveDetail.damage_class?.name || "physical",
                accuracy: moveDetail.accuracy || 100,
              });
            } catch {
              // Skip this move if we can't fetch details
            }
          }
        }
      }
    }
    
    // Sort by level (highest first) and power
    levelUpMoves.sort((a, b) => b.level - a.level || b.power - a.power);
    
    return levelUpMoves
      .slice(0, 4)
      .map(m => ({
        name: m.name,
        type: m.type,
        power: m.power,
        damageClass: m.damageClass,
        accuracy: m.accuracy,
      }));
  } catch (error) {
    console.error(`Error fetching moves for ${pokemonName}:`, error);
    // Return default moves
    return [
      { name: "tackle", type: "normal", power: 40, damageClass: "physical", accuracy: 100 },
      { name: "scratch", type: "normal", power: 40, damageClass: "physical", accuracy: 100 },
    ];
  }
}

export default function TournamentPage() {
  const { adminViewEnabled } = useAdminView();
  const [playerTeam, setPlayerTeam] = useState<(PokemonSlot | null)[]>(Array(6).fill(null));
  const [searchValues, setSearchValues] = useState<string[]>(Array(6).fill(""));
  const [evolutionPoints, setEvolutionPoints] = useState<number[]>(Array(6).fill(0));
  const [battleState, setBattleState] = useState<BattleState | null>(null);
  const [battleLog, setBattleLog] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTurnIndex, setCurrentTurnIndex] = useState(0);
  const [autoPlay, setAutoPlay] = useState(false);
  const [tournamentRules, setTournamentRules] = useState<TournamentRules>({
    allowLegendaries: false,
    allowMegas: false,
    allowGigantamax: false,
    targetLevel: 50,
  });
  const [teamGeneration, setTeamGeneration] = useState<TeamGenerationResult | null>(null);
  const [loadingTeam, setLoadingTeam] = useState(true);
  const [teamLoaded, setTeamLoaded] = useState(false);

  // Load user's saved team on mount
  useEffect(() => {
    loadSavedTeam();
  }, []);

  // Reload team when target level changes (to update moves)
  useEffect(() => {
    if (teamLoaded && !battleState) {
      loadSavedTeam();
    }
  }, [tournamentRules.targetLevel]);

  const loadSavedTeam = async () => {
    setLoadingTeam(true);
    try {
      const teamRes = await fetch("/api/team", { cache: "no-store" });
      const teamData = await teamRes.json();
      
      if (teamRes.ok && teamData.team && teamData.team.length > 0) {
        // Load each Pokemon from the saved team
        const loadedTeam: (PokemonSlot | null)[] = Array(6).fill(null);
        
        for (const slot of teamData.team) {
          const res = await fetch(`/api/pokemon?name=${encodeURIComponent(slot.pokemonName)}`);
          if (res.ok) {
            const data = await res.json();
            const pokemon = data.pokemon;
            
            // Fetch real moves for this Pokemon at target level
            const moves = await fetchPokemonMoves(pokemon.name, tournamentRules.targetLevel);
            
            loadedTeam[slot.slot - 1] = {
              name: pokemon.name,
              sprite: pokemon.sprite,
              types: pokemon.types,
              stats: {
                hp: pokemon.stats.find((s: any) => s.name === "hp")?.value || 50,
                attack: pokemon.stats.find((s: any) => s.name === "attack")?.value || 50,
                defense: pokemon.stats.find((s: any) => s.name === "defense")?.value || 50,
                specialAttack: pokemon.stats.find((s: any) => s.name === "special-attack")?.value || 50,
                specialDefense: pokemon.stats.find((s: any) => s.name === "special-defense")?.value || 50,
                speed: pokemon.stats.find((s: any) => s.name === "speed")?.value || 50,
              },
              moves,
              evolutionChain: pokemon.evolutionChain?.map((e: any) => e.name) || [pokemon.name],
            };
          }
        }
        
        setPlayerTeam(loadedTeam);
        setTeamLoaded(true);
      }
    } catch (error) {
      console.error("Error loading saved team:", error);
    } finally {
      setLoadingTeam(false);
    }
  };

  // Auto-play turns
  useEffect(() => {
    if (!autoPlay || !battleState || battleState.isFinished) return;

    const timer = setTimeout(() => {
      if (currentTurnIndex < battleState.turnHistory.length) {
        setCurrentTurnIndex(prev => prev + 1);
      } else if (!battleState.isFinished) {
        // Execute next turn
        executeTurn(battleState);
        setBattleState({ ...battleState });
        
        // Add log entry
        const lastTurn = battleState.turnHistory[battleState.turnHistory.length - 1];
        if (lastTurn) {
          const log = `Tour ${lastTurn.turnNumber}: ${lastTurn.attacker.pokemonName} utilise ${lastTurn.attacker.move.name} → ${lastTurn.damage} dégâts${lastTurn.isCritical ? " (Critique!)" : ""} (×${lastTurn.effectiveness})`;
          setBattleLog(prev => [...prev, log]);
          
          // Add effect logs if any
          const effectLogs = (lastTurn as any).effectLogs;
          if (effectLogs && Array.isArray(effectLogs)) {
            effectLogs.forEach((effect: any) => {
              setBattleLog(prev => [...prev, `  ↳ ${effect.description}`]);
            });
          }
        }
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [autoPlay, battleState, currentTurnIndex]);

  const totalPointsUsed = evolutionPoints.reduce((sum, p) => sum + p, 0);

  const loadPokemon = async (name: string, slot: number) => {
    try {
      const res = await fetch(`/api/pokemon/${name}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();

      const pokemon: PokemonSlot = {
        name: data.name,
        sprite: data.sprite,
        types: data.types,
        stats: {
          hp: data.stats.find((s: any) => s.name === "hp")?.value || 50,
          attack: data.stats.find((s: any) => s.name === "attack")?.value || 50,
          defense: data.stats.find((s: any) => s.name === "defense")?.value || 50,
          specialAttack: data.stats.find((s: any) => s.name === "special-attack")?.value || 50,
          specialDefense: data.stats.find((s: any) => s.name === "special-defense")?.value || 50,
          speed: data.stats.find((s: any) => s.name === "speed")?.value || 50,
        },
        moves: (data.moves || []).slice(0, 4).map((m: any) => ({
          name: m.name,
          type: m.type || "normal",
          power: 60,
          damageClass: "physical",
          accuracy: 100,
        })),
        evolutionChain: data.evolutionChain || [data.name],
      };

      const newTeam = [...playerTeam];
      newTeam[slot] = pokemon;
      setPlayerTeam(newTeam);
      
      // Clear search value after selection
      const newSearchValues = [...searchValues];
      newSearchValues[slot] = "";
      setSearchValues(newSearchValues);
    } catch (error) {
      console.error("Error loading Pokemon:", error);
    }
  };

  const adjustEvolutionPoints = (slot: number, delta: number) => {
    const pokemon = playerTeam[slot];
    if (!pokemon) return;

    const maxEvolutions = pokemon.evolutionChain.length - 1;
    const newValue = Math.max(0, Math.min(maxEvolutions, evolutionPoints[slot] + delta));
    
    // Check if we have enough points
    const currentTotal = totalPointsUsed;
    const newTotal = currentTotal - evolutionPoints[slot] + newValue;
    
    if (newTotal > 6) return; // Don't allow exceeding max points
    
    // Update evolution points
    const newPoints = [...evolutionPoints];
    newPoints[slot] = newValue;
    setEvolutionPoints(newPoints);
  };

  const startBattle = async () => {
    if (playerTeam.filter(p => p !== null).length !== 6) {
      alert("Vous devez avoir 6 Pokémon dans votre équipe !");
      return;
    }

    if (totalPointsUsed > 6) {
      alert("Vous ne pouvez utiliser que 6 points d'évolution maximum !");
      return;
    }

    setIsLoading(true);
    setBattleLog([]);
    setCurrentTurnIndex(0);

    try {
      // Convert player team to BattlePokemon format for AI analysis
      const playerBattlePokemon: BattlePokemon[] = playerTeam
        .filter((p): p is PokemonSlot => p !== null)
        .map((p, i) => ({
          id: i + 1,
          name: p.name,
          types: p.types,
          baseStats: p.stats,
          currentStats: { ...p.stats },
          statStages: initializeStatStages(),
          moves: p.moves.map(m => ({
            name: m.name,
            type: m.type,
            power: m.power,
            damageClass: m.damageClass as "physical" | "special" | "status",
            accuracy: m.accuracy,
          })),
          currentHp: p.stats.hp,
          maxHp: p.stats.hp,
          evolutionStage: 0,
          evolutionChain: p.evolutionChain,
          isFainted: false,
          statusCondition: null,
        }));

      // Generate AI team based on player team analysis
      console.log("Starting AI team generation...");
      const result = await generateOpponentTeam(playerBattlePokemon, tournamentRules);
      console.log("AI team generated:", result);
      setTeamGeneration(result);

      // Create player battle team
      const playerBattleTeam: BattleTeam = {
        teamId: "player-team",
        name: "Votre Équipe",
        pokemon: playerBattlePokemon,
        evolutionPoints: evolutionPoints.map((points, index) => ({ pokemonIndex: index, points })),
        totalEvolutionPointsUsed: totalPointsUsed,
        activeIndex: 0,
      };

      // Initialize battle
      console.log("Initializing battle...");
      const battle = initializeBattle(playerBattleTeam, result.team);
      setBattleState(battle);
      setBattleLog(["⚡ Le combat commence !"]);
      console.log("Battle started successfully");
    } catch (error) {
      console.error("Error starting battle:", error);
      const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
      alert(`Erreur lors du démarrage du combat: ${errorMessage}\n\nVérifiez la console pour plus de détails.`);
    } finally {
      setIsLoading(false);
    }
  };

  const summary = battleState ? getBattleSummary(battleState) : null;
  const visibleTurns = battleState?.turnHistory.slice(0, currentTurnIndex) || [];

  return (
    <div className="page-bg min-h-screen">
      <div className="page-content space-y-4">
        <div className="card p-6 mt-24">
          <div className="flex items-center gap-3 mb-2">
            <img src="/icons/ui/ic-success.png" alt="Tournoi" className="w-8 h-8" />
            <h1 className="text-3xl font-bold">Tournoi Pokémon</h1>
          </div>
          <p className="text-gray-600 dark:text-gray-300">Affrontez l'IA dans un combat 6 vs 6 avec système d'évolution</p>
        </div>

        {!battleState ? (
          <>
            {loadingTeam ? (
              <div className="card p-6">
                <div className="flex items-center justify-center gap-3 py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                  <span className="text-lg">Chargement de votre équipe...</span>
                </div>
              </div>
            ) : !teamLoaded ? (
              <div className="card p-6">
                <div className="text-center py-12">
                  <img src="/icons/ui/ic-info.png" alt="Info" className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <h2 className="text-xl font-bold mb-2">Aucune équipe sauvegardée</h2>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    Vous devez d'abord créer une équipe dans la page "Équipe"
                  </p>
                  <a href="/team" className="btn btn-primary inline-flex items-center gap-2">
                    <img src="/icons/ui/ic-pokemon.png" alt="Team" className="w-5 h-5" />
                    <span>Créer mon équipe</span>
                  </a>
                </div>
              </div>
            ) : (
              <>
            {/* Tournament Rules */}
            <div className="card p-6">
              <div className="flex items-center gap-2 mb-4">
                <img src="/icons/ui/ic-info.png" alt="Règles" className="w-6 h-6" />
                <h2 className="text-xl font-bold">Règles du Tournoi</h2>
              </div>

              <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-start gap-2">
                  <span className="text-2xl">🤖</span>
                  <div>
                    <h3 className="font-bold mb-1">Génération Intelligente de l'Équipe Adverse</h3>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      L'IA analysera votre équipe pour détecter vos faiblesses et forces, puis générera une équipe adverse optimisée pour vous contrer. 
                      Elle sélectionnera des Pokémon avec une couverture de types stratégique, un équilibre défensif/offensif, et des contre-stratégies adaptées.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={tournamentRules.allowLegendaries}
                    onChange={(e) => setTournamentRules({ ...tournamentRules, allowLegendaries: e.target.checked })}
                    className="w-5 h-5"
                  />
                  <span>Autoriser les Légendaires</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={tournamentRules.allowMegas}
                    onChange={(e) => setTournamentRules({ ...tournamentRules, allowMegas: e.target.checked })}
                    className="w-5 h-5"
                  />
                  <span>Autoriser les Méga-Évolutions</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={tournamentRules.allowGigantamax}
                    onChange={(e) => setTournamentRules({ ...tournamentRules, allowGigantamax: e.target.checked })}
                    className="w-5 h-5"
                  />
                  <span>Autoriser les Gigamax</span>
                </label>

                <label className="flex flex-col gap-2">
                  <span className="font-semibold">Niveau cible</span>
                  <select
                    value={tournamentRules.targetLevel}
                    onChange={(e) => setTournamentRules({ ...tournamentRules, targetLevel: Number(e.target.value) })}
                    className="border-2 border-gray-300 rounded px-3 py-2"
                  >
                    <option value={50}>Niveau 50</option>
                    <option value={75}>Niveau 75</option>
                    <option value={100}>Niveau 100</option>
                  </select>
                </label>
              </div>
            </div>

            {/* Team Display */}
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <img src="/icons/ui/ic-pokemon.png" alt="Équipe" className="w-6 h-6" />
                  <h2 className="text-xl font-bold">Votre Équipe</h2>
                </div>
                <a href="/team" className="btn text-sm">
                  ✏️ Modifier l'équipe
                </a>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {playerTeam.map((pokemon, index) => (
                  <div key={index} className="border-2 border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
                    <div className="font-semibold text-sm text-gray-600 dark:text-gray-300 mb-2">Slot {index + 1}</div>
                    
                    {pokemon ? (
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <img src={pokemon.sprite || ""} alt={pokemon.name} className="w-16 h-16 pixelated" />
                          <div className="flex-1">
                            <div className="font-bold capitalize">{pokemon.name}</div>
                            <div className="flex gap-1 mt-1">
                              {pokemon.types.map(t => (
                                <TypeLogo key={t} type={t} size={20} />
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Evolution Points */}
                        <div className="bg-white dark:bg-gray-700 rounded p-2 border border-gray-200 dark:border-gray-600">
                          <div className="text-xs font-semibold mb-1">Points d'évolution ({evolutionPoints[index]})</div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => adjustEvolutionPoints(index, -1)}
                              disabled={evolutionPoints[index] === 0}
                              className="btn text-sm px-2 py-1"
                            >
                              −
                            </button>
                            <div className="flex-1 text-center font-bold">{evolutionPoints[index]}</div>
                            <button
                              onClick={() => adjustEvolutionPoints(index, 1)}
                              disabled={evolutionPoints[index] >= pokemon.evolutionChain.length - 1 || totalPointsUsed >= 6}
                              className="btn text-sm px-2 py-1"
                            >
                              +
                            </button>
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Max: {pokemon.evolutionChain.length - 1}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-400">
                        Emplacement vide
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-6 flex items-center justify-between">
                <div className="text-lg">
                  Points d'évolution utilisés: <span className={`font-bold ${totalPointsUsed > 6 ? "text-red-600" : "text-green-600"}`}>{totalPointsUsed} / 6</span>
                </div>
                
                <button
                  onClick={startBattle}
                  disabled={playerTeam.filter(p => p !== null).length !== 6 || totalPointsUsed > 6 || isLoading}
                  className="btn btn-primary text-lg px-6 py-3 flex items-center gap-2"
                >
                  {isLoading ? "Génération de l'équipe adverse..." : (
                    <>
                      <img src="/icons/ui/nav-battle.png" alt="Battle" className="w-5 h-5" />
                      <span>Lancer le combat</span>
                    </>
                  )}
                </button>
              </div>
            </div>
            </>
            )}
          </>
        ) : (
          <>
            {/* Battle View */}
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <img src="/icons/ui/nav-battle.png" alt="Combat" className="w-6 h-6" />
                  <h2 className="text-xl font-bold">Combat en cours</h2>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setAutoPlay(!autoPlay)}
                    className={`btn ${autoPlay ? "btn-primary" : ""}`}
                  >
                    {autoPlay ? "⏸ Pause" : "▶ Auto"}
                  </button>
                  {battleState.isFinished && (
                    <button
                      onClick={() => {
                        setBattleState(null);
                        setBattleLog([]);
                        setCurrentTurnIndex(0);
                      }}
                      className="btn btn-primary"
                    >
                      🔄 Nouveau combat
                    </button>
                  )}
                </div>
              </div>

              {battleState.isFinished && summary && (
                <div className={`p-4 rounded-lg mb-4 ${summary.winner === "player-team" ? "bg-green-100 border-2 border-green-500" : "bg-red-100 border-2 border-red-500"}`}>
                  <div className="text-2xl font-bold text-center">
                    {summary.winner === "player-team" ? "🎉 Victoire !" : "💀 Défaite"}
                  </div>
                  <div className="text-center mt-2">
                    Tours: {summary.totalTurns} | 
                    Pokémon restants: {summary.team1RemainingPokemon} vs {summary.team2RemainingPokemon}
                  </div>
                </div>
              )}

              {/* Teams Display - 3x2 Grid Layout */}
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                {/* Player Team */}
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/20 rounded-lg p-4 border-2 border-blue-400">
                  <div className="flex items-center gap-2 mb-3">
                    <img src="/icons/ui/ic-trainer.png" alt="Trainer" className="w-6 h-6" />
                    <span className="font-bold text-lg">Votre Équipe</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {battleState.team1.pokemon.map((p, i) => {
                      const sprite = playerTeam.find(pt => pt?.name === p.name)?.sprite || "/icons/ui/ic-pokemon.png";
                      const hpPercent = (p.currentHp / p.maxHp) * 100;
                      const isActive = i === battleState.team1.activeIndex;
                      
                      return (
                        <div 
                          key={i} 
                          className={`relative bg-white dark:bg-gray-800 rounded-lg p-2 border-2 transition-all ${
                            p.isFainted ? "opacity-40 grayscale" : 
                            isActive ? "border-yellow-400 shadow-lg ring-2 ring-yellow-300" : 
                            "border-gray-300 dark:border-gray-600"
                          }`}
                        >
                          {isActive && (
                            <div className="absolute -top-2 -right-2 bg-yellow-400 text-xs font-bold px-2 py-1 rounded-full shadow">
                              ⚡
                            </div>
                          )}
                          <img 
                            src={sprite} 
                            alt={p.name} 
                            className="w-16 h-16 mx-auto pixelated"
                          />
                          <div className="text-xs font-semibold text-center capitalize truncate mt-1">
                            {p.name}
                          </div>
                          <div className="text-xs text-center text-gray-600 dark:text-gray-400">
                            {p.currentHp} / {p.maxHp}
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-1">
                            <div 
                              className={`h-1.5 rounded-full transition-all ${
                                hpPercent > 50 ? "bg-green-500" : 
                                hpPercent > 20 ? "bg-yellow-500" : 
                                "bg-red-500"
                              }`}
                              style={{ width: `${hpPercent}%` }}
                            />
                          </div>
                          {p.statusCondition && (
                            <div className="text-xs text-center mt-1 font-bold text-purple-600">
                              {p.statusCondition.toUpperCase()}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* AI Team */}
                <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-800/20 rounded-lg p-4 border-2 border-red-400">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-2xl">🤖</span>
                    <span className="font-bold text-lg">Équipe IA</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {battleState.team2.pokemon.map((p, i) => {
                      const hpPercent = (p.currentHp / p.maxHp) * 100;
                      const isActive = i === battleState.team2.activeIndex;
                      
                      return (
                        <div 
                          key={i} 
                          className={`relative bg-white dark:bg-gray-800 rounded-lg p-2 border-2 transition-all ${
                            p.isFainted ? "opacity-40 grayscale" : 
                            isActive ? "border-yellow-400 shadow-lg ring-2 ring-yellow-300" : 
                            "border-gray-300 dark:border-gray-600"
                          }`}
                        >
                          {isActive && (
                            <div className="absolute -top-2 -right-2 bg-yellow-400 text-xs font-bold px-2 py-1 rounded-full shadow">
                              ⚡
                            </div>
                          )}
                          <img 
                            src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${p.id}.png`}
                            alt={p.name} 
                            className="w-16 h-16 mx-auto pixelated"
                          />
                          <div className="text-xs font-semibold text-center capitalize truncate mt-1">
                            {p.name}
                          </div>
                          <div className="text-xs text-center text-gray-600 dark:text-gray-400">
                            {p.currentHp} / {p.maxHp}
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-1">
                            <div 
                              className={`h-1.5 rounded-full transition-all ${
                                hpPercent > 50 ? "bg-green-500" : 
                                hpPercent > 20 ? "bg-yellow-500" : 
                                "bg-red-500"
                              }`}
                              style={{ width: `${hpPercent}%` }}
                            />
                          </div>
                          {p.statusCondition && (
                            <div className="text-xs text-center mt-1 font-bold text-purple-600">
                              {p.statusCondition.toUpperCase()}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Battle Log */}
              <div className="bg-gray-100 rounded-lg p-4 h-96 overflow-y-auto">
                <div className="font-bold mb-2">📜 Journal de combat</div>
                {battleLog.map((log, i) => (
                  <div key={i} className="text-sm py-1 border-b border-gray-300">
                    {log}
                  </div>
                ))}
              </div>
            </div>

            {/* Admin View - AI Team Generation Reasoning */}
            {adminViewEnabled && teamGeneration && (
              <>
                <AdminDebugPanel
                  title="🧠 AI Team Analysis"
                  data={{
                    playerWeaknesses: teamGeneration.analysis.playerWeaknesses,
                    playerResistances: teamGeneration.analysis.playerResistances,
                    playerTypes: teamGeneration.analysis.playerTypesCovered,
                    opponentTypes: teamGeneration.analysis.opponentTypesCovered,
                    defensiveBalance: `${teamGeneration.analysis.defensiveBalance.toFixed(0)}%`,
                    offensiveBalance: `${teamGeneration.analysis.offensiveBalance.toFixed(0)}%`,
                  }}
                />

                <AdminDebugPanel
                  title="⚔️ AI Team Selection Reasoning"
                  data={teamGeneration.reasoning.map((r) => ({
                    pokemon: r.pokemonName,
                    role: r.role,
                    reason: r.reason,
                    counters: r.counters.join(", ") || "none",
                    coverageTypes: r.coverageTypes.join(", "),
                  }))}
                />
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
