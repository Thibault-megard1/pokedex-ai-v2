/**
 * Synergy Agent
 * 
 * Analyse les synergies et anti-synergies globales de l'équipe
 * pour optimiser la cohésion et éviter les redondances.
 */

import { Pokemon } from "../tools/TypeEffectivenessTool";
import { SynergyAnalyzerTool, SynergyResult } from "../tools/SynergyAnalyzerTool";

export interface SynergyAnalysisResult {
  synergy: SynergyResult;
  recommendations: string[];
  candidateScores: Map<number, { score: number; details: string[] }>;
}

export class SynergyAgent {
  private tool = new SynergyAnalyzerTool();

  /**
   * Nom de l'agent
   */
  getName(): string {
    return "SynergyAgent";
  }

  /**
   * Analyse les synergies de l'équipe actuelle
   */
  analyzeTeam(team: Pokemon[]): SynergyAnalysisResult {
    const synergy = this.tool.analyzeTeamSynergy(team);
    const recommendations = this.generateRecommendations(synergy);

    return {
      synergy,
      recommendations,
      candidateScores: new Map()
    };
  }

  /**
   * Évalue des Pokémon candidats basés sur leur synergie
   */
  evaluateCandidates(
    team: Pokemon[],
    candidates: Pokemon[]
  ): Map<number, { score: number; details: string[] }> {
    const scores = new Map<number, { score: number; details: string[] }>();

    candidates.forEach(candidate => {
      const result = this.tool.scoreCandidateSynergy(candidate, team);
      scores.set(candidate.id, result);
    });

    return scores;
  }

  /**
   * Génère les recommandations basées sur l'analyse de synergie
   */
  private generateRecommendations(synergy: SynergyResult): string[] {
    const recommendations: string[] = [];

    // Score global
    if (synergy.score >= 80) {
      recommendations.push("🌟 EXCELLENTE SYNERGIE d'équipe!");
    } else if (synergy.score >= 65) {
      recommendations.push("✅ Bonne synergie, quelques ajustements possibles");
    } else if (synergy.score >= 50) {
      recommendations.push("⚠️ Synergie moyenne - optimisation nécessaire");
    } else {
      recommendations.push("🚨 SYNERGIE FAIBLE - équipe à reconstruire");
    }

    // Redondance de types
    if (synergy.typeRedundancy > 0.5) {
      recommendations.push(
        `🔴 REDONDANCE CRITIQUE: Trop de types dupliqués (${Math.round(synergy.typeRedundancy * 100)}%)`
      );
    } else if (synergy.typeRedundancy > 0.25) {
      recommendations.push(
        `⚠️ Redondance de types détectée - diversifiez`
      );
    }

    // Synergies positives
    if (synergy.positiveSymergies.length > 0) {
      recommendations.push(`✅ Synergies positives:`);
      synergy.positiveSymergies.forEach(s => {
        recommendations.push(`  → ${s}`);
      });
    }

    // Anti-synergies
    if (synergy.negativeSymergies.length > 0) {
      recommendations.push(`❌ Problèmes détectés:`);
      synergy.negativeSymergies.forEach(s => {
        recommendations.push(`  → ${s}`);
      });
    }

    return recommendations;
  }

  /**
   * Génère un rapport détaillé de synergie
   */
  generateReport(analysis: SynergyAnalysisResult): string {
    const report: string[] = [];
    
    report.push("═══════════════════════════════════");
    report.push("   ANALYSE DE SYNERGIE (Agent)     ");
    report.push("═══════════════════════════════════");
    report.push("");
    
    report.push(`Score de synergie: ${analysis.synergy.score}/100`);
    report.push(`Redondance de types: ${Math.round(analysis.synergy.typeRedundancy * 100)}%`);
    report.push("");
    
    if (analysis.synergy.positiveSymergies.length > 0) {
      report.push("✅ SYNERGIES POSITIVES:");
      analysis.synergy.positiveSymergies.forEach(s => {
        report.push(`  • ${s}`);
      });
      report.push("");
    }
    
    if (analysis.synergy.negativeSymergies.length > 0) {
      report.push("❌ ANTI-SYNERGIES:");
      analysis.synergy.negativeSymergies.forEach(s => {
        report.push(`  • ${s}`);
      });
      report.push("");
    }
    
    report.push("Recommandations:");
    analysis.recommendations.forEach(rec => {
      report.push(`  • ${rec}`);
    });
    
    return report.join("\n");
  }
}
