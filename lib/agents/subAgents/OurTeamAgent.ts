/**
 * Our Team Agent
 * 
 * Mini-agent spécialisé dans l'optimisation de NOTRE équipe.
 * Responsabilités:
 * - Suggérer des Pokémon pour compléter l'équipe
 * - Générer une équipe complète
 * - Optimiser la composition existante
 */

import { TypeEffectivenessTool, Pokemon } from "../tools/TypeEffectivenessTool";
import { StatsAnalyzerTool } from "../tools/StatsAnalyzerTool";
import { RoleClassifierTool } from "../tools/RoleClassifierTool";
import { MoveCoverageTool } from "../tools/MoveCoverageTool";
import type { TeamAnalysis, TeamSuggestion } from "./TeamBuildingAgent";

// ============================================================================
// TYPES
// ============================================================================

interface ScoredCandidate {
  pokemon: Pokemon;
  typeScore: number;
  statsScore: number;
  roleScore: number;
  coverageScore: number;
  synergyScore: number;
  totalScore: number;
  details: string[];
}

interface TeamConstraints {
  bannedPokemon?: number[];
  requiredTypes?: string[];
  maxLegendaries?: number;
  format?: "singles" | "doubles" | "vgc";
}

// ============================================================================
// OUR TEAM AGENT
// ============================================================================

export class OurTeamAgent {
  private typeTool: TypeEffectivenessTool;
  private statsTool: StatsAnalyzerTool;
  private roleTool: RoleClassifierTool;
  private coverageTool: MoveCoverageTool;

  // Poids pour le scoring
  private readonly WEIGHTS = {
    type: 0.35,
    stats: 0.20,
    role: 0.25,
    coverage: 0.15,
    synergy: 0.05
  };

  constructor() {
    this.typeTool = new TypeEffectivenessTool();
    this.statsTool = new StatsAnalyzerTool();
    this.roleTool = new RoleClassifierTool();
    this.coverageTool = new MoveCoverageTool();
  }

  /**
   * Suggère des Pokémon pour compléter l'équipe
   */
  async suggestAdditions(
    currentTeam: Pokemon[],
    candidatePool: Pokemon[],
    teamAnalysis: TeamAnalysis,
    constraints?: TeamConstraints
  ): Promise<TeamSuggestion[]> {
    if (candidatePool.length === 0) {
      return [];
    }

    // Filtrer les candidats selon les contraintes
    const filteredCandidates = this.filterCandidates(candidatePool, currentTeam, constraints);

    // Scorer chaque candidat
    const scoredCandidates = await this.scoreCandidates(currentTeam, filteredCandidates, teamAnalysis);

    // Trier par score et prendre le top 5
    const topCandidates = scoredCandidates
      .sort((a, b) => b.totalScore - a.totalScore)
      .slice(0, 5);

    // Convertir en TeamSuggestion
    return topCandidates.map(candidate => ({
      pokemon: candidate.pokemon,
      score: candidate.totalScore,
      reasoning: this.generateReasoning(candidate, teamAnalysis),
      breakdown: {
        typeScore: candidate.typeScore,
        statsScore: candidate.statsScore,
        roleScore: candidate.roleScore,
        coverageScore: candidate.coverageScore,
        synergyScore: candidate.synergyScore
      }
    }));
  }

