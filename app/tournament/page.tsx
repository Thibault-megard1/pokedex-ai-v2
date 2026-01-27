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

export default function TournamentPage() {
  const [playerTeam, setPlayerTeam] = useState<(PokemonSlot | null)[]>(Array(6).fill(null));
  const [searchValues, setSearchValues] = useState<string[]>(Array(6).fill(""));
  const [evolutionPoints, setEvolutionPoints] = useState<number[]>(Array(6).fill(0));
  const [battleState, setBattleState] = useState<BattleState | null>(null);
  const [battleLog, setBattleLog] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTurnIndex, setCurrentTurnIndex] = useState(0);
  const [autoPlay, setAutoPlay] = useState(false);

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
    
    if (newTotal > 6) return; // Can't exceed 6 points

    const newPoints = [...evolutionPoints];
    newPoints[slot] = newValue;
    setEvolutionPoints(newPoints);
  };

  const generateAITeam = async (): Promise<BattleTeam> => {
    const aiPokemonNames = ["charizard", "blastoise", "venusaur", "pikachu", "lucario", "garchomp"];
    const aiPokemon: BattlePokemon[] = [];

    for (let i = 0; i < 6; i++) {
      const name = aiPokemonNames[i];
      try {
        const res = await fetch(`/api/pokemon/${name}`);
        const data = await res.json();

        aiPokemon.push({
          id: data.id,
          name: data.name,
          types: data.types,
          baseStats: {
            hp: data.stats.find((s: any) => s.name === "hp")?.value || 80,
            attack: data.stats.find((s: any) => s.name === "attack")?.value || 80,
            defense: data.stats.find((s: any) => s.name === "defense")?.value || 80,
            specialAttack: data.stats.find((s: any) => s.name === "special-attack")?.value || 80,
            specialDefense: data.stats.find((s: any) => s.name === "special-defense")?.value || 80,
            speed: data.stats.find((s: any) => s.name === "speed")?.value || 80,
          },
          currentStats: {
            hp: data.stats.find((s: any) => s.name === "hp")?.value || 80,
            attack: data.stats.find((s: any) => s.name === "attack")?.value || 80,
            defense: data.stats.find((s: any) => s.name === "defense")?.value || 80,
            specialAttack: data.stats.find((s: any) => s.name === "special-attack")?.value || 80,
            specialDefense: data.stats.find((s: any) => s.name === "special-defense")?.value || 80,
            speed: data.stats.find((s: any) => s.name === "speed")?.value || 80,
          },
          moves: [
            { name: "tackle", type: "normal", power: 40, damageClass: "physical", accuracy: 100 },
            { name: "fire-blast", type: "fire", power: 110, damageClass: "special", accuracy: 85 },
            { name: "hydro-pump", type: "water", power: 110, damageClass: "special", accuracy: 80 },
            { name: "thunderbolt", type: "electric", power: 90, damageClass: "special", accuracy: 100 },
          ],
          currentHp: data.stats.find((s: any) => s.name === "hp")?.value || 80,
          maxHp: data.stats.find((s: any) => s.name === "hp")?.value || 80,
          evolutionStage: 0,
          evolutionChain: [data.name],
          isFainted: false,
        });
      } catch (error) {
        console.error(`Error loading AI Pokemon ${name}:`, error);
      }
    }

    const aiEvolutionAllocation = createOptimalEvolutionAllocation(aiPokemon);

    return {
      teamId: "ai-team",
      name: "Équipe IA",
      pokemon: aiPokemon,
      evolutionPoints: aiEvolutionAllocation,
      totalEvolutionPointsUsed: aiEvolutionAllocation.reduce((sum, a) => sum + a.points, 0),
      activeIndex: 0,
    };
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
      // Create player team
      const playerBattleTeam: BattleTeam = {
        teamId: "player-team",
        name: "Votre Équipe",
        pokemon: playerTeam.map((p, i) => ({
          id: i + 1,
          name: p!.name,
          types: p!.types,
          baseStats: p!.stats,
          currentStats: p!.stats,
          moves: p!.moves.map(m => ({
            name: m.name,
            type: m.type,
            power: m.power,
            damageClass: m.damageClass as "physical" | "special" | "status",
            accuracy: m.accuracy,
          })),
          currentHp: p!.stats.hp,
          maxHp: p!.stats.hp,
          evolutionStage: 0,
          evolutionChain: p!.evolutionChain,
          isFainted: false,
        })),
        evolutionPoints: evolutionPoints.map((points, index) => ({ pokemonIndex: index, points })),
        totalEvolutionPointsUsed: totalPointsUsed,
        activeIndex: 0,
      };

      // Generate AI team
      const aiTeam = await generateAITeam();

      // Initialize battle
      const battle = initializeBattle(playerBattleTeam, aiTeam);
      setBattleState(battle);
      setBattleLog(["⚡ Le combat commence !"]);
    } catch (error) {
      console.error("Error starting battle:", error);
      alert("Erreur lors du démarrage du combat");
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
            {/* Team Builder */}
            <div className="card p-6">
              <div className="flex items-center gap-2 mb-4">
                <img src="/icons/ui/ic-pokemon.png" alt="Équipe" className="w-6 h-6" />
                <h2 className="text-xl font-bold">Construisez votre équipe (6 Pokémon)</h2>
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

                        <button
                          onClick={() => {
                            const newTeam = [...playerTeam];
                            newTeam[index] = null;
                            setPlayerTeam(newTeam);
                            const newSearchValues = [...searchValues];
                            newSearchValues[index] = "";
                            setSearchValues(newSearchValues);
                          }}
                          className="btn text-sm w-full"
                        >
                          Retirer
                        </button>
                      </div>
                    ) : (
                      <PokemonAutocomplete
                        id={`slot-${index}`}
                        value={searchValues[index]}
                        onChange={(value) => {
                          const newSearchValues = [...searchValues];
                          newSearchValues[index] = value;
                          setSearchValues(newSearchValues);
                          if (value && value.length > 2) {
                            loadPokemon(value, index);
                          }
                        }}
                        placeholder="Choisir un Pokémon"
                      />
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
                  {isLoading ? "Chargement..." : (
                    <>
                      <img src="/icons/ui/nav-battle.png" alt="Battle" className="w-5 h-5" />
                      <span>Lancer le combat</span>
                    </>
                  )}
                </button>
              </div>
            </div>
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

              {/* Teams Display */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-blue-50 rounded-lg p-4 border-2 border-blue-300">
                  <div className="flex items-center gap-2 mb-2">
                    <img src="/icons/ui/ic-trainer.png" alt="Trainer" className="w-5 h-5" />
                    <span className="font-bold">Votre Équipe</span>
                  </div>
                  <div className="space-y-1">
                    {battleState.team1.pokemon.map((p, i) => (
                      <div key={i} className={`flex items-center justify-between text-sm ${p.isFainted ? "opacity-40 line-through" : i === battleState.team1.activeIndex ? "font-bold" : ""}`}>
                        <span className="capitalize">{p.name}</span>
                        <span>{p.currentHp} / {p.maxHp}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-red-50 rounded-lg p-4 border-2 border-red-300">
                  <div className="font-bold mb-2">🤖 Équipe IA</div>
                  <div className="space-y-1">
                    {battleState.team2.pokemon.map((p, i) => (
                      <div key={i} className={`flex items-center justify-between text-sm ${p.isFainted ? "opacity-40 line-through" : i === battleState.team2.activeIndex ? "font-bold" : ""}`}>
                        <span className="capitalize">{p.name}</span>
                        <span>{p.currentHp} / {p.maxHp}</span>
                      </div>
                    ))}
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
          </>
        )}
      </div>
    </div>
  );
}
