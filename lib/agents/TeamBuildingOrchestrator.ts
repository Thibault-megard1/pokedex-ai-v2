/**
 * Team Building Orchestrator
 * 
 * Coordonne les 4 agents d'analyse pour fournir des suggestions optimales
 * de Pokémon pour compléter une équipe.
 */

import { Pokemon } from "./tools/TypeEffectivenessTool";
import { TypeAnalysisAgent } from "./teamBuilding/TypeAnalysisAgent";
import { StatsAnalysisAgent } from "./teamBuilding/StatsAnalysisAgent";
import { RoleDistributionAgent } from "./teamBuilding/RoleDistributionAgent";
import { MoveCoverageAgent } from "./teamBuilding/MoveCoverageAgent";

export interface TeamAnalysis {
  typeAnalysis: ReturnType<TypeAnalysisAgent["analyzeTeam"]>;
  statsAnalysis: ReturnType<StatsAnalysisAgent["analyzeTeam"]>;
  roleAnalysis: ReturnType<RoleDistributionAgent["analyzeTeam"]>;
  coverageAnalysis: ReturnType<MoveCoverageAgent["analyzeTeam"]>;
  overallScore: number; // 0-100
  overallRecommendations: string[];
}

export interface CandidateScore {
  pokemon: Pokemon;
  totalScore: number;
  breakdown: {
    typeScore: number;
    statsScore: number;
    roleScore: number;
    coverageScore: number;
  };
  details: string[];
  reasoning: string;
}

export class TeamBuildingOrchestrator {
  private typeAgent = new TypeAnalysisAgent();
  private statsAgent = new StatsAnalysisAgent();
  private roleAgent = new RoleDistributionAgent();
  private coverageAgent = new MoveCoverageAgent();

  /**
   * Poids de chaque agent dans le score final
   */
  private readonly WEIGHTS = {
    type: 0.35,      // 35% - Le plus important
    stats: 0.25,     // 25% - Équilibre des stats
    role: 0.25,      // 25% - Distribution des rôles
    coverage: 0.15   // 15% - Couverture des attaques
  };

  /**
   * Analyse complète d'une équipe
   */
  analyzeTeam(team: Pokemon[]): TeamAnalysis {
    console.log(`🤖 [Orchestrator] Analyse de l'équipe (${team.length} Pokémon)...`);

    // Exécuter tous les agents en parallèle
    const typeAnalysis = this.typeAgent.analyzeTeam(team);
    const statsAnalysis = this.statsAgent.analyzeTeam(team);
    const roleAnalysis = this.roleAgent.analyzeTeam(team);
    const coverageAnalysis = this.coverageAgent.analyzeTeam(team);

    console.log("✅ [Orchestrator] Analyses complètes");

    // Calculer le score global
    const overallScore = this.calculateOverallScore({
      typeScore: typeAnalysis.coverageScore,
      statsScore: this.calculateStatsScore(statsAnalysis.summary),
      roleScore: roleAnalysis.distribution.balanceScore,
      coverageScore: coverageAnalysis.coverageScore
    });

    // Agréger les recommandations
    const overallRecommendations = this.aggregateRecommendations({
      typeAnalysis,
      statsAnalysis,
      roleAnalysis,
      coverageAnalysis,
      overallScore
    });

    return {
      typeAnalysis,
      statsAnalysis,
      roleAnalysis,
      coverageAnalysis,
      overallScore,
      overallRecommendations
    };
  }

  /**
   * Évalue et classe des Pokémon candidats
   */
  evaluateCandidates(
    team: Pokemon[],
    candidates: Pokemon[],
    limit: number = 10
  ): CandidateScore[] {
    console.log(`🔍 [Orchestrator] Évaluation de ${candidates.length} candidats...`);

    // Obtenir les scores de chaque agent
    const typeScores = this.typeAgent.evaluateCandidates(team, candidates);
    const statsScores = this.statsAgent.evaluateCandidates(team, candidates);
    const roleScores = this.roleAgent.evaluateCandidates(team, candidates);
    const coverageScores = this.coverageAgent.evaluateCandidates(team, candidates);

    // Agréger les scores
    const candidateScores: CandidateScore[] = candidates.map(pokemon => {
      const typeResult = typeScores.get(pokemon.id) || { score: 0, details: [] };
      const statsResult = statsScores.get(pokemon.id) || { score: 0, details: [] };
      const roleResult = roleScores.get(pokemon.id) || { score: 0, details: [] };
      const coverageResult = coverageScores.get(pokemon.id) || { score: 0, details: [] };

      // Score pondéré
      const totalScore = 
        (typeResult.score * this.WEIGHTS.type) +
        (statsResult.score * this.WEIGHTS.stats) +
        (roleResult.score * this.WEIGHTS.role) +
        (coverageResult.score * this.WEIGHTS.coverage);

      // Agréger les détails
      const allDetails = [
        ...typeResult.details,
        ...statsResult.details,
        ...roleResult.details,
        ...coverageResult.details
      ];

      // Générer un résumé du raisonnement
      const reasoning = this.generateReasoning(
        pokemon,
        typeResult,
        statsResult,
        roleResult,
        coverageResult
      );

      return {
        pokemon,
        totalScore: Math.round(totalScore * 10) / 10, // Arrondir à 1 décimale
        breakdown: {
          typeScore: Math.round(typeResult.score * 10) / 10,
          statsScore: Math.round(statsResult.score * 10) / 10,
          roleScore: Math.round(roleResult.score * 10) / 10,
          coverageScore: Math.round(coverageResult.score * 10) / 10
        },
        details: allDetails,
        reasoning
      };
    });

    // Trier par score décroissant
    candidateScores.sort((a, b) => b.totalScore - a.totalScore);

    console.log(`✅ [Orchestrator] Top candidat: ${candidateScores[0]?.pokemon.name} (score: ${candidateScores[0]?.totalScore})`);

    return candidateScores.slice(0, limit);
  }

