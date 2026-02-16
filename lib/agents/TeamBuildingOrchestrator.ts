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
import { SynergyAgent } from "./teamBuilding/SynergyAgent";

export interface TeamAnalysis {
  typeAnalysis: ReturnType<TypeAnalysisAgent["analyzeTeam"]>;
  statsAnalysis: ReturnType<StatsAnalysisAgent["analyzeTeam"]>;
  roleAnalysis: ReturnType<RoleDistributionAgent["analyzeTeam"]>;
  coverageAnalysis: ReturnType<MoveCoverageAgent["analyzeTeam"]>;
  synergyAnalysis: ReturnType<SynergyAgent["analyzeTeam"]>;
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
    synergyScore: number;
  };
  details: string[];
  reasoning: string;
}

export class TeamBuildingOrchestrator {
  private typeAgent = new TypeAnalysisAgent();
  private statsAgent = new StatsAnalysisAgent();
  private roleAgent = new RoleDistributionAgent();
  private coverageAgent = new MoveCoverageAgent();
  private synergyAgent = new SynergyAgent();

  /**
   * Poids de base pour chaque agent
   * REFACTORISÉ: Synergie et Types sont PRIORITAIRES
   * Les stats brutes comptent moins - on veut la COMPLÉMENTARITÉ
   */
  private readonly BASE_WEIGHTS = {
    type: 0.30,      // 30% - Couverture de types
    synergy: 0.35,   // 35% - Synergie (PRIORITAIRE!)
    stats: 0.10,     // 10% - Stats (réduit!)
    role: 0.15,      // 15% - Distribution des rôles
    coverage: 0.10   // 10% - Couverture des attaques
  };

  /**
   * Calcule les poids dynamiques basés sur l'état de l'équipe
   * REFACTORISÉ: Synergie toujours très importante
   */
  private calculateDynamicWeights(team: Pokemon[]): typeof this.BASE_WEIGHTS {
    const weights = { ...this.BASE_WEIGHTS };
    
    // Si équipe petite (1-2 Pokémon), PRIORISER la SYNERGIE et les TYPES
    if (team.length <= 2) {
      weights.type = 0.30;     // Couverture de types
      weights.synergy = 0.40;  // SYNERGIE TRÈS IMPORTANTE (40%!)
      weights.stats = 0.08;    // Stats très réduit
      weights.role = 0.12;     // Rôle
      weights.coverage = 0.10; // Coverage
    }
    
    // Si équipe moyenne (3-4), équilibrer progressivement
    else if (team.length <= 4) {
      weights.type = 0.28;
      weights.synergy = 0.35;
      weights.stats = 0.12;
      weights.role = 0.15;
      weights.coverage = 0.10;
    }
    
    // Si équipe presque complète (5+), tout compte
    else {
      weights.type = 0.25;
      weights.synergy = 0.30;
      weights.stats = 0.15;
      weights.role = 0.15;
      weights.coverage = 0.15;
    }
    
    return weights;
  }

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
    const synergyAnalysis = this.synergyAgent.analyzeTeam(team);

    console.log("✅ [Orchestrator] Analyses complètes");

    // Calculer le score global avec poids dynamiques
    const weights = this.calculateDynamicWeights(team);
    const overallScore = this.calculateOverallScore({
      typeScore: typeAnalysis.coverageScore,
      statsScore: this.calculateStatsScore(statsAnalysis.summary),
      roleScore: roleAnalysis.distribution.balanceScore,
      coverageScore: coverageAnalysis.coverageScore,
      synergyScore: synergyAnalysis.synergy.score
    }, weights);

    // Agréger les recommandations
    const overallRecommendations = this.aggregateRecommendations({
      typeAnalysis,
      statsAnalysis,
      roleAnalysis,
      coverageAnalysis,
      synergyAnalysis,
      overallScore
    });

