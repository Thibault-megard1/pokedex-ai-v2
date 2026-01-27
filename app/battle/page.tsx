"use client";

import { useState } from "react";
import PokemonAutocomplete from "@/components/PokemonAutocomplete";
import TypeLogo from "@/components/TypeLogo";
import { BACKGROUNDS } from "@/lib/backgrounds";
import { getPokemonCategory } from "@/lib/pokemonCategories";

// Types for team building
type TeamMember = {
  baseName: string;
  currentName: string;
  sprite: string | null;
  types: string[];
  stats: { name: string; value: number }[];
  evolutionLevel: number; // 0 = base, 1 = first evo, 2 = second evo
  category: "starter" | "early-route" | "legendary" | "standard";
  evolutionChain?: string[]; // Available evolutions
};

type BattleResult = {
  winner: "A" | "B";
  teamA: TeamMember[];
  teamB: TeamMember[];
  rounds: {
    round: number;
    pokemonA: string;
    pokemonB: string;
    winner: "A" | "B";
    turnsCount: number;
  }[];
};

const INITIAL_EVOLUTION_POINTS = 6;
const LEGENDARY_COST = 3;

export default function BattlePage() {
  // Team A (Player)
  const [teamA, setTeamA] = useState<(TeamMember | null)[]>(Array(6).fill(null));
  const [currentInputA, setCurrentInputA] = useState<number>(0);
  const [inputValueA, setInputValueA] = useState("");
  const [evolutionPointsA, setEvolutionPointsA] = useState(INITIAL_EVOLUTION_POINTS);
  const [legendaryUnlockedA, setLegendaryUnlockedA] = useState(false);

  // Team B (Opponent)
  const [teamB, setTeamB] = useState<(TeamMember | null)[]>(Array(6).fill(null));
  const [currentInputB, setCurrentInputB] = useState<number>(0);
  const [inputValueB, setInputValueB] = useState("");
  const [evolutionPointsB, setEvolutionPointsB] = useState(INITIAL_EVOLUTION_POINTS);
  const [legendaryUnlockedB, setLegendaryUnlockedB] = useState(false);

  // Battle state
  const [battleResult, setBattleResult] = useState<BattleResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Add Pokemon to team
  async function addPokemonToTeam(
    pokemonName: string,
    isTeamA: boolean,
    slotIndex: number
  ) {
    if (!pokemonName.trim()) return;

    try {
      const response = await fetch(`/api/pokemon/${pokemonName.toLowerCase()}`);
      if (!response.ok) {
        setError(`Pokemon "${pokemonName}" not found`);
        return;
      }

      const data = await response.json();
      const category = getPokemonCategory(pokemonName);

      // Check if legendary and not unlocked
      if (category === "legendary") {
        if (isTeamA && !legendaryUnlockedA) {
          setError("Legendary Pokemon locked! Unlock with 3 evolution points.");
          return;
        }
        if (!isTeamA && !legendaryUnlockedB) {
          setError("Legendary Pokemon locked! Unlock with 3 evolution points.");
          return;
        }
      }

      const newMember: TeamMember = {
        baseName: pokemonName.toLowerCase(),
        currentName: pokemonName.toLowerCase(),
        sprite: data.sprite,
        types: data.types,
        stats: data.stats,
        evolutionLevel: 0,
        category,
        evolutionChain: data.evolutions?.map((e: any) => e.name) || []
      };

      if (isTeamA) {
        const newTeam = [...teamA];
        newTeam[slotIndex] = newMember;
        setTeamA(newTeam);
        setInputValueA("");
        
        // Move to next empty slot
        const nextEmpty = newTeam.findIndex((m, i) => i > slotIndex && m === null);
        if (nextEmpty !== -1) setCurrentInputA(nextEmpty);
      } else {
        const newTeam = [...teamB];
        newTeam[slotIndex] = newMember;
        setTeamB(newTeam);
        setInputValueB("");
        
        const nextEmpty = newTeam.findIndex((m, i) => i > slotIndex && m === null);
        if (nextEmpty !== -1) setCurrentInputB(nextEmpty);
      }

      setError(null);
    } catch (e: any) {
      setError(e.message || "Error loading Pokemon");
    }
  }

  // Evolve Pokemon
  async function evolvePokemon(isTeamA: boolean, slotIndex: number) {
    const team = isTeamA ? teamA : teamB;
    const member = team[slotIndex];
    if (!member) return;

    const evolutionPoints = isTeamA ? evolutionPointsA : evolutionPointsB;
    const evolutionChain = member.evolutionChain || [];
    
    if (member.evolutionLevel >= evolutionChain.length) {
      setError("No more evolutions available");
      return;
    }

    const cost = member.evolutionLevel === 0 ? 1 : 2;
    if (evolutionPoints < cost) {
      setError(`Not enough evolution points! Need ${cost} points.`);
      return;
    }

    const nextEvolution = evolutionChain[member.evolutionLevel];
    if (!nextEvolution) return;

    try {
      const response = await fetch(`/api/pokemon/${nextEvolution.toLowerCase()}`);
      if (!response.ok) throw new Error("Evolution not found");

      const data = await response.json();

      const updatedMember: TeamMember = {
        ...member,
        currentName: nextEvolution.toLowerCase(),
        sprite: data.sprite,
        types: data.types,
        stats: data.stats,
        evolutionLevel: member.evolutionLevel + 1
      };

      if (isTeamA) {
        const newTeam = [...teamA];
        newTeam[slotIndex] = updatedMember;
        setTeamA(newTeam);
        setEvolutionPointsA(evolutionPointsA - cost);
      } else {
        const newTeam = [...teamB];
        newTeam[slotIndex] = updatedMember;
        setTeamB(newTeam);
        setEvolutionPointsB(evolutionPointsB - cost);
      }

      setError(null);
    } catch (e: any) {
      setError(e.message || "Error evolving Pokemon");
    }
  }

  // Unlock legendary slot
  function unlockLegendary(isTeamA: boolean) {
    const points = isTeamA ? evolutionPointsA : evolutionPointsB;
    if (points < LEGENDARY_COST) {
      setError(`Need ${LEGENDARY_COST} evolution points to unlock legendary Pokemon!`);
      return;
    }

    if (isTeamA) {
      setEvolutionPointsA(evolutionPointsA - LEGENDARY_COST);
      setLegendaryUnlockedA(true);
    } else {
      setEvolutionPointsB(evolutionPointsB - LEGENDARY_COST);
      setLegendaryUnlockedB(true);
    }
    setError(null);
  }

  // Remove Pokemon from team
  function removePokemon(isTeamA: boolean, slotIndex: number) {
    if (isTeamA) {
      const newTeam = [...teamA];
      newTeam[slotIndex] = null;
      setTeamA(newTeam);
    } else {
      const newTeam = [...teamB];
      newTeam[slotIndex] = null;
      setTeamB(newTeam);
    }
  }

  // Start battle
  async function startBattle() {
    const validTeamA = teamA.filter(m => m !== null) as TeamMember[];
    const validTeamB = teamB.filter(m => m !== null) as TeamMember[];

    if (validTeamA.length === 0 || validTeamB.length === 0) {
      setError("Both teams need at least one Pokemon!");
      return;
    }

    setLoading(true);
    setError(null);
    setBattleResult(null);

    try {
      const response = await fetch("/api/battle/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamA: validTeamA.map(m => m.currentName),
          teamB: validTeamB.map(m => m.currentName)
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Battle failed");
      }

      const result = await response.json();
      setBattleResult(result);
    } catch (e: any) {
      setError(e.message || "Error starting battle");
    } finally {
      setLoading(false);
    }
  }

  function renderTeamBuilder(isTeamA: boolean) {
    const team = isTeamA ? teamA : teamB;
    const points = isTeamA ? evolutionPointsA : evolutionPointsB;
    const legendaryUnlocked = isTeamA ? legendaryUnlockedA : legendaryUnlockedB;
    const teamLabel = isTeamA ? "Team A (Player)" : "Team B (Opponent)";

    return (
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">{teamLabel}</h2>
          <div className="flex items-center gap-4">
            <div className="text-sm">
              <span className="font-semibold">Evolution Points:</span> {points}
            </div>
            {!legendaryUnlocked && (
              <button
                className="btn btn-sm"
                onClick={() => unlockLegendary(isTeamA)}
                disabled={points < LEGENDARY_COST}
              >
                Unlock Legendary ({LEGENDARY_COST} pts)
              </button>
            )}
            {legendaryUnlocked && (
              <span className="text-xs text-green-600 font-semibold">✓ Legendary Unlocked</span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {team.map((member, index) => (
            <div key={index} className="border rounded-lg p-4 bg-gray-50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold">Slot {index + 1}</span>
                {member && (
                  <button
                    className="text-xs text-red-600 hover:text-red-800"
                    onClick={() => removePokemon(isTeamA, index)}
                  >
                    Remove
                  </button>
                )}
              </div>

              {member ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <img
                      src={member.sprite || ""}
                      alt={member.currentName}
                      className="w-16 h-16 pixelated"
                    />
                    <div className="flex-1">
                      <div className="font-semibold capitalize text-sm">
                        {member.currentName}
                      </div>
                      <div className="text-xs text-gray-500 capitalize">
                        {member.category}
                      </div>
                      <div className="flex gap-1 mt-1">
                        {member.types.map(t => (
                          <TypeLogo key={t} type={t} size={16} />
                        ))}
                      </div>
                    </div>
                  </div>

                  {member.evolutionChain && member.evolutionChain.length > member.evolutionLevel && (
                    <button
                      className="btn btn-sm w-full"
                      onClick={() => evolvePokemon(isTeamA, index)}
                      disabled={points < (member.evolutionLevel === 0 ? 1 : 2)}
                    >
                      Evolve ({member.evolutionLevel === 0 ? 1 : 2} pt)
                    </button>
                  )}

                  {member.evolutionLevel > 0 && (
                    <div className="text-xs text-blue-600">
                      Evolution Level: {member.evolutionLevel}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <PokemonAutocomplete
                    id={`${isTeamA ? 'a' : 'b'}-${index}`}
                    value={isTeamA && index === currentInputA ? inputValueA : (!isTeamA && index === currentInputB ? inputValueB : "")}
                    onChange={(v) => {
                      if (isTeamA) {
                        setCurrentInputA(index);
                        setInputValueA(v);
                      } else {
                        setCurrentInputB(index);
                        setInputValueB(v);
                      }
                    }}
                    placeholder="Search Pokemon..."
                  />
                  <button
                    className="btn btn-sm w-full"
                    onClick={() => {
                      const value = isTeamA ? inputValueA : inputValueB;
                      if (value.trim()) {
                        addPokemonToTeam(value, isTeamA, index);
                      }
                    }}
                  >
                    Add Pokemon
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="page-bg" style={{ ["--bg-url" as any]: `url(${BACKGROUNDS.battle})` }}>
      <div className="page-content space-y-4">
        <div className="card p-6 mt-24">
          <h1 className="text-2xl font-bold mb-2">6v6 Team Battle</h1>
          <p className="text-sm text-gray-600 mb-4">
            Build your teams with evolution points. Each team starts with {INITIAL_EVOLUTION_POINTS} points.
            First evolution costs 1 point, second evolution costs 2 points.
            Legendary Pokemon cost {LEGENDARY_COST} points to unlock.
          </p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
        </div>

        {renderTeamBuilder(true)}
        {renderTeamBuilder(false)}

        <div className="card p-6">
          <button
            className="btn btn-primary w-full"
            onClick={startBattle}
            disabled={loading || teamA.every(m => m === null) || teamB.every(m => m === null)}
          >
            {loading ? "Starting Battle..." : "Lancer le combat"}
          </button>
        </div>

        {battleResult && (
          <div className="card p-6">
            <h2 className="text-xl font-bold mb-4">Battle Results</h2>
            
            <div className="bg-gradient-to-r from-yellow-100 to-yellow-200 border-2 border-yellow-400 rounded-lg p-4 mb-6">
              <div className="text-center text-2xl font-bold">
                Winner: {battleResult.winner === "A" ? "Team A (Player)" : "Team B (Opponent)"}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Battle Rounds</h3>
              {battleResult.rounds.map((round, i) => (
                <div key={i} className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="font-semibold">Round {round.round}</div>
                    <div className={`px-2 py-1 rounded text-sm ${
                      round.winner === "A" ? "bg-blue-100 text-blue-800" : "bg-red-100 text-red-800"
                    }`}>
                      Winner: {round.winner === "A" ? "Team A" : "Team B"}
                    </div>
                  </div>
                  <div className="mt-2 text-sm text-gray-600">
                    <span className="capitalize">{round.pokemonA}</span> vs <span className="capitalize">{round.pokemonB}</span>
                    <span className="ml-2">({round.turnsCount} turns)</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold mb-2">Team A Remaining</h4>
                <div className="space-y-2">
                  {battleResult.teamA.map((member, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <img src={member.sprite || ""} alt={member.currentName} className="w-8 h-8 pixelated" />
                      <span className="capitalize">{member.currentName}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Team B Remaining</h4>
                <div className="space-y-2">
                  {battleResult.teamB.map((member, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <img src={member.sprite || ""} alt={member.currentName} className="w-8 h-8 pixelated" />
                      <span className="capitalize">{member.currentName}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
