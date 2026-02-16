/**
 * Type Analysis Agent
 * 
 * Analyse les types de l'équipe pour éviter les faiblesses communes
 * et assurer une bonne couverture offensive/défensive.
 */

import { Pokemon, TypeEffectivenessTool, TypeCoverage } from "../tools/TypeEffectivenessTool";

export interface TypeAnalysisResult {
  coverage: TypeCoverage;
  coverageScore: number;
  criticalWeaknesses: string[];
  recommendations: string[];
  candidateScores: Map<number, { score: number; details: string[] }>;
}

export class TypeAnalysisAgent {
  private tool = new TypeEffectivenessTool();
  
  /**
   * Nom de l'agent
   */
  getName(): string {
    return "TypeAnalysisAgent";
  }

  /**
   * Analyse l'équipe actuelle pour les types
   */
  analyzeTeam(team: Pokemon[]): TypeAnalysisResult {
    const coverage = this.tool.analyzeTeamTypes(team);
    const coverageScore = this.tool.calculateCoverageScore(coverage);
    const criticalWeaknesses = this.tool.getCriticalWeaknesses(coverage);
    const recommendations = this.generateRecommendations(coverage, criticalWeaknesses);

    return {
      coverage,
      coverageScore,
      criticalWeaknesses,
      recommendations,
      candidateScores: new Map()
    };
  }

  /**
   * Évalue des Pokémon candidats pour compléter l'équipe
   */
  evaluateCandidates(
    team: Pokemon[],
    candidates: Pokemon[]
  ): Map<number, { score: number; details: string[] }> {
    const coverage = this.tool.analyzeTeamTypes(team);
    const scores = new Map<number, { score: number; details: string[] }>();

    candidates.forEach(candidate => {
      const result = this.tool.scorePokemonTypeContribution(candidate, coverage);
      scores.set(candidate.id, result);
    });

    return scores;
  }

  /**
   * Génère les recommandations basées sur l'analyse
   */
  private generateRecommendations(
    coverage: TypeCoverage,
    criticalWeaknesses: string[]
  ): string[] {
    const recommendations: string[] = [];

    // Faiblesses critiques
    if (criticalWeaknesses.length > 0) {
      recommendations.push(
        `🚨 CRITIQUE: Votre équipe est très faible aux types: ${criticalWeaknesses.join(", ")}. Ajoutez un Pokémon résistant ou immunisé.`
      );
    }

    // Faiblesses normales
    const normalWeaknesses = Array.from(coverage.weaknesses.entries())
      .filter(([type, mult]) => mult >= 2 && mult < 4)
      .map(([type]) => type);
    
    if (normalWeaknesses.length > 5) {
      recommendations.push(
        `⚠️ Trop de faiblesses (${normalWeaknesses.length}). Rééquilibrez avec des Pokémon résistants.`
      );
    }

    // Couverture offensive
    if (coverage.uncoveredTypes.length > 10) {
      recommendations.push(
        `📊 Couverture offensive limitée (${coverage.offensiveCoverage.size}/18 types). Diversifiez.`
      );
    }

    // Immunités
    if (coverage.immunities.size > 0) {
      recommendations.push(
        `✅ Excellentes immunités: ${Array.from(coverage.immunities).join(", ")}`
      );
    }

    // Score global
    const coverageScore = this.tool.calculateCoverageScore(coverage);
    if (coverageScore >= 70) {
      recommendations.push("🌟 Excellente couverture de types!");
    } else if (coverageScore >= 50) {
      recommendations.push("👍 Bonne couverture, améliorable");
    } else {
      recommendations.push("🔧 Couverture à améliorer significativement");
    }

    return recommendations;
  }

  /**
   * Rapport détaillé de l'analyse de types
   */
  generateReport(analysis: TypeAnalysisResult): string {
    const report: string[] = [];
    
    report.push("═══════════════════════════════════");
    report.push("     ANALYSE DES TYPES (Agent)     ");
    report.push("═══════════════════════════════════");
    report.push("");
    
    report.push(`Score de couverture: ${analysis.coverageScore}/100`);
    report.push("");
    
    report.push(`Types offensifs: ${analysis.coverage.offensiveCoverage.size}/18`);
    report.push(`  ${Array.from(analysis.coverage.offensiveCoverage).join(", ")}`);
    report.push("");
    
    if (analysis.criticalWeaknesses.length > 0) {
      report.push(`❌ Faiblesses CRITIQUES (x4):`);
      report.push(`  ${analysis.criticalWeaknesses.join(", ")}`);
      report.push("");
    }
    
    const normalWeaknesses = Array.from(analysis.coverage.weaknesses.entries())
      .filter(([_, mult]) => mult >= 2 && mult < 4)
      .map(([type]) => type);
    
    if (normalWeaknesses.length > 0) {
      report.push(`⚠️ Faiblesses (x2):`);
      report.push(`  ${normalWeaknesses.join(", ")}`);
      report.push("");
    }
    
    if (analysis.coverage.immunities.size > 0) {
      report.push(`🛡️ Immunités:`);
      report.push(`  ${Array.from(analysis.coverage.immunities).join(", ")}`);
      report.push("");
    }
    
    report.push("Recommandations:");
    analysis.recommendations.forEach(rec => {
      report.push(`  • ${rec}`);
    });
    
    return report.join("\n");
  }
}
