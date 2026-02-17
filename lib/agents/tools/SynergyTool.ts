/**
 * Synergy Tool
 * 
 * Outil pour analyser les synergies entre Pokémon d'une équipe.
 * - Cores offensives/défensives
 * - Compatibilité météo
 * - Complémentarité des types
 */

import {
  Pokemon,
  getTypeEffectiveness,
  getStat,
  classifyRole,
  ALL_TYPES
} from "../shared/types";

// ============================================================================
// TYPES
// ============================================================================

export interface SynergyResult {
  score: number; // 0-100
  cores: CoreSynergy[];
  weatherSynergy: WeatherSynergy | null;
  complementaryPairs: PokemonPair[];
  conflicts: SynergyConflict[];
}

export interface CoreSynergy {
  type: "offensive" | "defensive" | "pivot";
  members: Pokemon[];
  strength: number;
  description: string;
}

export interface WeatherSynergy {
  weather: "sun" | "rain" | "sand" | "hail" | "none";
  beneficiaries: Pokemon[];
  setters: Pokemon[];
  strength: number;
}

export interface PokemonPair {
  pokemon1: Pokemon;
  pokemon2: Pokemon;
  synergyType: string;
  score: number;
}

export interface SynergyConflict {
  members: Pokemon[];
  issue: string;
  severity: "low" | "medium" | "high";
}

// Types associés aux météos
const WEATHER_TYPES: Record<string, { weather: "sun" | "rain" | "sand" | "hail", beneficiaries: string[] }> = {
  fire: { weather: "sun", beneficiaries: ["fire", "grass"] },
  water: { weather: "rain", beneficiaries: ["water", "electric"] },
  rock: { weather: "sand", beneficiaries: ["rock", "ground", "steel"] },
  ice: { weather: "hail", beneficiaries: ["ice"] }
};

// ============================================================================
// SYNERGY TOOL
// ============================================================================

export class SynergyTool {
  /**
   * Analyse complète des synergies d'une équipe
   */
  analyzeTeamSynergy(team: Pokemon[]): SynergyResult {
    const cores = this.findCores(team);
    const weatherSynergy = this.analyzeWeatherSynergy(team);
    const complementaryPairs = this.findComplementaryPairs(team);
    const conflicts = this.findConflicts(team);
    
    // Calculer le score global
    let score = 50; // Base
    score += cores.reduce((sum, c) => sum + c.strength, 0) * 5;
    score += complementaryPairs.length * 3;
    score -= conflicts.filter(c => c.severity === "high").length * 10;
    score -= conflicts.filter(c => c.severity === "medium").length * 5;
    if (weatherSynergy && weatherSynergy.strength > 50) {
      score += weatherSynergy.strength / 5;
    }
    score = Math.max(0, Math.min(100, score));
    
    return {
      score,
      cores,
      weatherSynergy,
      complementaryPairs,
      conflicts
    };
  }

  /**
   * Trouve les cores (groupes synergiques) dans l'équipe
   */
  findCores(team: Pokemon[]): CoreSynergy[] {
    const cores: CoreSynergy[] = [];
    
    // Chercher des cores offensives (types complémentaires en attaque)
    for (let i = 0; i < team.length; i++) {
      for (let j = i + 1; j < team.length; j++) {
        const p1 = team[i];
        const p2 = team[j];
        
        // Core offensive: types d'attaque complémentaires
        const offensiveScore = this.calculateOffensiveComplementarity(p1, p2);
        if (offensiveScore >= 70) {
          cores.push({
            type: "offensive",
            members: [p1, p2],
            strength: offensiveScore / 100,
            description: `${p1.name} + ${p2.name}: couverture offensive complémentaire`
          });
        }
        
        // Core défensive: se protègent mutuellement
        const defensiveScore = this.calculateDefensiveComplementarity(p1, p2);
        if (defensiveScore >= 70) {
          cores.push({
            type: "defensive",
            members: [p1, p2],
            strength: defensiveScore / 100,
            description: `${p1.name} + ${p2.name}: protection mutuelle`
          });
        }
      }
    }
    
    return cores.slice(0, 5); // Top 5 cores
  }

  /**
   * Calcule la complémentarité offensive entre deux Pokémon
   */
  private calculateOffensiveComplementarity(p1: Pokemon, p2: Pokemon): number {
    let score = 0;
    const coveredBy1 = new Set<string>();
    const coveredBy2 = new Set<string>();
    
    for (const type of ALL_TYPES) {
      for (const attackType of p1.types) {
        if (getTypeEffectiveness(attackType, [type]) > 1) {
          coveredBy1.add(type);
        }
      }
      for (const attackType of p2.types) {
        if (getTypeEffectiveness(attackType, [type]) > 1) {
          coveredBy2.add(type);
        }
      }
    }
    
    // Types couverts uniquement par l'un ou l'autre
    const uniqueTo1 = [...coveredBy1].filter(t => !coveredBy2.has(t));
    const uniqueTo2 = [...coveredBy2].filter(t => !coveredBy1.has(t));
    
    score = (uniqueTo1.length + uniqueTo2.length) * 5;
    
    return Math.min(100, score);
  }

