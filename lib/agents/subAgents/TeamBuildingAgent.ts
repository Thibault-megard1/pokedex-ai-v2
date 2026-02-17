/**
 * Team Building Agent
 * 
 * Sous-agent qui gère la construction et l'optimisation des équipes.
 * Coordonne deux mini-agents:
 * - OurTeamAgent: Optimise notre équipe
 * - OpponentTeamAgent: Analyse/génère l'équipe adverse
 * 
 * Utilise les Tools pour les calculs purs.
 */

import { OurTeamAgent } from "./OurTeamAgent";
import { OpponentTeamAgent } from "./OpponentTeamAgent";
import { TypeEffectivenessTool, Pokemon } from "../tools/TypeEffectivenessTool";
import { StatsAnalyzerTool } from "../tools/StatsAnalyzerTool";
import { RoleClassifierTool } from "../tools/RoleClassifierTool";
import { MoveCoverageTool } from "../tools/MoveCoverageTool";

// ============================================================================
// TYPES
// ============================================================================

export type TeamBuildingMode = "suggest" | "analyze" | "counter" | "generate";

export interface TeamBuildingRequest {
  mode: TeamBuildingMode;
  currentTeam: Pokemon[];
  opponentTeam?: Pokemon[];
  constraints?: {
    bannedPokemon?: number[];
    requiredTypes?: string[];
    maxLegendaries?: number;
    format?: "singles" | "doubles" | "vgc";
  };
  candidatePool?: Pokemon[];
}

export interface TeamSuggestion {
  pokemon: Pokemon;
  score: number;
  reasoning: string;
  breakdown: {
    typeScore: number;
    statsScore: number;
    roleScore: number;
    coverageScore: number;
    synergyScore: number;
  };
}

export interface TeamAnalysis {
  strengths: string[];
  weaknesses: string[];
  typeChart: {
    weakTo: string[];
    resistantTo: string[];
    immuneTo: string[];
  };
  roleDistribution: Record<string, number>;
  overallScore: number;
  recommendations: string[];
}

export interface TeamBuildingResponse {
  success: boolean;
  mode: TeamBuildingMode;
  suggestions?: TeamSuggestion[];
  analysis?: TeamAnalysis;
  counterTeam?: Pokemon[];
  generatedTeam?: Pokemon[];
  error?: string;
}

// ============================================================================
// TEAM BUILDING AGENT
// ============================================================================

export class TeamBuildingAgent {
  private ourTeamAgent: OurTeamAgent;
  private opponentTeamAgent: OpponentTeamAgent;
  
  // Tools partagés
  private typeTool: TypeEffectivenessTool;
  private statsTool: StatsAnalyzerTool;
  private roleTool: RoleClassifierTool;
  private coverageTool: MoveCoverageTool;

  constructor() {
    this.ourTeamAgent = new OurTeamAgent();
    this.opponentTeamAgent = new OpponentTeamAgent();
    
    this.typeTool = new TypeEffectivenessTool();
    this.statsTool = new StatsAnalyzerTool();
    this.roleTool = new RoleClassifierTool();
    this.coverageTool = new MoveCoverageTool();
  }

  /**
   * Point d'entrée principal du Team Building Agent
   */
  async process(request: TeamBuildingRequest): Promise<TeamBuildingResponse> {
    try {
      switch (request.mode) {
        case "suggest":
          return await this.handleSuggest(request);
        
        case "analyze":
          return await this.handleAnalyze(request);
        
        case "counter":
          return await this.handleCounter(request);
        
        case "generate":
          return await this.handleGenerate(request);
        
        default:
          return {
            success: false,
            mode: request.mode,
            error: `Mode non supporté: ${request.mode}`
          };
      }
    } catch (error: any) {
      return {
        success: false,
        mode: request.mode,
        error: error.message || "Erreur dans TeamBuildingAgent"
      };
    }
  }

  /**
   * Mode SUGGEST: Suggère des Pokémon pour compléter l'équipe
   */
  private async handleSuggest(request: TeamBuildingRequest): Promise<TeamBuildingResponse> {
    const { currentTeam, candidatePool, constraints } = request;

    // Analyse de l'équipe actuelle
    const teamAnalysis = this.analyzeTeam(currentTeam);

    // Obtenir les suggestions via OurTeamAgent
    const suggestions = await this.ourTeamAgent.suggestAdditions(
      currentTeam,
      candidatePool || [],
      teamAnalysis,
      constraints
    );

    return {
      success: true,
      mode: "suggest",
      suggestions,
      analysis: teamAnalysis
    };
  }

  /**
   * Mode ANALYZE: Analyse une équipe sans suggérer
   */
  private async handleAnalyze(request: TeamBuildingRequest): Promise<TeamBuildingResponse> {
    const analysis = this.analyzeTeam(request.currentTeam);

    // Si équipe adverse fournie, ajouter l'analyse matchup
    if (request.opponentTeam && request.opponentTeam.length > 0) {
      const matchupAnalysis = await this.opponentTeamAgent.analyzeMatchup(
        request.currentTeam,
        request.opponentTeam
      );
      
      // Fusionner les analyses
      analysis.recommendations = [
        ...analysis.recommendations,
        ...matchupAnalysis.recommendations
      ];
    }

    return {
      success: true,
      mode: "analyze",
      analysis
    };
  }