  /**
   * Calcule le score global de l'équipe
   */
  private calculateOverallScore(scores: {
    typeScore: number;
    statsScore: number;
    roleScore: number;
    coverageScore: number;
  }): number {
    const weighted = 
      (scores.typeScore * this.WEIGHTS.type) +
      (scores.statsScore * this.WEIGHTS.stats) +
      (scores.roleScore * this.WEIGHTS.role) +
      (scores.coverageScore * this.WEIGHTS.coverage);

    return Math.round(weighted);
  }

  /**
   * Calcule un score de stats (0-100)
   */
  private calculateStatsScore(summary: any): number {
    // Normaliser les stats moyennes
    const totalScore = summary.avgTotal / 600; // 600 = excellent
    const bulkScore = summary.bulkRating / 100;
    const speedScore = summary.avgSpeed / 120; // 120 = très rapide

    return Math.min(100, Math.round(
      (totalScore * 40) +
      (bulkScore * 30) +
      (speedScore * 30)
    ));
  }

  /**
   * Agrège les recommandations de tous les agents
   */
  private aggregateRecommendations(analysis: {
    typeAnalysis: any;
    statsAnalysis: any;
    roleAnalysis: any;
    coverageAnalysis: any;
    overallScore: number;
  }): string[] {
    const recs: string[] = [];

    // Score global
    if (analysis.overallScore >= 80) {
      recs.push("🌟 ÉQUIPE EXCELLENTE! Très bien équilibrée.");
    } else if (analysis.overallScore >= 65) {
      recs.push("✅ Bonne équipe, quelques améliorations possibles.");
    } else if (analysis.overallScore >= 50) {
      recs.push("⚖️ Équipe moyenne, optimisation recommandée.");
    } else {
      recs.push("🔧 Équipe à retravailler significativement.");
    }

    // Priorités critiques de chaque agent
    const criticalRecs = [
      ...analysis.typeAnalysis.recommendations.filter((r: string) => r.includes("CRITIQUE")),
      ...analysis.roleAnalysis.recommendations.filter((r: string) => r.includes("ESSENTIELS")),
      ...analysis.statsAnalysis.recommendations.filter((r: string) => r.includes("MANQUE"))
    ];

    recs.push(...criticalRecs.slice(0, 3)); // Top 3 critiques

    // Recommandations générales
    const generalRecs = [
      ...analysis.typeAnalysis.recommendations.filter((r: string) => !r.includes("CRITIQUE")).slice(0, 2),
      ...analysis.statsAnalysis.recommendations.slice(0, 2),
      ...analysis.roleAnalysis.recommendations.slice(0, 2),
      ...analysis.coverageAnalysis.recommendations.slice(0, 1)
    ];

    recs.push(...generalRecs);

    return recs.slice(0, 10); // Limiter à 10 recommandations
  }

  /**
   * Génère un raisonnement humain pour un candidat
   */
  private generateReasoning(
    pokemon: Pokemon,
    typeResult: any,
    statsResult: any,
    roleResult: any,
    coverageResult: any
  ): string {
    const reasons: string[] = [];

    // Trouver le point fort principal
    const scores = {
      type: typeResult.score,
      stats: statsResult.score,
      role: roleResult.score,
      coverage: coverageResult.score
    };

    const maxScore = Math.max(...Object.values(scores));
    
    if (scores.type === maxScore && typeResult.details.length > 0) {
      reasons.push(typeResult.details[0]);
    } else if (scores.role === maxScore && roleResult.details.length > 0) {
      reasons.push(roleResult.details[0]);
    } else if (scores.stats === maxScore && statsResult.details.length > 0) {
      reasons.push(statsResult.details[0]);
    } else if (scores.coverage === maxScore && coverageResult.details.length > 0) {
      reasons.push(coverageResult.details[0]);
    }

    // Ajouter d'autres points forts
    [typeResult, statsResult, roleResult, coverageResult].forEach(result => {
      if (result.details.length > 0 && !reasons.includes(result.details[0])) {
        reasons.push(result.details[0]);
      }
    });

    return reasons.slice(0, 3).join(" • ") || "Bon équilibre général";
  }

  /**
   * Génère un rapport complet
   */
  generateFullReport(analysis: TeamAnalysis): string {
    const sections: string[] = [];

    sections.push("╔═══════════════════════════════════════════════╗");
    sections.push("║   RAPPORT D'ANALYSE MULTI-AGENTS POKÉMON     ║");
    sections.push("╚═══════════════════════════════════════════════╝");
    sections.push("");
    
    sections.push(`📊 SCORE GLOBAL: ${analysis.overallScore}/100`);
    sections.push("");

    sections.push(this.typeAgent.generateReport(analysis.typeAnalysis));
    sections.push("");
    
    sections.push(this.statsAgent.generateReport(analysis.statsAnalysis));
    sections.push("");
    
    sections.push(this.roleAgent.generateReport(analysis.roleAnalysis));
    sections.push("");
    
    sections.push(this.coverageAgent.generateReport(analysis.coverageAnalysis));
    sections.push("");

    sections.push("═══════════════════════════════════");
    sections.push("   RECOMMANDATIONS GLOBALES        ");
    sections.push("═══════════════════════════════════");
    analysis.overallRecommendations.forEach(rec => {
      sections.push(`  • ${rec}`);
    });

    return sections.join("\n");
  }
}