  /**
   * Génère une équipe complète depuis zéro
   */
  async generateFullTeam(
    candidatePool: Pokemon[],
    constraints?: TeamConstraints
  ): Promise<Pokemon[]> {
    const team: Pokemon[] = [];
    let remainingCandidates = [...candidatePool];

    // Construire l'équipe un Pokémon à la fois
    for (let i = 0; i < 6 && remainingCandidates.length > 0; i++) {
      const filtered = this.filterCandidates(remainingCandidates, team, constraints);
      
      if (filtered.length === 0) break;

      // Pour le premier, prendre le meilleur global
      if (team.length === 0) {
        const best = this.selectBestStarter(filtered);
        team.push(best);
      } else {
        // Pour les suivants, scorer en fonction de l'équipe actuelle
        const analysis: TeamAnalysis = {
          strengths: [],
          weaknesses: [],
          typeChart: { weakTo: [], resistantTo: [], immuneTo: [] },
          roleDistribution: {},
          overallScore: 0,
          recommendations: []
        };
        
        const scored = await this.scoreCandidates(team, filtered, analysis);
        const best = scored.sort((a, b) => b.totalScore - a.totalScore)[0];
        
        if (best) {
          team.push(best.pokemon);
        }
      }

      // Retirer le Pokémon choisi des candidats
      remainingCandidates = remainingCandidates.filter(
        p => !team.some(t => t.id === p.id)
      );
    }

    return team;
  }

  // ============================================================================
  // MÉTHODES PRIVÉES
  // ============================================================================

  /**
   * Filtre les candidats selon les contraintes
   */
  private filterCandidates(
    candidates: Pokemon[],
    currentTeam: Pokemon[],
    constraints?: TeamConstraints
  ): Pokemon[] {
    let filtered = candidates;

    // Exclure les Pokémon déjà dans l'équipe
    const teamIds = new Set(currentTeam.map(p => p.id));
    filtered = filtered.filter(p => !teamIds.has(p.id));

    if (!constraints) return filtered;

    // Exclure les Pokémon bannis
    if (constraints.bannedPokemon) {
      const banned = new Set(constraints.bannedPokemon);
      filtered = filtered.filter(p => !banned.has(p.id));
    }

    // Limiter les légendaires (IDs 144-151, 243-251, 377-386, etc.)
    if (constraints.maxLegendaries !== undefined) {
      const legendaryIds = new Set([
        144, 145, 146, 150, 151, // Gen 1
        243, 244, 245, 249, 250, 251, // Gen 2
        377, 378, 379, 380, 381, 382, 383, 384, 385, 386, // Gen 3
        480, 481, 482, 483, 484, 485, 486, 487, 488, 489, 490, 491, 492, 493, // Gen 4
        // ... autres générations
      ]);

      const currentLegendaries = currentTeam.filter(p => legendaryIds.has(p.id)).length;
      const allowedMore = constraints.maxLegendaries - currentLegendaries;

      if (allowedMore <= 0) {
        filtered = filtered.filter(p => !legendaryIds.has(p.id));
      }
    }

    return filtered;
  }

  /**
   * Score tous les candidats
   */
  private async scoreCandidates(
    currentTeam: Pokemon[],
    candidates: Pokemon[],
    teamAnalysis: TeamAnalysis
  ): Promise<ScoredCandidate[]> {
    const teamTypes = this.typeTool.analyzeTeamTypes(currentTeam);
    const teamCoverage = this.coverageTool.analyzeMoveCoverage(currentTeam);
    const roleDistribution = this.roleTool.analyzeRoleDistribution(currentTeam);

    return candidates.map(pokemon => {
      // Type score
      const typeResult = this.typeTool.scorePokemonTypeContribution(pokemon, teamTypes);
      const typeScore = Math.min(100, Math.max(0, 50 + typeResult.score));

      // Stats score - utilise analyzeTeamStats et compare
      const teamStats = this.statsTool.analyzeTeamStats(currentTeam);
      const statsResult = this.statsTool.scorePokemonStatsBalance(pokemon, teamStats);
      const statsScore = Math.min(100, Math.max(0, 50 + statsResult.score));

      // Role score
      const roleResult = this.roleTool.scorePokemonRoleContribution(pokemon, roleDistribution);
      const roleScore = Math.min(100, Math.max(0, 50 + roleResult.score));

      // Coverage score
      const coverageResult = this.coverageTool.scorePokemonMoveCoverage(pokemon, teamCoverage);
      const coverageScore = Math.min(100, Math.max(0, 50 + coverageResult.score));

      // Synergy score (bonus basé sur complémentarité)
      const synergyScore = this.calculateSynergyScore(pokemon, currentTeam);

      // Score total pondéré
      const totalScore = Math.round(
        typeScore * this.WEIGHTS.type +
        statsScore * this.WEIGHTS.stats +
        roleScore * this.WEIGHTS.role +
        coverageScore * this.WEIGHTS.coverage +
        synergyScore * this.WEIGHTS.synergy
      );

      return {
        pokemon,
        typeScore,
        statsScore,
        roleScore,
        coverageScore,
        synergyScore,
        totalScore,
        details: [
          ...typeResult.details.slice(0, 2),
          ...roleResult.details.slice(0, 1)
        ]
      };
    });
  }

