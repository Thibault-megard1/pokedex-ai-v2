/**
 * ============================================================================
 * STATS ANALYZER TOOL - Tool d'analyse des statistiques
 * ============================================================================
 * 
 * OBJECTIF:
 * Ce tool analyse les statistiques de base (base stats) des Pokémon pour:
 * - Identifier les GAPS dans l'équipe (manque de vitesse, de bulk, etc.)
 * - Classifier les ROLES (Sweeper, Tank, Support, etc.)
 * - Équilibrer l'équipe (mix de offensif et défensif)
 * - Déterminer le BIAIS physique vs spécial
 * 
 * ============================================================================
 * LES 6 STATISTIQUES POKÉMON
 * ============================================================================
 * 
 * 1. **HP** (Hit Points / Points de Vie)
 *    - Détermine combien de dégâts le Pokémon peut encaisser
 *    - Range typique: 20-255
 *    - Exemples:
 *      * Blissey: 255 HP (le plus haut!)
 *      * Shedinja: 1 HP (mais ability Wonder Guard = quasi-invincible)
 *      * Moyenne: ~70-80 HP
 * 
 * 2. **ATTACK** (Attaque Physique)
 *    - Puissance des attaques PHYSIQUES (contact direct)
 *    - Moves concernés: Tackle, Earthquake, Close Combat, etc.
 *    - Exemples:
 *      * Mega Mewtwo X: 190 Attack
 *      * Shuckle: 10 Attack (le plus faible)
 * 
 * 3. **DEFENSE** (Défense Physique)
 *    - Résistance aux attaques physiques
 *    - Exemples:
 *      * Shuckle: 230 Defense (le plus haut!)
 *      * Chansey: 5 Defense
 * 
 * 4. **SPECIAL ATTACK** (Attaque Spéciale)
 *    - Puissance des attaques SPÉCIALES (à distance, énergie)
 *    - Moves: Flamethrower, Thunderbolt, Psychic, etc.
 *    - Exemples:
 *      * Mega Mewtwo Y: 194 SpA
 *      * Clefable: 95 SpA (décent)
 * 
 * 5. **SPECIAL DEFENSE** (Défense Spéciale)
 *    - Résistance aux attaques spéciales
 *    - Exemples:
 *      * Shuckle: 230 SpD
 *      * Blissey: 135 SpD (mur spécial parfait)
 * 
 * 6. **SPEED** (Vitesse)
 *    - Détermine qui attaque en premier
 *    - CRITIQUE en compétitif (attaquer en premier = souvent gagner)
 *    - Exemples:
 *      * Deoxys-Speed: 180 Speed (le plus rapide)
 *      * Shuckle: 5 Speed (le plus lent)
 *      * Speed Tiers compétitifs:
 *        - Slow: < 60 (Ferrothorn, Slowbro)
 *        - Medium: 60-90 (Tyranitar, Clefable)
 *        - Fast: 90-110 (Garchomp, Latios)
 *        - Ultra-Fast: > 110 (Dragapult, Weavile)
 * 
 * **BASE STAT TOTAL (BST):**
 * - Somme des 6 stats
 * - Legendaries: 580-680 BST typique
 * - Standards: 450-550 BST
 * - Pseudo-legendaries: 600 BST (Dragonite, Tyranitar, Garchomp, etc.)
 * 
 * ============================================================================
 * CLASSIFICATION DES RÔLES
 * ============================================================================
 * 
 * Le tool classifie automatiquement chaque Pokémon dans un rôle:
 * 
 * 1. **SWEEPER** (Balayeur Offensif)
 *    - Haute attaque (Atk OU SpA > 110) + Vitesse élevée (Speed > 90)
 *    - Mission: KO plusieurs Pokémon adverses rapidement
 *    - Exemples:
 *      * Garchomp: 130 Atk, 102 Speed (Physical Sweeper)
 *      * Alakazam: 135 SpA, 120 Speed (Special Sweeper)
 *    - Stratégie: Setup (Swords Dance/Nasty Plot) puis balayer
 * 
 * 2. **TANK / WALL** (Mur Défensif)
 *    - HP + Défenses élevés (HP > 90, Def/SpD > 100)
 *    - Vitesse généralement basse
 *    - Mission: Encaisser les coups, staller, infliger status
 *    - Types:
 *      * Physical Wall: Def élevé (Skarmory, Ferrothorn)
 *      * Special Wall: SpD élevé (Blissey, Chansey)
 *      * Mixed Wall: Les deux (Toxapex, Cresselia)
 *    - Moves typiques: Toxic, Protect, Recover, Roost
 * 
 * 3. **WALLBREAKER** (Brise-Mur)
 *    - Attaque EXTRÊMEMENT élevée (> 130) mais vitesse moyenne
 *    - Mission: Détruire les walls adverses avec sa puissance brute
 *    - Exemples: Mega Mawile, Choice Band Tyranitar
 *    - Souvent utilise Choice Band/Specs pour encore plus de puissance
 * 
 * 4. **SUPPORT** (Soutien)
 *    - Stats équilibrées mais pas exceptionnelles
 *    - Mission: Aider l'équipe (heal, setup entry hazards, status)
 *    - Moves: Stealth Rock, Spikes, Heal Bell, Thunder Wave
 *    - Exemples: Clefable, Ferrothorn, Toxapex
 * 
 * 5. **PIVOT** (Tournant)
 *    - Vitesse élevée + bulk décent
 *    - Mission: Switch in/out facilement, maintenir momentum
 *    - Moves: U-turn, Volt Switch, Flip Turn (switch après attaque)
 *    - Exemples: Landorus-T, Rotom-Wash
 * 
 * 6. **REVENGE KILLER** (Finisseur)
 *    - Vitesse EXTRÊME + attaque décente
 *    - Mission: Finir les Pokémon affaiblis
 *    - Souvent utilise priority moves ou Choice Scarf
 *    - Exemples: Weavile, Dragapult
 * 
 * ============================================================================
 * ANALYSE D'ÉQUIPE
 * ============================================================================
 * 
 * Le tool calcule pour toute l'équipe:
 * 
 * 1. **STATS MOYENNES**
 *    - Moyenne de chaque stat (HP, Atk, Def, SpA, SpD, Speed)
 *    - Permet d'identifier les faiblesses globales
 * 
 * 2. **PHYSICAL VS SPECIAL BIAS** (-1 à +1)
 *    - Formule: (Avg Attack - Avg SpA) / max(Avg Attack, Avg SpA)
 *    - +1 = entièrement physique
 *    - -1 = entièrement spécial
 *    -  0 = parfaitement équilibré
 *    - IMPORTANT: Avoir un mix est mieux!
 *      * Si que physique → vulnérable aux Physical walls (Skarmory)
 *      * Si que spécial → vulnérable aux Special walls (Blissey)
 * 
 * 3. **SPEED DISTRIBUTION**
 *    - "slow": < 60 moyenne (problématique!)
 *    - "balanced": 60-90
 *    - "fast": > 90 (idéal)
 * 
 * 4. **BULK RATING** (0-100)
 *    - Formule: (HP + Def + SpD moyens) / 450 * 100
 *    - Mesure la résistance globale de l'équipe
 *    - < 50: équipe "glass cannon" (fragile)
 *    - > 70: équipe défensive "stall team"
 * 
 * ============================================================================
 * SCORING D'UN CANDIDAT
 * ============================================================================
 * 
 * Quand on évalue un nouveau Pokémon:
 * 
 * BONUS SI:
 * - Corrige une équipe TROP LENTE (+40 points si rapide)
 * - Corrige une équipe TROP RAPIDE (+30 points si bulky)
 * - Équilibre le biais physique/spécial (+35 points)
 * - Ajoute du BULK si l'équipe est fragile (+40 points)
 * 
 * PÉNALITÉS SI:
 * - Réduit le poids des stats brutes (moins important que les types/roles)
 * - Candidat trop similaire à l'équipe actuelle
 * ============================================================================
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
    let score = 60; // Base neutre positive
    const details: string[] = [];

    const candidateRole = this.classifyPokemonRole(candidate);
    const candidateSpeed = this.getStat(candidate, "speed");
    const candidateAtk = this.getStat(candidate, "attack");
    const candidateSpAtk = this.getStat(candidate, "special-attack");

    // Bonus RÉDUIT pour stats (ne doit pas dominer la synergie!)
    const totalStats = this.getTotalStats(candidate);
    if (totalStats >= 520) {
      score += 12; // Réduit de 25 à 12
      details.push(`⭐ Stats élevées (${totalStats})`);
    } else if (totalStats >= 480) {
      score += 8; // Réduit de 15 à 8
      details.push(`✨ Bonnes stats (${totalStats})`);
    } else if (totalStats >= 420) {
      score += 4;
      details.push(`👍 Stats correctes (${totalStats})`);
    }
    // PAS de pénalité pour stats faibles - ce n'est pas un critère majeur

    // Équilibrage de la vitesse (important pour les combats!)
    if (teamStats.speedDistribution === "slow" && candidateSpeed >= 90) {
      score += 18;
      details.push("⚡ Ajoute vitesse (équipe lente)");
    } else if (teamStats.speedDistribution === "fast" && candidateSpeed <= 60) {
      score += 12;
      details.push("🛡️ Ajoute contrôle (équipe rapide)");
    }

    // Équilibrage physique/spécial
    if (teamStats.physicalBias > 0.3 && candidateSpAtk > candidateAtk && candidateSpAtk >= 90) {
      score += 15;
      details.push("✨ Équilibre avec Sp.Atk élevé");
    } else if (teamStats.physicalBias < -0.3 && candidateAtk > candidateSpAtk && candidateAtk >= 90) {
      score += 15;
      details.push("💪 Équilibre avec Atk élevé");
    }

    // Bonus si l'équipe manque de bulk
    if (teamStats.bulkRating < 40) {
      if (candidateRole.bulk === "wall") {
        score += 25;
        details.push("🛡️ Mur défensif (bulk critique)");
      } else if (candidateRole.bulk === "bulky") {
        score += 15;
        details.push("🛡️ Ajoute bulk nécessaire");
      }
    }

    return { score: Math.max(30, Math.min(100, Math.round(score))), details };
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
