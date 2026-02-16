/**
 * Stats Analyzer Tool
 * 
 * Analyse les statistiques de base pour équilibrer l'équipe
 * et identifier les rôles (sweeper, tank, support, etc.)
 */

import { Pokemon } from "./TypeEffectivenessTool";

export interface StatsSummary {
  avgHp: number;
  avgAttack: number;
  avgDefense: number;
  avgSpAtk: number;
  avgSpDef: number;
  avgSpeed: number;
  avgTotal: number;
  physicalBias: number; // -1 à 1 (négatif = spécial, positif = physique)
  speedDistribution: "slow" | "balanced" | "fast";
  bulkRating: number; // 0-100
}

export interface PokemonRole {
  primary: "sweeper" | "tank" | "wallbreaker" | "support" | "pivot" | "balanced";
  isPhy: boolean; // Physique ou spécial
  speedTier: "slow" | "medium" | "fast" | "ultra-fast";
  bulk: "frail" | "moderate" | "bulky" | "wall";
}

export class StatsAnalyzerTool {
  /**
   * Extrait une stat spécifique d'un Pokémon
   */
  private getStat(pokemon: Pokemon, statName: string): number {
    return pokemon.stats?.find(s => s.name === statName)?.value || 0;
  }

  /**
   * Calcule le total des stats d'un Pokémon
   */
  getTotalStats(pokemon: Pokemon): number {
    if (!pokemon.stats) return 0;
    return pokemon.stats.reduce((sum, s) => sum + s.value, 0);
  }

  /**
   * Analyse les stats d'une équipe
   */
  analyzeTeamStats(team: Pokemon[]): StatsSummary {
    if (team.length === 0) {
      return {
        avgHp: 0,
        avgAttack: 0,
        avgDefense: 0,
        avgSpAtk: 0,
        avgSpDef: 0,
        avgSpeed: 0,
        avgTotal: 0,
        physicalBias: 0,
        speedDistribution: "balanced",
        bulkRating: 0
      };
    }

    let totalHp = 0, totalAtk = 0, totalDef = 0;
    let totalSpAtk = 0, totalSpDef = 0, totalSpeed = 0;
    let totalStats = 0;

    team.forEach(pokemon => {
      totalHp += this.getStat(pokemon, "hp");
      totalAtk += this.getStat(pokemon, "attack");
      totalDef += this.getStat(pokemon, "defense");
      totalSpAtk += this.getStat(pokemon, "special-attack");
      totalSpDef += this.getStat(pokemon, "special-defense");
      totalSpeed += this.getStat(pokemon, "speed");
      totalStats += this.getTotalStats(pokemon);
    });

    const count = team.length;
    const avgAttack = totalAtk / count;
    const avgSpAtk = totalSpAtk / count;
    const avgSpeed = totalSpeed / count;

    // Calcul du biais physique/spécial (-1 à 1)
    const physicalBias = (avgAttack - avgSpAtk) / Math.max(avgAttack, avgSpAtk, 1);

    // Distribution de vitesse
    let speedDistribution: "slow" | "balanced" | "fast" = "balanced";
    if (avgSpeed < 60) speedDistribution = "slow";
    else if (avgSpeed > 90) speedDistribution = "fast";

    // Rating de bulk (0-100)
    const avgBulk = (totalHp + totalDef + totalSpDef) / (count * 3);
    const bulkRating = Math.min(100, Math.round((avgBulk / 150) * 100));

    return {
      avgHp: totalHp / count,
      avgAttack: totalAtk / count,
      avgDefense: totalDef / count,
      avgSpAtk: totalSpAtk / count,
      avgSpDef: totalSpDef / count,
      avgSpeed: avgSpeed,
      avgTotal: totalStats / count,
      physicalBias,
      speedDistribution,
      bulkRating
    };
  }

