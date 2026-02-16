/**
 * Move Coverage Agent
 * 
 * Analyse les attaques pour maximiser la couverture et éviter les doublons inutiles.
 */

import { Pokemon } from "../tools/TypeEffectivenessTool";
import { MoveCoverageTool, MoveCoverage } from "../tools/MoveCoverageTool";

export interface MoveCoverageResult {
  coverage: MoveCoverage;
  coverageScore: number;
  problemTypes: string[];
  recommendations: string[];
  candidateScores: Map<number, { score: number; details: string[] }>;
}

export class MoveCoverageAgent {
  private tool = new MoveCoverageTool();

  /**
   * Nom de l'agent
   */
  getName(): string {
    return "MoveCoverageAgent";
  }

  /**
   * Analyse la couverture des attaques de l'équipe
   */
  analyzeTeam(team: Pokemon[]): MoveCoverageResult {
    const coverage = this.tool.analyzeMoveCoverage(team);
    const coverageScore = this.tool.calculateOffensiveCoverageScore(coverage, team.length);
    const problemTypes = this.tool.identifyProblemTypes(coverage);
    const recommendations = this.generateRecommendations(coverage, problemTypes, team.length);

    return {
      coverage,
      coverageScore,
      problemTypes,
      recommendations,
      candidateScores: new Map()
    };
  }

  /**
   * Évalue des Pokémon candidats basés sur leur couverture
   */
  evaluateCandidates(
    team: Pokemon[],
    candidates: Pokemon[]
  ): Map<number, { score: number; details: string[] }> {
    const teamCoverage = this.tool.analyzeMoveCoverage(team);
    const scores = new Map<number, { score: number; details: string[] }>();

    candidates.forEach(candidate => {
      const result = this.tool.scorePokemonMoveCoverage(candidate, teamCoverage);
      scores.set(candidate.id, result);
    });

    return scores;
  }

  /**
   * Génère les recommandations basées sur la couverture
   */
  private generateRecommendations(
    coverage: MoveCoverage,
    problemTypes: string[],
    teamSize: number
  ): string[] {
    const recommendations: string[] = [];

    // Types problématiques
    if (problemTypes.length > 0) {
      recommendations.push(
        `🎯 TYPES PROBLÉMATIQUES: ${problemTypes.join(", ").toUpperCase()}`
      );
      
      const moveRecommendations = this.tool.recommendMoveTypes(coverage);
      moveRecommendations.forEach(rec => {
        recommendations.push(`  → ${rec}`);
      });
    }

    // Couverture STAB
    if (coverage.stab.size < 3 && teamSize >= 3) {
      recommendations.push(
        `⚔️ Diversité STAB limitée (${coverage.stab.size} types). Ajoutez plus de variété.`
      );
    } else if (coverage.stab.size >= 6) {
      recommendations.push(
        `✅ Excellente diversité STAB (${coverage.stab.size} types)`
      );
    }

    // Couverture super efficace
    const coverageRatio = (coverage.superEffectiveAgainst.size / 18) * 100;
    if (coverageRatio < 50) {
      recommendations.push(
        `📊 Couverture offensive faible (${Math.round(coverageRatio)}%). Ciblez plus de types.`
      );
    } else if (coverageRatio >= 75) {
      recommendations.push(
        `🌟 Excellente couverture offensive (${Math.round(coverageRatio)}%)`
      );
    }

    // Types non couverts
    if (coverage.poorCoverageAgainst.size > 8) {
      recommendations.push(
        `⚠️ Beaucoup de types mal couverts (${coverage.poorCoverageAgainst.size}). Améliorez la couverture.`
      );
    }

    // Conseils spécifiques sur les types communs
    const commonThreats = ["steel", "fairy", "water", "dragon"];
    const uncoveredThreats = commonThreats.filter(type => 
      coverage.poorCoverageAgainst.has(type)
    );

    if (uncoveredThreats.length > 0) {
      recommendations.push(
        `🚨 Menaces métagame non couvertes: ${uncoveredThreats.join(", ")}`
      );
    }

    return recommendations;
  }

  /**
   * Génère un rapport détaillé de couverture
   */
  generateReport(analysis: MoveCoverageResult): string {
    const report: string[] = [];
    const c = analysis.coverage;
    
    report.push("═══════════════════════════════════");
    report.push("  COUVERTURE OFFENSIVE (Agent)     ");
    report.push("═══════════════════════════════════");
    report.push("");
    
    report.push(`Score de couverture: ${analysis.coverageScore}/100`);
    report.push("");
    
    report.push(`Types STAB: ${c.stab.size}`);
    report.push(`  ${Array.from(c.stab).join(", ")}`);
    report.push("");
    
    report.push(`Super efficace contre: ${c.superEffectiveAgainst.size}/18 types`);
    report.push(`  ${Array.from(c.superEffectiveAgainst).slice(0, 12).join(", ")}...`);
    report.push("");
    
    if (analysis.problemTypes.length > 0) {
      report.push(`❌ Types problématiques:`);
      report.push(`  ${analysis.problemTypes.join(", ")}`);
      report.push("");
    }
    
    if (c.poorCoverageAgainst.size > 0) {
      const poorList = Array.from(c.poorCoverageAgainst).slice(0, 10).join(", ");
      report.push(`⚠️ Mal couverts: ${c.poorCoverageAgainst.size} types`);
      report.push(`  ${poorList}...`);
      report.push("");
    }
    
    report.push("Recommandations:");
    analysis.recommendations.forEach(rec => {
      report.push(`  • ${rec}`);
    });
    
    return report.join("\n");
  }

  /**
   * Identifie le candidat avec la meilleure couverture
   */
  getBestCoverageCandidate(
    team: Pokemon[],
    candidates: Pokemon[]
  ): { pokemon: Pokemon; score: number; reason: string } | null {
    if (candidates.length === 0) return null;

    const teamCoverage = this.tool.analyzeMoveCoverage(team);
    let bestScore = -Infinity;
    let bestPokemon: Pokemon | null = null;
    let bestReason = "";

    candidates.forEach(candidate => {
      const result = this.tool.scorePokemonMoveCoverage(candidate, teamCoverage);
      if (result.score > bestScore) {
        bestScore = result.score;
        bestPokemon = candidate;
        bestReason = result.details.slice(0, 2).join(", ");
      }
    });

    if (!bestPokemon) return null;

    return {
      pokemon: bestPokemon,
      score: bestScore,
      reason: bestReason
    };
  }
}