    return {
      typeAnalysis,
      statsAnalysis,
      roleAnalysis,
      coverageAnalysis,
      synergyAnalysis,
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
    console.log(`🔍 [Orchestrator] Évaluation de ${candidates.length} candidats pour équipe de ${team.length} Pokémon...`);
    console.log(`📋 [Orchestrator] Types actuels: ${team.map(p => p.types.join('/')).join(', ')}`);

    // Obtenir les poids dynamiques
    const weights = this.calculateDynamicWeights(team);
    console.log(`⚖️ [Orchestrator] Poids: Type=${Math.round(weights.type*100)}%, Synergy=${Math.round(weights.synergy*100)}%, Stats=${Math.round(weights.stats*100)}%, Role=${Math.round(weights.role*100)}%, Coverage=${Math.round(weights.coverage*100)}%`);

    // Obtenir les scores de chaque agent
    const typeScores = this.typeAgent.evaluateCandidates(team, candidates);
    const statsScores = this.statsAgent.evaluateCandidates(team, candidates);
    const roleScores = this.roleAgent.evaluateCandidates(team, candidates);
    const coverageScores = this.coverageAgent.evaluateCandidates(team, candidates);
    const synergyScores = this.synergyAgent.evaluateCandidates(team, candidates);

    // Agréger les scores
    const candidateScores: CandidateScore[] = candidates.map(pokemon => {
      const typeResult = typeScores.get(pokemon.id) || { score: 0, details: [] };
      const statsResult = statsScores.get(pokemon.id) || { score: 0, details: [] };
      const roleResult = roleScores.get(pokemon.id) || { score: 0, details: [] };
      const coverageResult = coverageScores.get(pokemon.id) || { score: 0, details: [] };
      const synergyResult = synergyScores.get(pokemon.id) || { score: 50, details: [] };

      // Score pondéré avec poids dynamiques
      const totalScore = 
        (typeResult.score * weights.type) +
        (statsResult.score * weights.stats) +
        (roleResult.score * weights.role) +
        (coverageResult.score * weights.coverage) +
        (synergyResult.score * weights.synergy);

      // Agréger les détails
      const allDetails = [
        ...synergyResult.details, // Synergie en premier (important!)
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
        coverageResult,
        synergyResult
      );

      return {
        pokemon,
        totalScore: Math.round(totalScore * 10) / 10, // Arrondir à 1 décimale
        breakdown: {
          typeScore: Math.round(typeResult.score * 10) / 10,
          statsScore: Math.round(statsResult.score * 10) / 10,
          roleScore: Math.round(roleResult.score * 10) / 10,
          coverageScore: Math.round(coverageResult.score * 10) / 10,
          synergyScore: Math.round(synergyResult.score * 10) / 10
        },
        details: allDetails,
        reasoning
      };
    });

    // Trier par score décroissant
    candidateScores.sort((a, b) => b.totalScore - a.totalScore);

    // LOG DÉTAILLÉ des top 5 candidats
    console.log(`\n🏆 [Orchestrator] Top 5 candidats:`);
    candidateScores.slice(0, 5).forEach((c, i) => {
      console.log(`  ${i+1}. ${c.pokemon.name} (${c.pokemon.types.join('/')}) = ${c.totalScore}`);
      console.log(`     Type=${c.breakdown.typeScore}, Synergy=${c.breakdown.synergyScore}, Stats=${c.breakdown.statsScore}, Role=${c.breakdown.roleScore}, Coverage=${c.breakdown.coverageScore}`);
    });

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
    synergyScore: number;
  }, weights: typeof this.BASE_WEIGHTS): number {
    const weighted = 
      (scores.typeScore * weights.type) +
      (scores.statsScore * weights.stats) +
      (scores.roleScore * weights.role) +
      (scores.coverageScore * weights.coverage) +
      (scores.synergyScore * weights.synergy);

    return Math.round(weighted);
  }

  /**
   * Calcule un score de stats (0-100)
   * ADAPTÉ pour ne pas pénaliser les Pokémon normaux
   */
  private calculateStatsScore(summary: any): number {
    // Normaliser les stats moyennes avec base plus favorable
    // Pikachu (320 total) devrait avoir ~55, pas ~35
    const avgTotal = summary.avgTotal || 300;
    const totalScore = Math.min(1, avgTotal / 500); // 500 = bon (pas 600)
    
    const bulkRating = summary.bulkRating || 40;
    const bulkScore = Math.min(1, (bulkRating + 20) / 100); // +20 de base

    const avgSpeed = summary.avgSpeed || 60;
    const speedScore = Math.min(1, avgSpeed / 100); // 100 = rapide (pas 120)

    const score = (totalScore * 35) + (bulkScore * 30) + (speedScore * 35);
    
    // Minimum 45 pour éviter scores trop bas
    return Math.max(45, Math.min(100, Math.round(score)));
  }

  /**
   * Agrège les recommandations de tous les agents
   */
  private aggregateRecommendations(analysis: {
    typeAnalysis: any;
    statsAnalysis: any;
    roleAnalysis: any;
    coverageAnalysis: any;
    synergyAnalysis: any;
    overallScore: number;
  }): string[] {
    const recs: string[] = [];

    // Score global
    if (analysis.overallScore >= 85) {
      recs.push("🌟 ÉQUIPE EXCELLENTE! Très bien équilibrée et synergique.");
    } else if (analysis.overallScore >= 70) {
      recs.push("✅ Bonne équipe, quelques améliorations possibles.");
    } else if (analysis.overallScore >= 55) {
      recs.push("⚖️ Équipe moyenne, optimisation recommandée.");
    } else {
      recs.push("🔧 Équipe à retravailler significativement.");
    }

    // Priorités SYNERGIE en premier (nouveau!)
    const synergyCritical = analysis.synergyAnalysis.recommendations
      .filter((r: string) => r.includes("REDONDANCE") || r.includes("FAIBLE"));
    recs.push(...synergyCritical.slice(0, 2));

    // Priorités critiques de chaque agent
    const criticalRecs = [
      ...analysis.typeAnalysis.recommendations.filter((r: string) => r.includes("CRITIQUE")),
      ...analysis.roleAnalysis.recommendations.filter((r: string) => r.includes("ESSENTIELS")),
      ...analysis.statsAnalysis.recommendations.filter((r: string) => r.includes("MANQUE"))
    ];

    recs.push(...criticalRecs.slice(0, 3)); // Top 3 critiques

    // Recommandations générales
    const generalRecs = [
      ...analysis.synergyAnalysis.recommendations.slice(0, 2),
      ...analysis.typeAnalysis.recommendations.filter((r: string) => !r.includes("CRITIQUE")).slice(0, 1),
      ...analysis.statsAnalysis.recommendations.slice(0, 1),
      ...analysis.roleAnalysis.recommendations.slice(0, 1),
      ...analysis.coverageAnalysis.recommendations.slice(0, 1)
    ];

    recs.push(...generalRecs);

    return recs.slice(0, 12); // Limiter à 12 recommandations
  }

  /**
   * Génère un raisonnement humain pour un candidat
   */
  private generateReasoning(
    pokemon: Pokemon,
    typeResult: any,
    statsResult: any,
    roleResult: any,
    coverageResult: any,
    synergyResult: any
  ): string {
    const reasons: string[] = [];

    // Trouver le point fort principal
    const scores = {
      synergy: synergyResult.score,
      type: typeResult.score,
      stats: statsResult.score,
      role: roleResult.score,
      coverage: coverageResult.score
    };

    const maxScore = Math.max(...Object.values(scores));
    
    // Synergie en priorité!
    if (scores.synergy === maxScore && synergyResult.details.length > 0) {
      reasons.push(synergyResult.details[0]);
    } else if (scores.type === maxScore && typeResult.details.length > 0) {
      reasons.push(typeResult.details[0]);
    } else if (scores.role === maxScore && roleResult.details.length > 0) {
      reasons.push(roleResult.details[0]);
    } else if (scores.stats === maxScore && statsResult.details.length > 0) {
      reasons.push(statsResult.details[0]);
    } else if (scores.coverage === maxScore && coverageResult.details.length > 0) {
      reasons.push(coverageResult.details[0]);
    }

    // Ajouter d'autres points forts
    [synergyResult, typeResult, statsResult, roleResult, coverageResult].forEach(result => {
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

    sections.push(this.synergyAgent.generateReport(analysis.synergyAnalysis));
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