  /**
   * Calcule la complémentarité défensive entre deux Pokémon
   */
  private calculateDefensiveComplementarity(p1: Pokemon, p2: Pokemon): number {
    let score = 50;
    
    // P2 résiste aux faiblesses de P1
    for (const type of ALL_TYPES) {
      const effOnP1 = getTypeEffectiveness(type, p1.types);
      const effOnP2 = getTypeEffectiveness(type, p2.types);
      
      if (effOnP1 > 1 && effOnP2 < 1) {
        score += 10; // P2 aide contre une faiblesse de P1
      }
      if (effOnP2 > 1 && effOnP1 < 1) {
        score += 10; // P1 aide contre une faiblesse de P2
      }
    }
    
    return Math.min(100, score);
  }

  /**
   * Analyse la synergie météo
   */
  analyzeWeatherSynergy(team: Pokemon[]): WeatherSynergy | null {
    const weatherCounts: Record<string, { setters: Pokemon[], beneficiaries: Pokemon[] }> = {
      sun: { setters: [], beneficiaries: [] },
      rain: { setters: [], beneficiaries: [] },
      sand: { setters: [], beneficiaries: [] },
      hail: { setters: [], beneficiaries: [] }
    };
    
    for (const pokemon of team) {
      for (const type of pokemon.types) {
        if (type === "fire") {
          weatherCounts.sun.setters.push(pokemon);
        } else if (type === "water") {
          weatherCounts.rain.setters.push(pokemon);
        } else if (type === "rock") {
          weatherCounts.sand.setters.push(pokemon);
        } else if (type === "ice") {
          weatherCounts.hail.setters.push(pokemon);
        }
        
        // Bénéficiaires
        if (type === "fire" || type === "grass") {
          weatherCounts.sun.beneficiaries.push(pokemon);
        }
        if (type === "water" || type === "electric") {
          weatherCounts.rain.beneficiaries.push(pokemon);
        }
        if (type === "rock" || type === "ground" || type === "steel") {
          weatherCounts.sand.beneficiaries.push(pokemon);
        }
        if (type === "ice") {
          weatherCounts.hail.beneficiaries.push(pokemon);
        }
      }
    }
    
    // Trouver la météo dominante
    let bestWeather: "sun" | "rain" | "sand" | "hail" | null = null;
    let bestStrength = 0;
    
    for (const [weather, data] of Object.entries(weatherCounts)) {
      const strength = data.setters.length * 20 + data.beneficiaries.length * 15;
      if (strength > bestStrength && data.setters.length > 0) {
        bestStrength = strength;
        bestWeather = weather as "sun" | "rain" | "sand" | "hail";
      }
    }
    
    if (!bestWeather || bestStrength < 30) return null;
    
    return {
      weather: bestWeather,
      setters: weatherCounts[bestWeather].setters,
      beneficiaries: weatherCounts[bestWeather].beneficiaries,
      strength: Math.min(100, bestStrength)
    };
  }

  /**
   * Trouve les paires complémentaires
   */
  findComplementaryPairs(team: Pokemon[]): PokemonPair[] {
    const pairs: PokemonPair[] = [];
    
    for (let i = 0; i < team.length; i++) {
      for (let j = i + 1; j < team.length; j++) {
        const p1 = team[i];
        const p2 = team[j];
        
        const defensiveScore = this.calculateDefensiveComplementarity(p1, p2);
        if (defensiveScore >= 60) {
          pairs.push({
            pokemon1: p1,
            pokemon2: p2,
            synergyType: "defensive",
            score: defensiveScore
          });
        }
      }
    }
    
    return pairs.sort((a, b) => b.score - a.score).slice(0, 5);
  }

  /**
   * Trouve les conflits dans l'équipe
   */
  findConflicts(team: Pokemon[]): SynergyConflict[] {
    const conflicts: SynergyConflict[] = [];
    
    // Même faiblesse partagée par trop de Pokémon
    for (const type of ALL_TYPES) {
      const weakTo = team.filter(p => getTypeEffectiveness(type, p.types) > 1);
      if (weakTo.length >= 3) {
        conflicts.push({
          members: weakTo,
          issue: `${weakTo.length} Pokémon faibles à ${type}`,
          severity: weakTo.length >= 4 ? "high" : "medium"
        });
      }
    }
    
    // Trop de Pokémon du même type
    const typeCounts: Record<string, Pokemon[]> = {};
    for (const pokemon of team) {
      for (const type of pokemon.types) {
        if (!typeCounts[type]) typeCounts[type] = [];
        typeCounts[type].push(pokemon);
      }
    }
    
    for (const [type, pokemons] of Object.entries(typeCounts)) {
      if (pokemons.length >= 3) {
        conflicts.push({
          members: pokemons,
          issue: `Trop de type ${type} (${pokemons.length})`,
          severity: "medium"
        });
      }
    }
    
    return conflicts;
  }

  /**
   * Évalue la synergie d'un candidat avec l'équipe
   */
  evaluateCandidateSynergy(team: Pokemon[], candidate: Pokemon): number {
    let score = 50;
    
    for (const member of team) {
      // Bonus pour complémentarité défensive
      const defensiveComp = this.calculateDefensiveComplementarity(member, candidate);
      score += (defensiveComp - 50) / 10;
      
      // Bonus pour complémentarité offensive
      const offensiveComp = this.calculateOffensiveComplementarity(member, candidate);
      score += (offensiveComp - 50) / 10;
    }
    
    return Math.max(0, Math.min(100, score));
  }
}

export default SynergyTool;