  /**
   * Helper pour extraire une stat d'un Pokémon
   */
  private getStat(pokemon: Pokemon, statName: string): number {
    if (!pokemon.stats) return 0;
    const stat = pokemon.stats.find(s => s.name.toLowerCase() === statName.toLowerCase());
    return stat?.value || 0;
  }

  /**
   * Calcule le score de synergie avec l'équipe
   */
  private calculateSynergyScore(pokemon: Pokemon, team: Pokemon[]): number {
    if (team.length === 0) return 50;

    let score = 50;

    // Bonus pour types complémentaires
    const teamTypes = new Set(team.flatMap(p => p.types));
    const newTypes = pokemon.types.filter(t => !teamTypes.has(t));
    score += newTypes.length * 10;

    // Bonus pour diversité de stats
    const getTotal = (p: Pokemon) => 
      this.getStat(p, 'hp') + this.getStat(p, 'attack') + this.getStat(p, 'defense');
    
    const teamTotalStats = team.reduce((sum, p) => sum + getTotal(p), 0);
    const avgTeamTotal = teamTotalStats / team.length;
    const pokemonTotal = getTotal(pokemon);
    
    if (Math.abs(pokemonTotal - avgTeamTotal) > 50) {
      score += 5; // Diversité encouragée
    }

    return Math.min(100, Math.max(0, score));
  }

  /**
   * Sélectionne le meilleur starter (premier Pokémon)
   */
  private selectBestStarter(candidates: Pokemon[]): Pokemon {
    // Privilégier les Pokémon polyvalents avec bonnes stats
    const scored = candidates.map(pokemon => {
      const totalStats = 
        this.getStat(pokemon, 'hp') + 
        this.getStat(pokemon, 'attack') + 
        this.getStat(pokemon, 'defense') +
        this.getStat(pokemon, 'special-attack') + 
        this.getStat(pokemon, 'special-defense') + 
        this.getStat(pokemon, 'speed');
      
      // Bonus pour dual-type
      const typeBonus = pokemon.types.length === 2 ? 20 : 0;
      
      return { pokemon, score: totalStats + typeBonus };
    });

    return scored.sort((a, b) => b.score - a.score)[0]?.pokemon || candidates[0];
  }

  /**
   * Génère une explication textuelle
   */
  private generateReasoning(candidate: ScoredCandidate, teamAnalysis: TeamAnalysis): string {
    const reasons: string[] = [];

    if (candidate.typeScore > 60) {
      reasons.push("excellent apport type");
    }
    if (candidate.roleScore > 60) {
      reasons.push("comble un rôle manquant");
    }
    if (candidate.coverageScore > 55) {
      reasons.push("améliore la couverture offensive");
    }
    if (candidate.synergyScore > 60) {
      reasons.push("forte synergie avec l'équipe");
    }

    if (reasons.length === 0) {
      reasons.push("choix équilibré");
    }

    return `${candidate.pokemon.name}: ${reasons.join(", ")} (score: ${candidate.totalScore}/100)`;
  }
}

export default OurTeamAgent;
