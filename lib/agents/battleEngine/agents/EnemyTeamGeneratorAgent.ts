/**
 * EnemyTeamGeneratorAgent
 * 
 * Agent spécialisé dans la génération d'équipes adverses équilibrées.
 * Analyse l'équipe du joueur pour créer une équipe IA qui:
 * - Est compétitive mais pas injuste
 * - A une bonne couverture de types
 * - Counter certains membres de l'équipe joueur
 * - A une cohésion et synergie interne
 */

import { calculateDefensiveMultiplier } from "@/lib/typeRelations";

export interface PokemonCandidate {
  name: string;
  types: string[];
  baseStats: {
    hp: number;
    attack: number;
    defense: number;
    specialAttack: number;
    specialDefense: number;
    speed: number;
  };
  tier?: string;
}

export interface PlayerPokemonInfo {
  name: string;
  types: string[];
  baseStats?: {
    hp: number;
    attack: number;
    defense: number;
    specialAttack: number;
    specialDefense: number;
    speed: number;
  };
}

export interface TeamGenerationRequest {
  playerTeam: PlayerPokemonInfo[];
  difficulty: "easy" | "medium" | "hard" | "nightmare";
  teamSize?: number;
  excludeList?: string[];
  mustInclude?: string[];
}

export interface GeneratedTeamMember {
  name: string;
  types: string[];
  role: "sweeper" | "tank" | "support" | "wall" | "counter";
  reason: string;
  threatLevel: number; // 0-100
}

export interface TeamGenerationResult {
  team: GeneratedTeamMember[];
  teamAnalysis: {
    typesCovered: string[];
    weaknesses: string[];
    synergy: number;
    counterScore: number;
    overallThreat: number;
  };
  breakdown: string[];
}