  /**
   * Mode COUNTER: Génère une équipe pour contrer l'adversaire
   */
  private async handleCounter(request: TeamBuildingRequest): Promise<TeamBuildingResponse> {
    if (!request.opponentTeam || request.opponentTeam.length === 0) {
      return {
        success: false,
        mode: "counter",
        error: "Équipe adverse requise pour le mode counter"
      };
    }

    const counterTeam = await this.opponentTeamAgent.generateCounterTeam(
      request.opponentTeam,
      request.candidatePool || [],
      request.constraints
    );

    return {
      success: true,
      mode: "counter",
      counterTeam,
      analysis: this.analyzeTeam(counterTeam)
    };
  }

  /**
   * Mode GENERATE: Génère une équipe complète depuis zéro
   */
  private async handleGenerate(request: TeamBuildingRequest): Promise<TeamBuildingResponse> {
    const generatedTeam = await this.ourTeamAgent.generateFullTeam(
      request.candidatePool || [],
      request.constraints
    );

    return {
      success: true,
      mode: "generate",
      generatedTeam,
      analysis: this.analyzeTeam(generatedTeam)
    };
  }

  // ============================================================================
  // ANALYSE D'ÉQUIPE (Utilise les Tools)
  // ============================================================================

  /**
   * Analyse complète d'une équipe
   */
  analyzeTeam(team: Pokemon[]): TeamAnalysis {
    if (team.length === 0) {
      return {
        strengths: [],
        weaknesses: ["Aucun Pokémon dans l'équipe"],
        typeChart: { weakTo: [], resistantTo: [], immuneTo: [] },
        roleDistribution: {},
        overallScore: 0,
        recommendations: ["Ajoutez des Pokémon à votre équipe"]
      };
    }

    // Utilise TypeEffectivenessTool
    const typeAnalysis = this.typeTool.analyzeTeamTypes(team);
    
    // Utilise StatsAnalyzerTool
    const statsAnalysis = this.statsTool.analyzeTeamStats(team);
    
    // Utilise RoleClassifierTool
    const roleAnalysis = this.roleTool.analyzeRoleDistribution(team);
    
    // Utilise MoveCoverageTool
    const coverageAnalysis = this.coverageTool.analyzeMoveCoverage(team);

    // Compiler les forces
    const strengths: string[] = [];
    if (typeAnalysis.immunities.size > 0) {
      strengths.push(`Immunités: ${Array.from(typeAnalysis.immunities).join(", ")}`);
    }
    if (typeAnalysis.resistances.size > 5) {
      strengths.push(`Bonnes résistances (${typeAnalysis.resistances.size} types)`);
    }
    if (roleAnalysis.missingRoles.length === 0) {
      strengths.push("Rôles essentiels couverts");
    }

    // Compiler les faiblesses
    const weaknesses: string[] = [];
    const criticalWeaknesses = Array.from(typeAnalysis.weaknesses)
      .filter(([_, count]) => count >= 3)
      .map(([type]) => type);
    
    if (criticalWeaknesses.length > 0) {
      weaknesses.push(`Faiblesses critiques: ${criticalWeaknesses.join(", ")}`);
    }
    if (roleAnalysis.missingRoles.length > 0) {
      weaknesses.push(`Rôles manquants: ${roleAnalysis.missingRoles.join(", ")}`);
    }

    // Score global (moyenne pondérée)
    // Calculer un score basé sur les analyses
    const typeScore = Math.max(0, 100 - typeAnalysis.weaknesses.size * 10 + typeAnalysis.immunities.size * 15);
    const coverageScore = this.coverageTool.calculateOffensiveCoverageScore(coverageAnalysis, team.length);
    const overallScore = Math.round(
      typeScore * 0.35 +
      statsAnalysis.bulkRating * 0.25 +
      roleAnalysis.balanceScore * 0.25 +
      coverageScore * 0.15
    );

    // Recommandations
    const recommendations: string[] = [];
    if (typeAnalysis.weaknesses.size > 4) {
      recommendations.push(`Attention: ${typeAnalysis.weaknesses.size} faiblesses de type`);
    }
    if (roleAnalysis.missingRoles.length > 0) {
      recommendations.push(`Ajoutez un ${roleAnalysis.missingRoles[0]}`);
    }
    if (roleAnalysis.overloadedRoles.length > 0) {
      recommendations.push(`Trop de ${roleAnalysis.overloadedRoles[0]}s dans l'équipe`);
    }

    return {
      strengths,
      weaknesses,
      typeChart: {
        weakTo: criticalWeaknesses,
        resistantTo: Array.from(typeAnalysis.resistances.keys()).slice(0, 8),
        immuneTo: Array.from(typeAnalysis.immunities)
      },
      roleDistribution: Object.fromEntries(roleAnalysis.roles),
      overallScore,
      recommendations
    };
  }

  // ============================================================================
  // ACCÈS AUX SOUS-AGENTS
  // ============================================================================

  getOurTeamAgent(): OurTeamAgent {
    return this.ourTeamAgent;
  }

  getOpponentTeamAgent(): OpponentTeamAgent {
    return this.opponentTeamAgent;
  }
}

export default TeamBuildingAgent;
