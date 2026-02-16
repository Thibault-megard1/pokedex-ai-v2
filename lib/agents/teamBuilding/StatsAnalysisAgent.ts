/**
 * Stats Analysis Agent
 * 
 * Analyse les statistiques de base (HP, ATK, DEF, SPA, SPD, SPEED)
 * pour équilibrer l'équipe.
 */

import { Pokemon } from "../tools/TypeEffectivenessTool";
import { StatsAnalyzerTool, StatsSummary } from "../tools/StatsAnalyzerTool";

export interface StatsAnalysisResult {
  summary: StatsSummary;
  gaps: string[];
  recommendations: string[];
  candidateScores: Map<number, { score: number; details: string[] }>;
}

export class StatsAnalysisAgent {
  private tool = new StatsAnalyzerTool();

  /**
   * Nom de l'agent
   */
  getName(): string {
    return "StatsAnalysisAgent";
  }

  /**
   * Analyse les stats de l'équipe actuelle
   */
  analyzeTeam(team: Pokemon[]): StatsAnalysisResult {
    const summary = this.tool.analyzeTeamStats(team);
    const gaps = this.tool.identifyTeamGaps(summary);
    const recommendations = this.generateRecommendations(summary, gaps);

    return {
      summary,
      gaps,
      recommendations,
      candidateScores: new Map()
    };
  }

  /**
   * Évalue des Pokémon candidats basés sur leurs stats
   */
  evaluateCandidates(
    team: Pokemon[],
    candidates: Pokemon[]
  ): Map<number, { score: number; details: string[] }> {
    const teamStats = this.tool.analyzeTeamStats(team);
    const scores = new Map<number, { score: number; details: string[] }>();

    candidates.forEach(candidate => {
      const result = this.tool.scorePokemonStatsBalance(candidate, teamStats);
      scores.set(candidate.id, result);
    });

    return scores;
  }

  /**
   * Génère les recommandations basées sur l'analyse des stats
   */
  private generateRecommendations(
    summary: StatsSummary,
    gaps: string[]
  ): string[] {
    const recommendations: string[] = [];

    // Vitesse
    if (summary.speedDistribution === "slow") {
      recommendations.push(
        `⚡ Équipe LENTE (moy: ${Math.round(summary.avgSpeed)}). Ajoutez un sweeper rapide (Speed 90+).`
      );
    } else if (summary.speedDistribution === "fast") {
      recommendations.push(
        `🛡️ Équipe RAPIDE (moy: ${Math.round(summary.avgSpeed)}). Considérez un tank pour équilibrer.`
      );
    }

    // Bulk
    if (summary.bulkRating < 35) {
      recommendations.push(
        `🏥 MANQUE DE BULK (${summary.bulkRating}/100). Ajoutez un tank (HP/DEF/SPD élevés).`
      );
    } else if (summary.bulkRating >= 70) {
      recommendations.push(
        `✅ Excellent bulk (${summary.bulkRating}/100)`
      );
    }

    // Biais physique/spécial
    if (summary.physicalBias > 0.4) {
      recommendations.push(
        `⚔️ Équipe trop PHYSIQUE. Ajoutez un attaquant SPÉCIAL (Sp.Atk élevé).`
      );
    } else if (summary.physicalBias < -0.4) {
      recommendations.push(
        `✨ Équipe trop SPÉCIALE. Ajoutez un attaquant PHYSIQUE (Atk élevé).`
      );
    } else {
      recommendations.push(
        `⚖️ Bon équilibre physique/spécial`
      );
    }

    // Stats totales
    if (summary.avgTotal < 420) {
      recommendations.push(
        `📊 Stats moyennes basses (${Math.round(summary.avgTotal)}). Cherchez des Pokémon avec 480+ stats totales.`
      );
    } else if (summary.avgTotal >= 500) {
      recommendations.push(
        `🌟 Excellentes stats moyennes (${Math.round(summary.avgTotal)})`
      );
    }

    // Gaps spécifiques
    gaps.forEach(gap => {
      if (gap === "Manque de vitesse") {
        recommendations.push(`🏃 Ajoutez un Pokémon avec Speed 100+`);
      } else if (gap === "Manque de bulk/défense") {
        recommendations.push(`🛡️ Ajoutez un mur défensif`);
      }
    });

    return recommendations;
  }

  /**
   * Génère un rapport détaillé des stats
   */
  generateReport(analysis: StatsAnalysisResult): string {
    const report: string[] = [];
    const s = analysis.summary;
    
    report.push("═══════════════════════════════════");
    report.push("   ANALYSE DES STATS (Agent)       ");
    report.push("═══════════════════════════════════");
    report.push("");
    
    report.push("Stats moyennes:");
    report.push(`  HP:      ${Math.round(s.avgHp)}`);
    report.push(`  Attack:  ${Math.round(s.avgAttack)}`);
    report.push(`  Defense: ${Math.round(s.avgDefense)}`);
    report.push(`  Sp.Atk:  ${Math.round(s.avgSpAtk)}`);
    report.push(`  Sp.Def:  ${Math.round(s.avgSpDef)}`);
    report.push(`  Speed:   ${Math.round(s.avgSpeed)}`);
    report.push(`  TOTAL:   ${Math.round(s.avgTotal)}`);
    report.push("");
    
    report.push(`Distribution de vitesse: ${s.speedDistribution.toUpperCase()}`);
    report.push(`Bulk rating: ${s.bulkRating}/100`);
    
    const biasText = s.physicalBias > 0.3 ? "PHYSIQUE" : 
                     s.physicalBias < -0.3 ? "SPÉCIAL" : 
                     "ÉQUILIBRÉ";
    report.push(`Biais: ${biasText}`);
    report.push("");
    
    if (analysis.gaps.length > 0) {
      report.push("⚠️ Points faibles:");
      analysis.gaps.forEach(gap => {
        report.push(`  • ${gap}`);
      });
      report.push("");
    }
    
    report.push("Recommandations:");
    analysis.recommendations.forEach(rec => {
      report.push(`  • ${rec}`);
    });
    
    return report.join("\n");
  }

  /**
   * Identifie le meilleur candidat basé sur les stats
   */
  getBestCandidate(
    candidates: Pokemon[],
    teamStats: StatsSummary
  ): { pokemon: Pokemon; score: number; reason: string } | null {
    if (candidates.length === 0) return null;

    let bestScore = -Infinity;
    let bestPokemon: Pokemon | null = null;
    let bestReason = "";

    candidates.forEach(candidate => {
      const result = this.tool.scorePokemonStatsBalance(candidate, teamStats);
      if (result.score > bestScore) {
        bestScore = result.score;
        bestPokemon = candidate;
        bestReason = result.details.join(", ");
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