  /**
   * Détermine le rôle d'un Pokémon basé sur ses stats
   */
  classifyPokemonRole(pokemon: Pokemon): PokemonRole {
    const hp = this.getStat(pokemon, "hp");
    const atk = this.getStat(pokemon, "attack");
    const def = this.getStat(pokemon, "defense");
    const spAtk = this.getStat(pokemon, "special-attack");
    const spDef = this.getStat(pokemon, "special-defense");
    const speed = this.getStat(pokemon, "speed");

    const totalOffense = Math.max(atk, spAtk);
    const totalDefense = (def + spDef) / 2;
    const bulk = (hp + def + spDef) / 3;

    // Détermine si physique ou spécial
    const isPhy = atk > spAtk;

    // Détermine le tier de vitesse
    let speedTier: PokemonRole["speedTier"];
    if (speed >= 110) speedTier = "ultra-fast";
    else if (speed >= 85) speedTier = "fast";
    else if (speed >= 60) speedTier = "medium";
    else speedTier = "slow";

    // Détermine le bulk
    let bulkLevel: PokemonRole["bulk"];
    if (bulk >= 90) bulkLevel = "wall";
    else if (bulk >= 75) bulkLevel = "bulky";
    else if (bulk >= 60) bulkLevel = "moderate";
    else bulkLevel = "frail";

    // Détermine le rôle principal
    let primary: PokemonRole["primary"] = "balanced";

    if (totalOffense >= 110 && speed >= 90) {
      primary = "sweeper";
    } else if (totalOffense >= 120 && speed < 70) {
      primary = "wallbreaker";
    } else if (bulk >= 85 && totalDefense >= 80) {
      primary = "tank";
    } else if (speed >= 90 && bulk >= 70) {
      primary = "pivot";
    } else if (bulk >= 75 || totalDefense >= 90) {
      primary = "support";
    }

    return {
      primary,
      isPhy,
      speedTier,
      bulk: bulkLevel
    };
  }

  /**
   * Score un Pokémon candidat basé sur l'équilibre des stats
   */
  scorePokemonStatsBalance(
    candidate: Pokemon,
    teamStats: StatsSummary
  ): { score: number; details: string[] } {
    let score = 0;
    const details: string[] = [];

    const candidateRole = this.classifyPokemonRole(candidate);
    const candidateSpeed = this.getStat(candidate, "speed");
    const candidateAtk = this.getStat(candidate, "attack");
    const candidateSpAtk = this.getStat(candidate, "special-attack");

    // Équilibrage de la vitesse
    if (teamStats.speedDistribution === "slow" && candidateSpeed >= 90) {
      score += 30;
      details.push("⚡ Ajoute de la vitesse à l'équipe");
    } else if (teamStats.speedDistribution === "fast" && candidateSpeed <= 60) {
      score += 20;
      details.push("🛡️ Ajoute du bulk/contrôle");
    }

    // Équilibrage physique/spécial
    if (teamStats.physicalBias > 0.3 && candidateSpAtk > candidateAtk) {
      score += 25;
      details.push("✨ Équilibre avec de l'attaque spéciale");
    } else if (teamStats.physicalBias < -0.3 && candidateAtk > candidateSpAtk) {
      score += 25;
      details.push("💪 Équilibre avec de l'attaque physique");
    }

    // Bonus pour bon total de stats
    const totalStats = this.getTotalStats(candidate);
    if (totalStats >= 500) {
      score += 20;
      details.push(`⭐ Excellentes stats totales (${totalStats})`);
    } else if (totalStats >= 450) {
      score += 10;
      details.push(`👍 Bonnes stats totales (${totalStats})`);
    }

    // Bonus si l'équipe manque de bulk
    if (teamStats.bulkRating < 40 && candidateRole.bulk === "wall") {
      score += 35;
      details.push("🛡️ Ajoute beaucoup de bulk");
    } else if (teamStats.bulkRating < 40 && candidateRole.bulk === "bulky") {
      score += 20;
      details.push("🛡️ Ajoute du bulk");
    }

    return { score, details };
  }

  /**
   * Identifie les manques dans l'équipe
   */
  identifyTeamGaps(teamStats: StatsSummary): string[] {
    const gaps: string[] = [];

    if (teamStats.avgSpeed < 70) {
      gaps.push("Manque de vitesse");
    }
    if (teamStats.bulkRating < 35) {
      gaps.push("Manque de bulk/défense");
    }
    if (Math.abs(teamStats.physicalBias) > 0.5) {
      gaps.push(teamStats.physicalBias > 0 ? "Trop physique" : "Trop spécial");
    }
    if (teamStats.avgTotal < 420) {
      gaps.push("Stats globales faibles");
    }

    return gaps;
  }
}
