/**
 * Opponent Team Agent
 * 
 * Mini-agent spécialisé dans l'analyse et la génération d'équipes ADVERSES.
 * Responsabilités:
 * - Analyser l'équipe adverse
 * - Identifier les menaces
 * - Générer une équipe counter
 * - Prédire la stratégie adverse
 */

import { TypeEffectivenessTool, Pokemon } from "../tools/TypeEffectivenessTool";
import { StatsAnalyzerTool } from "../tools/StatsAnalyzerTool";
import { RoleClassifierTool } from "../tools/RoleClassifierTool";
import { MoveCoverageTool } from "../tools/MoveCoverageTool";

// ============================================================================
// TYPES
// ============================================================================

export interface ThreatAnalysis {
  pokemon: Pokemon;
  threatLevel: "low" | "medium" | "high" | "critical";
  reasons: string[];
  counters: string[]; // Types ou rôles qui countrent
}

export interface MatchupAnalysis {
  advantage: "our_team" | "opponent" | "even";
  confidence: number;
  threats: ThreatAnalysis[];
  recommendations: string[];
  keyMatchups: {
    ourPokemon: string;
    theirPokemon: string;
    advantage: "win" | "lose" | "50/50";
  }[];
}

export interface OpponentStrategy {
  predictedStyle: "offensive" | "defensive" | "balanced" | "hyper_offense" | "stall";
  coreThreats: Pokemon[];
  expectedLeads: Pokemon[];
  weakPoints: string[];
}

interface TeamConstraints {
  bannedPokemon?: number[];
  requiredTypes?: string[];
  maxLegendaries?: number;
  format?: "singles" | "doubles" | "vgc";
}

// Table des faiblesses de types
const TYPE_WEAKNESSES: Record<string, string[]> = {
  normal: ["fighting"],
  fire: ["water", "ground", "rock"],
  water: ["electric", "grass"],
  electric: ["ground"],
  grass: ["fire", "ice", "poison", "flying", "bug"],
  ice: ["fire", "fighting", "rock", "steel"],
  fighting: ["flying", "psychic", "fairy"],
  poison: ["ground", "psychic"],
  ground: ["water", "grass", "ice"],
  flying: ["electric", "ice", "rock"],
  psychic: ["bug", "ghost", "dark"],
  bug: ["fire", "flying", "rock"],
  rock: ["water", "grass", "fighting", "ground", "steel"],
  ghost: ["ghost", "dark"],
  dragon: ["ice", "dragon", "fairy"],
  dark: ["fighting", "bug", "fairy"],
  steel: ["fire", "fighting", "ground"],
  fairy: ["poison", "steel"]
};

// Table des résistances
const TYPE_RESISTANCES: Record<string, string[]> = {
  normal: [],
  fire: ["fire", "grass", "ice", "bug", "steel", "fairy"],
  water: ["fire", "water", "ice", "steel"],
  electric: ["electric", "flying", "steel"],
  grass: ["water", "electric", "grass", "ground"],
  ice: ["ice"],
  fighting: ["bug", "rock", "dark"],
  poison: ["grass", "fighting", "poison", "bug", "fairy"],
  ground: ["poison", "rock"],
  flying: ["grass", "fighting", "bug"],
  psychic: ["fighting", "psychic"],
  bug: ["grass", "fighting", "ground"],
  rock: ["normal", "fire", "poison", "flying"],
  ghost: ["poison", "bug"],
  dragon: ["fire", "water", "electric", "grass"],
  dark: ["ghost", "dark"],
  steel: ["normal", "grass", "ice", "flying", "psychic", "bug", "rock", "dragon", "steel", "fairy"],
  fairy: ["fighting", "bug", "dark"]
};

// ============================================================================
// OPPONENT TEAM AGENT
// ============================================================================

export class OpponentTeamAgent {
  private typeTool: TypeEffectivenessTool;
  private statsTool: StatsAnalyzerTool;
  private roleTool: RoleClassifierTool;
  private coverageTool: MoveCoverageTool;