// Pool de Pokémon par tier
const POKEMON_BY_TIER: Record<string, PokemonCandidate[]> = {
  legendary: [
    { name: "mewtwo", types: ["psychic"], baseStats: { hp: 106, attack: 110, defense: 90, specialAttack: 154, specialDefense: 90, speed: 130 } },
    { name: "rayquaza", types: ["dragon", "flying"], baseStats: { hp: 105, attack: 150, defense: 90, specialAttack: 150, specialDefense: 90, speed: 95 } },
    { name: "dialga", types: ["steel", "dragon"], baseStats: { hp: 100, attack: 120, defense: 120, specialAttack: 150, specialDefense: 100, speed: 90 } },
    { name: "palkia", types: ["water", "dragon"], baseStats: { hp: 90, attack: 120, defense: 100, specialAttack: 150, specialDefense: 120, speed: 100 } },
    { name: "giratina", types: ["ghost", "dragon"], baseStats: { hp: 150, attack: 100, defense: 120, specialAttack: 100, specialDefense: 120, speed: 90 } },
    { name: "arceus", types: ["normal"], baseStats: { hp: 120, attack: 120, defense: 120, specialAttack: 120, specialDefense: 120, speed: 120 } },
    { name: "zekrom", types: ["dragon", "electric"], baseStats: { hp: 100, attack: 150, defense: 120, specialAttack: 120, specialDefense: 100, speed: 90 } },
    { name: "reshiram", types: ["dragon", "fire"], baseStats: { hp: 100, attack: 120, defense: 100, specialAttack: 150, specialDefense: 120, speed: 90 } },
    { name: "kyurem", types: ["dragon", "ice"], baseStats: { hp: 125, attack: 130, defense: 90, specialAttack: 130, specialDefense: 90, speed: 95 } },
    { name: "xerneas", types: ["fairy"], baseStats: { hp: 126, attack: 131, defense: 95, specialAttack: 131, specialDefense: 98, speed: 99 } },
  ],
  pseudo: [
    { name: "dragonite", types: ["dragon", "flying"], baseStats: { hp: 91, attack: 134, defense: 95, specialAttack: 100, specialDefense: 100, speed: 80 } },
    { name: "tyranitar", types: ["rock", "dark"], baseStats: { hp: 100, attack: 134, defense: 110, specialAttack: 95, specialDefense: 100, speed: 61 } },
    { name: "salamence", types: ["dragon", "flying"], baseStats: { hp: 95, attack: 135, defense: 80, specialAttack: 110, specialDefense: 80, speed: 100 } },
    { name: "metagross", types: ["steel", "psychic"], baseStats: { hp: 80, attack: 135, defense: 130, specialAttack: 95, specialDefense: 90, speed: 70 } },
    { name: "garchomp", types: ["dragon", "ground"], baseStats: { hp: 108, attack: 130, defense: 95, specialAttack: 80, specialDefense: 85, speed: 102 } },
    { name: "hydreigon", types: ["dark", "dragon"], baseStats: { hp: 92, attack: 105, defense: 90, specialAttack: 125, specialDefense: 90, speed: 98 } },
    { name: "goodra", types: ["dragon"], baseStats: { hp: 90, attack: 100, defense: 70, specialAttack: 110, specialDefense: 150, speed: 80 } },
    { name: "kommo-o", types: ["dragon", "fighting"], baseStats: { hp: 75, attack: 110, defense: 125, specialAttack: 100, specialDefense: 105, speed: 85 } },
    { name: "dragapult", types: ["dragon", "ghost"], baseStats: { hp: 88, attack: 120, defense: 75, specialAttack: 100, specialDefense: 75, speed: 142 } },
  ],
  strong: [
    { name: "gengar", types: ["ghost", "poison"], baseStats: { hp: 60, attack: 65, defense: 60, specialAttack: 130, specialDefense: 75, speed: 110 } },
    { name: "alakazam", types: ["psychic"], baseStats: { hp: 55, attack: 50, defense: 45, specialAttack: 135, specialDefense: 95, speed: 120 } },
    { name: "gyarados", types: ["water", "flying"], baseStats: { hp: 95, attack: 125, defense: 79, specialAttack: 60, specialDefense: 100, speed: 81 } },
    { name: "lucario", types: ["fighting", "steel"], baseStats: { hp: 70, attack: 110, defense: 70, specialAttack: 115, specialDefense: 70, speed: 90 } },
    { name: "volcarona", types: ["bug", "fire"], baseStats: { hp: 85, attack: 60, defense: 65, specialAttack: 135, specialDefense: 105, speed: 100 } },
    { name: "excadrill", types: ["ground", "steel"], baseStats: { hp: 110, attack: 135, defense: 60, specialAttack: 50, specialDefense: 65, speed: 88 } },
    { name: "togekiss", types: ["fairy", "flying"], baseStats: { hp: 85, attack: 50, defense: 95, specialAttack: 120, specialDefense: 115, speed: 80 } },
    { name: "ferrothorn", types: ["grass", "steel"], baseStats: { hp: 74, attack: 94, defense: 131, specialAttack: 54, specialDefense: 116, speed: 20 } },
    { name: "aegislash", types: ["steel", "ghost"], baseStats: { hp: 60, attack: 50, defense: 150, specialAttack: 50, specialDefense: 150, speed: 60 } },
    { name: "mimikyu", types: ["ghost", "fairy"], baseStats: { hp: 55, attack: 90, defense: 80, specialAttack: 50, specialDefense: 105, speed: 96 } },
    { name: "toxapex", types: ["poison", "water"], baseStats: { hp: 50, attack: 63, defense: 152, specialAttack: 53, specialDefense: 142, speed: 35 } },
  ],
  medium: [
    { name: "arcanine", types: ["fire"], baseStats: { hp: 90, attack: 110, defense: 80, specialAttack: 100, specialDefense: 80, speed: 95 } },
    { name: "machamp", types: ["fighting"], baseStats: { hp: 90, attack: 130, defense: 80, specialAttack: 65, specialDefense: 85, speed: 55 } },
    { name: "lapras", types: ["water", "ice"], baseStats: { hp: 130, attack: 85, defense: 80, specialAttack: 85, specialDefense: 95, speed: 60 } },
    { name: "snorlax", types: ["normal"], baseStats: { hp: 160, attack: 110, defense: 65, specialAttack: 65, specialDefense: 110, speed: 30 } },
    { name: "starmie", types: ["water", "psychic"], baseStats: { hp: 60, attack: 75, defense: 85, specialAttack: 100, specialDefense: 85, speed: 115 } },
    { name: "weavile", types: ["dark", "ice"], baseStats: { hp: 70, attack: 120, defense: 65, specialAttack: 45, specialDefense: 85, speed: 125 } },
    { name: "electivire", types: ["electric"], baseStats: { hp: 75, attack: 123, defense: 67, specialAttack: 95, specialDefense: 85, speed: 95 } },
    { name: "magnezone", types: ["electric", "steel"], baseStats: { hp: 70, attack: 70, defense: 115, specialAttack: 130, specialDefense: 90, speed: 60 } },
    { name: "roserade", types: ["grass", "poison"], baseStats: { hp: 60, attack: 70, defense: 65, specialAttack: 125, specialDefense: 105, speed: 90 } },
    { name: "kingdra", types: ["water", "dragon"], baseStats: { hp: 75, attack: 95, defense: 95, specialAttack: 95, specialDefense: 95, speed: 85 } },
    { name: "scizor", types: ["bug", "steel"], baseStats: { hp: 70, attack: 130, defense: 100, specialAttack: 55, specialDefense: 80, speed: 65 } },
  ],
  starter: [
    { name: "charizard", types: ["fire", "flying"], baseStats: { hp: 78, attack: 84, defense: 78, specialAttack: 109, specialDefense: 85, speed: 100 } },
    { name: "blastoise", types: ["water"], baseStats: { hp: 79, attack: 83, defense: 100, specialAttack: 85, specialDefense: 105, speed: 78 } },
    { name: "venusaur", types: ["grass", "poison"], baseStats: { hp: 80, attack: 82, defense: 83, specialAttack: 100, specialDefense: 100, speed: 80 } },
    { name: "typhlosion", types: ["fire"], baseStats: { hp: 78, attack: 84, defense: 78, specialAttack: 109, specialDefense: 85, speed: 100 } },
    { name: "feraligatr", types: ["water"], baseStats: { hp: 85, attack: 105, defense: 100, specialAttack: 79, specialDefense: 83, speed: 78 } },
    { name: "sceptile", types: ["grass"], baseStats: { hp: 70, attack: 85, defense: 65, specialAttack: 105, specialDefense: 85, speed: 120 } },
    { name: "infernape", types: ["fire", "fighting"], baseStats: { hp: 76, attack: 104, defense: 71, specialAttack: 104, specialDefense: 71, speed: 108 } },
    { name: "empoleon", types: ["water", "steel"], baseStats: { hp: 84, attack: 86, defense: 88, specialAttack: 111, specialDefense: 101, speed: 60 } },
    { name: "greninja", types: ["water", "dark"], baseStats: { hp: 72, attack: 95, defense: 67, specialAttack: 103, specialDefense: 71, speed: 122 } },
    { name: "decidueye", types: ["grass", "ghost"], baseStats: { hp: 78, attack: 107, defense: 75, specialAttack: 100, specialDefense: 100, speed: 70 } },
  ],
  weak: [
    { name: "pikachu", types: ["electric"], baseStats: { hp: 35, attack: 55, defense: 40, specialAttack: 50, specialDefense: 50, speed: 90 } },
    { name: "eevee", types: ["normal"], baseStats: { hp: 55, attack: 55, defense: 50, specialAttack: 45, specialDefense: 65, speed: 55 } },
    { name: "butterfree", types: ["bug", "flying"], baseStats: { hp: 60, attack: 45, defense: 50, specialAttack: 90, specialDefense: 80, speed: 70 } },
    { name: "persian", types: ["normal"], baseStats: { hp: 65, attack: 70, defense: 60, specialAttack: 65, specialDefense: 65, speed: 115 } },
    { name: "ninetales", types: ["fire"], baseStats: { hp: 73, attack: 76, defense: 75, specialAttack: 81, specialDefense: 100, speed: 100 } },
    { name: "golduck", types: ["water"], baseStats: { hp: 80, attack: 82, defense: 78, specialAttack: 95, specialDefense: 80, speed: 85 } },
    { name: "rapidash", types: ["fire"], baseStats: { hp: 65, attack: 100, defense: 70, specialAttack: 80, specialDefense: 80, speed: 105 } },
    { name: "dewgong", types: ["water", "ice"], baseStats: { hp: 90, attack: 70, defense: 80, specialAttack: 70, specialDefense: 95, speed: 70 } },
    { name: "jolteon", types: ["electric"], baseStats: { hp: 65, attack: 65, defense: 60, specialAttack: 110, specialDefense: 95, speed: 130 } },
    { name: "flareon", types: ["fire"], baseStats: { hp: 65, attack: 130, defense: 60, specialAttack: 95, specialDefense: 110, speed: 65 } },
  ]
};

