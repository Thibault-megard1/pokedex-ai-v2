/**
 * Role Distribution Agent
 * 
 * Assure que l'équipe possède des rôles stratégiques cohérents
 * (Lead, Sweeper, Tank, Support, Pivot).
 */

import { Pokemon } from "../tools/TypeEffectivenessTool";
import { RoleClassifierTool, TeamRoleDistribution, StrategicRole } from "../tools/RoleClassifierTool";

export interface RoleDistributionResult {
  distribution: TeamRoleDistribution;
  recommendations: string[];
  candidateScores: Map<number, { score: number; details: string[] }>;
}

export class RoleDistributionAgent {
  private tool = new RoleClassifierTool();

  /**
   * Nom de l'agent
   */
  getName(): string {
    return "RoleDistributionAgent";
  }

  /**
   * Analyse la distribution des rôles dans l'équipe
   */
  analyzeTeam(team: Pokemon[]): RoleDistributionResult {
    const distribution = this.tool.analyzeRoleDistribution(team);
    const recommendations = this.generateRecommendations(distribution);

    return {
      distribution,
      recommendations,
      candidateScores: new Map()
    };
  }

  /**
   * Évalue des Pokémon candidats basés sur leur rôle
   */
  evaluateCandidates(
    team: Pokemon[],
    candidates: Pokemon[]
  ): Map<number, { score: number; details: string[] }> {
    const distribution = this.tool.analyzeRoleDistribution(team);
    const scores = new Map<number, { score: number; details: string[] }>();

    candidates.forEach(candidate => {
      const result = this.tool.scorePokemonRoleContribution(candidate, distribution);
      scores.set(candidate.id, result);
    });

    return scores;
  }

  /**
   * Génère les recommandations basées sur la distribution des rôles
   */
  private generateRecommendations(distribution: TeamRoleDistribution): string[] {
    const recommendations: string[] = [];

    // Rôles essentiels manquants
    if (distribution.missingRoles.length > 0) {
      const critical = distribution.missingRoles.filter(r => 
        ["sweeper", "tank", "support"].includes(r)
      );
      
      if (critical.length > 0) {
        recommendations.push(
          `🚨 RÔLES ESSENTIELS MANQUANTS: ${critical.join(", ").toUpperCase()}`
        );
      }
      
      const optional = distribution.missingRoles.filter(r => 
        !["sweeper", "tank", "support"].includes(r)
      );
      
      if (optional.length > 0) {
        recommendations.push(
          `💡 Rôles optionnels: ${optional.join(", ")}`
        );
      }
    }

    // Rôles surchargés
    if (distribution.overloadedRoles.length > 0) {
      recommendations.push(
        `⚠️ Trop de: ${distribution.overloadedRoles.join(", ")}. Diversifiez!`
      );
    }

    // Score d'équilibre
    if (distribution.balanceScore >= 80) {
      recommendations.push("✅ Excellente distribution des rôles!");
    } else if (distribution.balanceScore >= 60) {
      recommendations.push("👍 Bonne distribution, quelques améliorations possibles");
    } else if (distribution.balanceScore >= 40) {
      recommendations.push("⚖️ Distribution moyenne, améliorations nécessaires");
    } else {
      recommendations.push("🔧 Distribution déséquilibrée, repensez votre équipe");
    }

    // Suggestions spécifiques
    const roleRecommendations = this.tool.recommendRoles(distribution);
    roleRecommendations.forEach(rec => {
      recommendations.push(`💡 ${rec}`);
    });

    // Conseils stratégiques
    if (!distribution.roles.has("revenge-killer")) {
      recommendations.push("⚡ Ajoutez un revenge killer (Speed 110+) pour sécuriser les matchs");
    }

    if (!distribution.roles.has("pivot")) {
      recommendations.push("🔄 Un pivot améliorerait le contrôle du match");
    }

    return recommendations;
  }

  /**
   * Génère un rapport détaillé de la distribution
   */
  generateReport(analysis: RoleDistributionResult): string {
    const report: string[] = [];
    const d = analysis.distribution;
    
    report.push("═══════════════════════════════════");
    report.push("  DISTRIBUTION DES RÔLES (Agent)   ");
    report.push("═══════════════════════════════════");
    report.push("");
    
    report.push("Rôles actuels:");
    const roleDescriptions: Record<StrategicRole, string> = {
      "lead": "🎯 Lead (ouverture)",
      "sweeper": "⚡ Sweeper (finisseur)",
      "wallbreaker": "💥 Wallbreaker (brise-mur)",
      "tank": "🛡️ Tank (encaisseur)",
      "support": "💚 Support",
      "pivot": "🔄 Pivot",
      "revenge-killer": "⚔️ Revenge Killer",
      "balanced": "⚖️ Balanced"
    };

    d.roles.forEach((count, role) => {
      if (count > 0) {
        report.push(`  ${roleDescriptions[role]}: ${count}`);
      }
    });
    report.push("");
    
    report.push(`Score d'équilibre: ${d.balanceScore}/100`);
    report.push("");
    
    if (d.missingRoles.length > 0) {
      report.push("❌ Rôles manquants:");
      d.missingRoles.forEach(role => {
        report.push(`  • ${roleDescriptions[role]}`);
      });
      report.push("");
    }
    
    if (d.overloadedRoles.length > 0) {
      report.push("⚠️ Rôles surchargés:");
      d.overloadedRoles.forEach(role => {
        report.push(`  • ${roleDescriptions[role]}`);
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
   * Suggère les meilleurs rôles à ajouter
   */
  suggestNextRoles(distribution: TeamRoleDistribution): StrategicRole[] {
    // Priorité: rôles essentiels manquants > rôles pour équilibrer
    const priorityOrder: StrategicRole[] = [
      "sweeper",
      "tank",
      "support",
      "revenge-killer",
      "pivot",
      "wallbreaker",
      "lead"
    ];

    return priorityOrder.filter(role => {
      const count = distribution.roles.get(role) || 0;
      return count === 0 || (count < 2 && distribution.missingRoles.includes(role));
    });
  }
}