  constructor() {
    this.typeTool = new TypeEffectivenessTool();
    this.statsTool = new StatsAnalyzerTool();
    this.roleTool = new RoleClassifierTool();
    this.coverageTool = new MoveCoverageTool();
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  /**
   * Extrait une stat d'un Pokémon (stats est un tableau {name, value}[])
   */
  private getStat(pokemon: Pokemon, statName: string): number {
    if (!pokemon.stats) return 0;
    const normalizedName = statName.toLowerCase();
    const stat = pokemon.stats.find(s => 
      s.name.toLowerCase() === normalizedName ||
      s.name.toLowerCase().replace('-', '') === normalizedName.replace('-', '')
    );
    return stat?.value || 0;
  }

  /**
   * Vérifie si un défenseur est faible à un type d'attaque
   */
  private isWeakTo(defenderTypes: string[], attackType: string): boolean {
    const atkLower = attackType.toLowerCase();
    return defenderTypes.some(dt => {
      const weaknesses = TYPE_WEAKNESSES[dt.toLowerCase()] || [];
      return weaknesses.includes(atkLower);
    });
  }

  /**
   * Vérifie si un défenseur résiste à un type d'attaque
   */
  private isResistantTo(defenderTypes: string[], attackType: string): boolean {
    const atkLower = attackType.toLowerCase();
    return defenderTypes.some(dt => {
      const resistances = TYPE_RESISTANCES[dt.toLowerCase()] || [];
      return resistances.includes(atkLower);
    });
  }

  /**
   * Analyse le matchup entre notre équipe et l'équipe adverse
   */
  async analyzeMatchup(ourTeam: Pokemon[], opponentTeam: Pokemon[]): Promise<MatchupAnalysis> {
    // Analyser les menaces
    const threats = this.identifyThreats(ourTeam, opponentTeam);
    
    // Analyser les matchups clés
    const keyMatchups = this.analyzeKeyMatchups(ourTeam, opponentTeam);
    
    // Calculer l'avantage global
    const { advantage, confidence } = this.calculateOverallAdvantage(ourTeam, opponentTeam, threats);
    
    // Générer les recommandations
    const recommendations = this.generateMatchupRecommendations(threats, keyMatchups, advantage);

    return {
      advantage,
      confidence,
      threats,
      recommendations,
      keyMatchups
    };
  }

  /**
   * Génère une équipe qui contre l'équipe adverse
   */
  async generateCounterTeam(
    opponentTeam: Pokemon[],
    candidatePool: Pokemon[],
    constraints?: TeamConstraints
  ): Promise<Pokemon[]> {
    const counterTeam: Pokemon[] = [];
    let remainingCandidates = this.filterCandidates(candidatePool, constraints);

    // Analyser l'équipe adverse
    const opponentTypes = this.typeTool.analyzeTeamTypes(opponentTeam);
    const opponentRoles = this.roleTool.analyzeRoleDistribution(opponentTeam);

    // Sélectionner 6 Pokémon qui countrent
    for (let i = 0; i < 6 && remainingCandidates.length > 0; i++) {
      const best = this.selectBestCounter(
        remainingCandidates,
        opponentTeam,
        counterTeam,
        opponentTypes
      );

      if (best) {
        counterTeam.push(best);
        remainingCandidates = remainingCandidates.filter(p => p.id !== best.id);
      }
    }

    return counterTeam;
  }

  /**
   * Prédit la stratégie de l'adversaire
   */
  predictStrategy(opponentTeam: Pokemon[]): OpponentStrategy {
    const roles = this.roleTool.analyzeRoleDistribution(opponentTeam);
    const stats = this.statsTool.analyzeTeamStats(opponentTeam);

    // Déterminer le style de jeu
    let predictedStyle: OpponentStrategy["predictedStyle"] = "balanced";
    
    const sweeperCount = roles.roles.get("sweeper") || 0;
    const tankCount = roles.roles.get("tank") || 0;
    const supportCount = roles.roles.get("support") || 0;
    
    if (sweeperCount >= 3) {
      predictedStyle = "hyper_offense";
    } else if (tankCount >= 2 && supportCount >= 1) {
      predictedStyle = "stall";
    } else if (stats.avgAttack > stats.avgDefense + 20) {
      predictedStyle = "offensive";
    } else if (stats.avgDefense > stats.avgAttack + 20) {
      predictedStyle = "defensive";
    }

    // Identifier les menaces principales
    const coreThreats = opponentTeam
      .filter(p => {
        const role = this.roleTool.classifyStrategicRole(p);
        return role === "sweeper" || role === "wallbreaker";
      })
      .slice(0, 3);

    // Prédire les leads probables
    const expectedLeads = opponentTeam
      .filter(p => {
        const role = this.roleTool.classifyStrategicRole(p);
        const speed = this.getStat(p, 'speed');
        return role === "lead" || speed > 90;
      })
      .slice(0, 2);

    // Identifier les points faibles
    const weakPoints = this.identifyWeakPoints(opponentTeam);

    return {
      predictedStyle,
      coreThreats,
      expectedLeads,
      weakPoints
    };
  }

  // ============================================================================
  // MÉTHODES PRIVÉES
  // ============================================================================

  /**
   * Identifie les menaces de l'équipe adverse
   */
  private identifyThreats(ourTeam: Pokemon[], opponentTeam: Pokemon[]): ThreatAnalysis[] {
    return opponentTeam.map(opponent => {
      const reasons: string[] = [];
      const counters: string[] = [];
      let threatScore = 0;

      // Vérifier si l'adversaire est super efficace contre notre équipe
      opponent.types.forEach(type => {
        const weakPokemon = ourTeam.filter(p => this.isWeakTo(p.types, type));
        
        if (weakPokemon.length >= 2) {
          reasons.push(`Super efficace contre ${weakPokemon.length} de nos Pokémon`);
          threatScore += weakPokemon.length * 15;
        }
      });

      // Vérifier les stats élevées
      const attack = this.getStat(opponent, 'attack');
      const spAtk = this.getStat(opponent, 'special-attack');
      const speed = this.getStat(opponent, 'speed');
      const totalOffensiveStats = attack + spAtk + speed;
      if (totalOffensiveStats > 300) {
        reasons.push("Stats offensives élevées");
        threatScore += 20;
      }

      // Vérifier si on peut le counter
      const canCounter = ourTeam.some(p => 
        opponent.types.some(type => this.isWeakTo([type], p.types[0]))
      );
      if (!canCounter) {
        reasons.push("Difficile à counter");
        threatScore += 25;
      }

      // Identifier les counters
      if (opponent.types.includes("fire")) counters.push("water", "rock", "ground");
      if (opponent.types.includes("water")) counters.push("electric", "grass");
      if (opponent.types.includes("grass")) counters.push("fire", "ice", "flying");
      if (opponent.types.includes("dragon")) counters.push("ice", "fairy", "dragon");
      if (opponent.types.includes("psychic")) counters.push("dark", "ghost", "bug");

      // Déterminer le niveau de menace
      let threatLevel: ThreatAnalysis["threatLevel"] = "low";
      if (threatScore > 50) threatLevel = "critical";
      else if (threatScore > 35) threatLevel = "high";
      else if (threatScore > 20) threatLevel = "medium";

      return {
        pokemon: opponent,
        threatLevel,
        reasons,
        counters: [...new Set(counters)]
      };
    });
  }

  /**
   * Analyse les matchups clés 1v1
   */
  private analyzeKeyMatchups(
    ourTeam: Pokemon[],
    opponentTeam: Pokemon[]
  ): MatchupAnalysis["keyMatchups"] {
    const matchups: MatchupAnalysis["keyMatchups"] = [];

    // Pour chaque menace, trouver notre meilleur counter
    opponentTeam.forEach(opponent => {
      let bestCounter: Pokemon | undefined = undefined;
      let bestAdvantage = -Infinity;

      ourTeam.forEach(our => {
        const advantage = this.calculate1v1Advantage(our, opponent);
        if (advantage > bestAdvantage) {
          bestAdvantage = advantage;
          bestCounter = our;
        }
      });

      if (bestCounter) {
        matchups.push({
          ourPokemon: (bestCounter as Pokemon).name,
          theirPokemon: opponent.name,
          advantage: bestAdvantage > 20 ? "win" : bestAdvantage < -20 ? "lose" : "50/50"
        });
      }
    });

    return matchups.slice(0, 6);
  }

  /**
   * Calcule l'avantage 1v1 (positif = on gagne)
   */
  private calculate1v1Advantage(our: Pokemon, opponent: Pokemon): number {
    let advantage = 0;

    // Type advantage
    our.types.forEach(ourType => {
      opponent.types.forEach(theirType => {
        if (this.isWeakTo([theirType], ourType)) {
          advantage += 30; // On est super efficace
        }
        if (this.isWeakTo([ourType], theirType)) {
          advantage -= 30; // Ils sont super efficaces
        }
      });
    });

    // Speed advantage
    const ourSpeed = this.getStat(our, 'speed');
    const theirSpeed = this.getStat(opponent, 'speed');
    if (ourSpeed > theirSpeed) {
      advantage += 10;
    } else if (ourSpeed < theirSpeed) {
      advantage -= 10;
    }

    // Bulk advantage
    const ourBulk = this.getStat(our, 'hp') + this.getStat(our, 'defense') + this.getStat(our, 'special-defense');
    const theirBulk = this.getStat(opponent, 'hp') + this.getStat(opponent, 'defense') + this.getStat(opponent, 'special-defense');
    advantage += (ourBulk - theirBulk) / 10;

    return advantage;
  }

  /**
   * Calcule l'avantage global
   */
  private calculateOverallAdvantage(
    ourTeam: Pokemon[],
    opponentTeam: Pokemon[],
    threats: ThreatAnalysis[]
  ): { advantage: MatchupAnalysis["advantage"]; confidence: number } {
    const criticalThreats = threats.filter(t => t.threatLevel === "critical").length;
    const highThreats = threats.filter(t => t.threatLevel === "high").length;

    let score = 0;
    
    // Pénalité pour les menaces critiques
    score -= criticalThreats * 20;
    score -= highThreats * 10;

    // Bonus pour notre couverture type
    const ourCoverage = this.coverageTool.analyzeMoveCoverage(ourTeam);
    const theirTypes = new Set(opponentTeam.flatMap(p => p.types));
    
    theirTypes.forEach(type => {
      if (ourCoverage.superEffectiveAgainst.has(type)) {
        score += 10;
      }
    });

    let advantage: MatchupAnalysis["advantage"] = "even";
    if (score > 15) advantage = "our_team";
    else if (score < -15) advantage = "opponent";

    const confidence = Math.min(0.9, 0.5 + Math.abs(score) / 100);

    return { advantage, confidence };
  }

  /**
   * Sélectionne le meilleur counter parmi les candidats
   */
  private selectBestCounter(
    candidates: Pokemon[],
    opponentTeam: Pokemon[],
    currentCounterTeam: Pokemon[],
    opponentTypes: ReturnType<TypeEffectivenessTool["analyzeTeamTypes"]>
  ): Pokemon | null {
    let bestScore = -Infinity;
    let bestPokemon: Pokemon | null = null;

    candidates.forEach(candidate => {
      let score = 0;

      // Score basé sur couverture des types adverses
      candidate.types.forEach(type => {
        opponentTeam.forEach(opponent => {
          if (this.isWeakTo(opponent.types, type)) {
            score += 20;
          }
        });
      });

      // Bonus pour résistances aux types adverses
      const opponentTypeList = opponentTeam.flatMap(p => p.types);
      candidate.types.forEach(ourType => {
        opponentTypeList.forEach(theirType => {
          if (this.isResistantTo([ourType], theirType)) {
            score += 10;
          }
        });
      });

      // Pénalité si on a déjà ce type dans l'équipe counter
      const existingTypes = new Set(currentCounterTeam.flatMap(p => p.types));
      if (candidate.types.every(t => existingTypes.has(t))) {
        score -= 15;
      }

      if (score > bestScore) {
        bestScore = score;
        bestPokemon = candidate;
      }
    });

    return bestPokemon;
  }

  /**
   * Identifie les points faibles de l'équipe adverse
   */
  private identifyWeakPoints(opponentTeam: Pokemon[]): string[] {
    const weakPoints: string[] = [];
    const types = this.typeTool.analyzeTeamTypes(opponentTeam);

    // Faiblesses communes
    const commonWeaknesses = Array.from(types.weaknesses)
      .filter(([_, count]) => count >= 3)
      .map(([type]) => type);

    if (commonWeaknesses.length > 0) {
      weakPoints.push(`Faible à: ${commonWeaknesses.join(", ")}`);
    }

    // Manque de couverture
    const coverage = this.coverageTool.analyzeMoveCoverage(opponentTeam);
    if (coverage.poorCoverageAgainst.size > 8) {
      weakPoints.push(`Mauvaise couverture offensive (${coverage.poorCoverageAgainst.size} types)`);
    }

    // Manque de bulk
    const avgBulk = opponentTeam.reduce((sum, p) => {
      const hp = this.getStat(p, 'hp');
      const def = this.getStat(p, 'defense');
      const spDef = this.getStat(p, 'special-defense');
      return sum + hp + def + spDef;
    }, 0) / (opponentTeam.length * 3);

    if (avgBulk < 70) {
      weakPoints.push("Équipe fragile (faible bulk)");
    }

    return weakPoints;
  }

  /**
   * Filtre les candidats selon les contraintes
   */
  private filterCandidates(candidates: Pokemon[], constraints?: TeamConstraints): Pokemon[] {
    if (!constraints) return candidates;

    let filtered = candidates;

    if (constraints.bannedPokemon) {
      const banned = new Set(constraints.bannedPokemon);
      filtered = filtered.filter(p => !banned.has(p.id));
    }

    return filtered;
  }

  /**
   * Génère des recommandations basées sur l'analyse
   */
  private generateMatchupRecommendations(
    threats: ThreatAnalysis[],
    keyMatchups: MatchupAnalysis["keyMatchups"],
    advantage: MatchupAnalysis["advantage"]
  ): string[] {
    const recommendations: string[] = [];

    // Recommandations sur les menaces critiques
    const criticalThreats = threats.filter(t => t.threatLevel === "critical");
    criticalThreats.forEach(threat => {
      recommendations.push(
        `🚨 ${threat.pokemon.name} est une menace critique. Counters recommandés: ${threat.counters.slice(0, 3).join(", ")}`
      );
    });

    // Recommandations sur les matchups défavorables
    const badMatchups = keyMatchups.filter(m => m.advantage === "lose");
    if (badMatchups.length > 2) {
      recommendations.push(
        `⚠️ ${badMatchups.length} matchups défavorables. Considérez des ajustements d'équipe.`
      );
    }

    // Recommandation globale
    if (advantage === "opponent") {
      recommendations.push(
        "📉 L'adversaire a l'avantage global. Jouez défensivement et attendez les erreurs."
      );
    } else if (advantage === "our_team") {
      recommendations.push(
        "📈 Vous avez l'avantage! Maintenez la pression tout en gérant vos ressources."
      );
    }

    return recommendations.slice(0, 5);
  }
}

export default OpponentTeamAgent;