export class EnemyTeamGeneratorAgent {
  private name = "EnemyTeamGeneratorAgent";

  /**
   * Génère une équipe adverse
   */
  generateTeam(request: TeamGenerationRequest): TeamGenerationResult {
    const breakdown: string[] = [];
    breakdown.push(`\n🤖 ${this.name} - Génération d'équipe adverse`);
    breakdown.push(`📊 Difficulté: ${request.difficulty}`);
    breakdown.push(`👥 Équipe joueur: ${request.playerTeam.map(p => p.name).join(", ")}`);

    const teamSize = request.teamSize || 6;
    const team: GeneratedTeamMember[] = [];

    // Déterminer le pool selon la difficulté
    const tierWeights = this.getTierWeights(request.difficulty);
    breakdown.push(`\n📋 Tiers utilisés: ${Object.entries(tierWeights).filter(([_, w]) => w > 0).map(([t, w]) => `${t}(${w}%)`).join(", ")}`);

    // Analyser les faiblesses de l'équipe joueur
    const playerWeaknesses = this.analyzePlayerWeaknesses(request.playerTeam);
    breakdown.push(`\n🎯 Faiblesses joueur détectées:`);
    playerWeaknesses.forEach(w => breakdown.push(`   - ${w.type}: ${w.count} Pokémon faibles`));

    // Sélectionner les Pokémon
    const selectedPokemon = new Set<string>(request.excludeList || []);
    
    // Inclure les must-have
    if (request.mustInclude) {
      for (const name of request.mustInclude) {
        const candidate = this.findPokemon(name);
        if (candidate && team.length < teamSize) {
          team.push({
            name: candidate.name,
            types: candidate.types,
            role: this.determineRole(candidate),
            reason: "Requis par la configuration",
            threatLevel: this.calculateThreatLevel(candidate, request.playerTeam)
          });
          selectedPokemon.add(candidate.name);
        }
      }
    }

    // 1. Ajouter des counters aux Pokémon joueur
    const countersNeeded = Math.min(2, teamSize - team.length);
    breakdown.push(`\n🎯 Sélection de ${countersNeeded} counters...`);
    
    for (let i = 0; i < countersNeeded && team.length < teamSize; i++) {
      const counter = this.selectCounter(request.playerTeam, selectedPokemon, tierWeights);
      if (counter) {
        team.push(counter);
        selectedPokemon.add(counter.name);
        breakdown.push(`   + ${counter.name} (counter: ${counter.reason})`);
      }
    }

    // 2. Remplir avec des Pokémon équilibrés
    breakdown.push(`\n⚖️ Sélection d'équilibrage...`);
    
    while (team.length < teamSize) {
      const candidate = this.selectBalancedPokemon(team, selectedPokemon, tierWeights, request.playerTeam);
      if (candidate) {
        team.push(candidate);
        selectedPokemon.add(candidate.name);
        breakdown.push(`   + ${candidate.name} (${candidate.role}: ${candidate.reason})`);
      } else {
        break;
      }
    }

    // Analyser l'équipe générée
    const teamAnalysis = this.analyzeGeneratedTeam(team, request.playerTeam);

    breakdown.push(`\n📊 Analyse de l'équipe générée:`);
    breakdown.push(`   Types couverts: ${teamAnalysis.typesCovered.join(", ")}`);
    breakdown.push(`   Faiblesses: ${teamAnalysis.weaknesses.join(", ")}`);
    breakdown.push(`   Synergie: ${teamAnalysis.synergy}/100`);
    breakdown.push(`   Score counter: ${teamAnalysis.counterScore}/100`);
    breakdown.push(`   Menace globale: ${teamAnalysis.overallThreat}/100`);

    return {
      team,
      teamAnalysis,
      breakdown
    };
  }

  /**
   * Détermine les poids des tiers selon la difficulté
   */
  private getTierWeights(difficulty: string): Record<string, number> {
    switch (difficulty) {
      case "easy":
        return { weak: 60, starter: 30, medium: 10, strong: 0, pseudo: 0, legendary: 0 };
      case "medium":
        return { weak: 10, starter: 40, medium: 35, strong: 15, pseudo: 0, legendary: 0 };
      case "hard":
        return { weak: 0, starter: 15, medium: 25, strong: 40, pseudo: 20, legendary: 0 };
      case "nightmare":
        return { weak: 0, starter: 0, medium: 10, strong: 30, pseudo: 35, legendary: 25 };
      default:
        return { weak: 20, starter: 30, medium: 30, strong: 20, pseudo: 0, legendary: 0 };
    }
  }

  /**
   * Analyse les faiblesses de l'équipe joueur
   */
  private analyzePlayerWeaknesses(team: PlayerPokemonInfo[]): Array<{ type: string; count: number }> {
    const weaknessCount = new Map<string, number>();
    const allTypes = ["fire", "water", "grass", "electric", "ice", "fighting", "poison", "ground", "flying", "psychic", "bug", "rock", "ghost", "dragon", "dark", "steel", "fairy", "normal"];

    for (const pokemon of team) {
      for (const attackType of allTypes) {
        const mult = calculateDefensiveMultiplier(attackType, pokemon.types);
        if (mult >= 2) {
          weaknessCount.set(attackType, (weaknessCount.get(attackType) || 0) + 1);
        }
      }
    }

    return Array.from(weaknessCount.entries())
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count);
  }

  /**
   * Sélectionne un counter pour l'équipe joueur
   */
  private selectCounter(
    playerTeam: PlayerPokemonInfo[],
    exclude: Set<string>,
    tierWeights: Record<string, number>
  ): GeneratedTeamMember | null {
    const candidates: Array<{ pokemon: PokemonCandidate; score: number; targetName: string }> = [];

    // Trouver les meilleurs counters
    for (const [tier, weight] of Object.entries(tierWeights)) {
      if (weight === 0) continue;
      
      const pool = POKEMON_BY_TIER[tier] || [];
      for (const candidate of pool) {
        if (exclude.has(candidate.name)) continue;

        for (const playerPokemon of playerTeam) {
          let counterScore = 0;
          
          // Score basé sur l'efficacité de type
          const attackMult = this.getMaxTypeMult(candidate.types, playerPokemon.types);
          const defenseMult = this.getMaxTypeMult(playerPokemon.types, candidate.types);
          
          if (attackMult >= 2) counterScore += attackMult * 25;
          if (defenseMult <= 0.5) counterScore += 20;
          if (defenseMult === 0) counterScore += 40; // Immunité

          // Bonus tier
          counterScore *= (weight / 100) + 0.5;

          if (counterScore > 0) {
            candidates.push({
              pokemon: candidate,
              score: counterScore,
              targetName: playerPokemon.name
            });
          }
        }
      }
    }

    if (candidates.length === 0) return null;

    // Sélectionner parmi les meilleurs
    candidates.sort((a, b) => b.score - a.score);
    const selected = candidates[Math.floor(Math.random() * Math.min(3, candidates.length))];

    return {
      name: selected.pokemon.name,
      types: selected.pokemon.types,
      role: this.determineRole(selected.pokemon),
      reason: `Counter ${selected.targetName} (x${this.getMaxTypeMult(selected.pokemon.types, playerTeam.find(p => p.name === selected.targetName)?.types || [])})`,
      threatLevel: this.calculateThreatLevel(selected.pokemon, playerTeam)
    };
  }

  /**
   * Sélectionne un Pokémon équilibré
   */
  private selectBalancedPokemon(
    currentTeam: GeneratedTeamMember[],
    exclude: Set<string>,
    tierWeights: Record<string, number>,
    playerTeam: PlayerPokemonInfo[]
  ): GeneratedTeamMember | null {
    // Déterminer les types manquants
    const coveredTypes = new Set<string>();
    currentTeam.forEach(p => p.types.forEach(t => coveredTypes.add(t)));

    const candidates: Array<{ pokemon: PokemonCandidate; score: number; reason: string }> = [];

    for (const [tier, weight] of Object.entries(tierWeights)) {
      if (weight === 0) continue;

      const pool = POKEMON_BY_TIER[tier] || [];
      for (const candidate of pool) {
        if (exclude.has(candidate.name)) continue;

        let score = weight;
        let reason = "Équilibrage";

        // Bonus pour types non couverts
        const newTypes = candidate.types.filter(t => !coveredTypes.has(t));
        if (newTypes.length > 0) {
          score += newTypes.length * 20;
          reason = `Ajoute: ${newTypes.join(", ")}`;
        }

        // Bonus pour stats variées
        const role = this.determineRole(candidate);
        const existingRoles = new Set(currentTeam.map(p => p.role));
        if (!existingRoles.has(role)) {
          score += 15;
          reason += ` (nouveau rôle: ${role})`;
        }

        // Petit bonus aléatoire pour variété
        score += Math.random() * 10;

        candidates.push({ pokemon: candidate, score, reason });
      }
    }

    if (candidates.length === 0) return null;

    candidates.sort((a, b) => b.score - a.score);
    const selected = candidates[Math.floor(Math.random() * Math.min(5, candidates.length))];

    return {
      name: selected.pokemon.name,
      types: selected.pokemon.types,
      role: this.determineRole(selected.pokemon),
      reason: selected.reason,
      threatLevel: this.calculateThreatLevel(selected.pokemon, playerTeam)
    };
  }

  /**
   * Détermine le rôle d'un Pokémon
   */
  private determineRole(pokemon: PokemonCandidate): "sweeper" | "tank" | "support" | "wall" | "counter" {
    const { hp, attack, defense, specialAttack, specialDefense, speed } = pokemon.baseStats;
    const offensive = attack + specialAttack;
    const defensive = defense + specialDefense + hp;

    if (speed > 100 && offensive > defensive) return "sweeper";
    if (defensive > offensive * 1.3) {
      if (hp > 90) return "tank";
      return "wall";
    }
    return "counter";
  }

  /**
   * Calcule le niveau de menace
   */
  private calculateThreatLevel(pokemon: PokemonCandidate, playerTeam: PlayerPokemonInfo[]): number {
    const { attack, specialAttack, speed } = pokemon.baseStats;
    
    let threat = 0;
    
    // Base sur les stats offensives
    threat += (attack + specialAttack) / 3;
    threat += speed / 5;

    // Bonus si super efficace contre plusieurs Pokémon joueur
    let superEffectiveCount = 0;
    for (const player of playerTeam) {
      const mult = this.getMaxTypeMult(pokemon.types, player.types);
      if (mult >= 2) superEffectiveCount++;
    }
    threat += superEffectiveCount * 10;

    return Math.min(100, Math.round(threat));
  }

  /**
   * Analyse l'équipe générée
   */
  private analyzeGeneratedTeam(
    team: GeneratedTeamMember[],
    playerTeam: PlayerPokemonInfo[]
  ): {
    typesCovered: string[];
    weaknesses: string[];
    synergy: number;
    counterScore: number;
    overallThreat: number;
  } {
    const typesCovered = [...new Set(team.flatMap(p => p.types))];
    
    // Calculer les faiblesses
    const weaknessCount = new Map<string, number>();
    const allTypes = ["fire", "water", "grass", "electric", "ice", "fighting", "poison", "ground", "flying", "psychic", "bug", "rock", "ghost", "dragon", "dark", "steel", "fairy"];
    
    for (const member of team) {
      for (const attackType of allTypes) {
        const mult = calculateDefensiveMultiplier(attackType, member.types);
        if (mult >= 2) {
          weaknessCount.set(attackType, (weaknessCount.get(attackType) || 0) + 1);
        }
      }
    }

    const weaknesses = Array.from(weaknessCount.entries())
      .filter(([_, count]) => count >= 2)
      .map(([type]) => type);

    // Synergie = diversité des types - faiblesses communes
    const synergy = Math.min(100, typesCovered.length * 8 - weaknesses.length * 10 + 50);

    // Score counter = combien de counters on a
    const counters = team.filter(p => p.role === "counter" || p.reason.includes("Counter"));
    const counterScore = Math.min(100, counters.length * 30 + 10);

    // Menace globale
    const overallThreat = Math.round(team.reduce((sum, p) => sum + p.threatLevel, 0) / team.length);

    return {
      typesCovered,
      weaknesses,
      synergy: Math.max(0, synergy),
      counterScore,
      overallThreat
    };
  }

  /**
   * Trouve un Pokémon par nom
   */
  private findPokemon(name: string): PokemonCandidate | null {
    for (const pool of Object.values(POKEMON_BY_TIER)) {
      const found = pool.find(p => p.name.toLowerCase() === name.toLowerCase());
      if (found) return found;
    }
    return null;
  }

  /**
   * Calcule le multiplicateur de type maximum
   */
  private getMaxTypeMult(attackerTypes: string[], defenderTypes: string[]): number {
    let maxMult = 1;
    for (const attackType of attackerTypes) {
      const mult = calculateDefensiveMultiplier(attackType, defenderTypes);
      maxMult = Math.max(maxMult, mult);
    }
    return maxMult;
  }
}
