/**
 * Team Scorer Tool
 * 
 * Outil pour scorer et évaluer des équipes et des candidats.
 * Combine les analyses de types, rôles et synergies.
 */

import {
  Pokemon,
  getTotalStats,
  classifyRole,
  PokemonRole
} from "../shared/types";
import { TypeAnalysisTool, TypeAnalysisResult } from "./TypeAnalysisTool";
import { RoleClassifierTool, RoleAnalysisResult } from "./RoleClassifierTool";
import { SynergyTool, SynergyResult } from "./SynergyTool";

// ============================================================================
// TYPES
// ============================================================================

export interface TeamScoreResult {
  overall: number;
  breakdown: {
    types: number;
    roles: number;
    synergy: number;
    stats: number;
  };
  typeAnalysis: TypeAnalysisResult;
  roleAnalysis: RoleAnalysisResult;
  synergyAnalysis: SynergyResult;
  recommendations: string[];
  grade: "S" | "A" | "B" | "C" | "D" | "F";
}

export interface CandidateScore {
  pokemon: Pokemon;
  score: number;
  breakdown: {
    typeImprovement: number;
    roleValue: number;
    synergyScore: number;
    statsValue: number;
  };
  reasoning: string[];
}

// ============================================================================
// TEAM SCORER TOOL
// ============================================================================

export class TeamScorerTool {
  private typeAnalysisTool: TypeAnalysisTool;
  private roleClassifierTool: RoleClassifierTool;
  private synergyTool: SynergyTool;

  constructor() {
    this.typeAnalysisTool = new TypeAnalysisTool();
    this.roleClassifierTool = new RoleClassifierTool();
    this.synergyTool = new SynergyTool();
  }

  /**
   * Évalue une équipe complète
   */
  scoreTeam(team: Pokemon[]): TeamScoreResult {
    if (team.length === 0) {
      return {
        overall: 0,
        breakdown: { types: 0, roles: 0, synergy: 0, stats: 0 },
        typeAnalysis: { weaknesses: [], resistances: [], immunities: [], coverage: [], uncoveredTypes: [], score: 0 },
        roleAnalysis: { distribution: { sweeper: 0, wall: 0, tank: 0, support: 0, pivot: 0 }, missingRoles: [], overloadedRoles: [], balance: 0, recommendations: [] },
        synergyAnalysis: { score: 0, cores: [], weatherSynergy: null, complementaryPairs: [], conflicts: [] },
        recommendations: ["Équipe vide"],
        grade: "F"
      };
    }

    // Analyser chaque aspect
    const typeAnalysis = this.typeAnalysisTool.analyzeTeam(team);
    const roleAnalysis = this.roleClassifierTool.analyzeTeamRoles(team);
    const synergyAnalysis = this.synergyTool.analyzeTeamSynergy(team);
    
    // Calculer le score de stats
    const avgStats = team.reduce((sum, p) => sum + getTotalStats(p), 0) / team.length;
    const statsScore = Math.min(100, (avgStats / 600) * 100);
    
    // Score global pondéré
    const breakdown = {
      types: typeAnalysis.score,
      roles: roleAnalysis.balance,
      synergy: synergyAnalysis.score,
      stats: statsScore
    };
    
    const overall = Math.round(
      breakdown.types * 0.30 +
      breakdown.roles * 0.25 +
      breakdown.synergy * 0.25 +
      breakdown.stats * 0.20
    );
    
    // Collecter les recommandations
    const recommendations: string[] = [
      ...typeAnalysis.score < 50 ? [`Améliorer la couverture de types`] : [],
      ...roleAnalysis.recommendations,
      ...synergyAnalysis.conflicts.length > 0 ? [`Résoudre ${synergyAnalysis.conflicts.length} conflits`] : []
    ];
    
    // Déterminer le grade
    let grade: "S" | "A" | "B" | "C" | "D" | "F";
    if (overall >= 90) grade = "S";
    else if (overall >= 80) grade = "A";
    else if (overall >= 70) grade = "B";
    else if (overall >= 60) grade = "C";
    else if (overall >= 50) grade = "D";
    else grade = "F";
    
    return {
      overall,
      breakdown,
      typeAnalysis,
      roleAnalysis,
      synergyAnalysis,
      recommendations,
      grade
    };
  }

  /**
   * Évalue un candidat pour rejoindre l'équipe
   */
  scoreCandidateForTeam(team: Pokemon[], candidate: Pokemon): CandidateScore {
    const reasoning: string[] = [];
    
    // Amélioration des types
    const typeEval = this.typeAnalysisTool.evaluateAddition(team, candidate);
    const typeImprovement = Math.max(0, 50 + typeEval.improvement * 2);
    reasoning.push(...typeEval.reasoning);
    
    // Valeur du rôle
    const roleAnalysis = this.roleClassifierTool.analyzeTeamRoles(team);
    const candidateRole = classifyRole(candidate);
    let roleValue = 50;
    
    if (roleAnalysis.missingRoles.includes(candidateRole)) {
      roleValue = 90;
      reasoning.push(`Remplit le rôle manquant: ${candidateRole}`);
    } else if (roleAnalysis.overloadedRoles.includes(candidateRole)) {
      roleValue = 30;
      reasoning.push(`Rôle déjà surchargé: ${candidateRole}`);
    }
    
    // Synergie avec l'équipe
    const synergyScore = this.synergyTool.evaluateCandidateSynergy(team, candidate);
    if (synergyScore >= 70) {
      reasoning.push("Bonne synergie avec l'équipe");
    }
    
    // Valeur des stats
    const candidateStats = getTotalStats(candidate);
    const statsValue = Math.min(100, (candidateStats / 600) * 100);
    
    // Score global
    const score = Math.round(
      typeImprovement * 0.35 +
      roleValue * 0.25 +
      synergyScore * 0.25 +
      statsValue * 0.15
    );
    
    return {
      pokemon: candidate,
      score,
      breakdown: {
        typeImprovement,
        roleValue,
        synergyScore,
        statsValue
      },
      reasoning
    };
  }

  /**
   * Classe plusieurs candidats pour une équipe
   */
  rankCandidates(team: Pokemon[], candidates: Pokemon[]): CandidateScore[] {
    return candidates
      .map(c => this.scoreCandidateForTeam(team, c))
      .sort((a, b) => b.score - a.score);
  }

  /**
   * Compare deux équipes
   */
  compareTeams(team1: Pokemon[], team2: Pokemon[]): {
    team1Score: TeamScoreResult;
    team2Score: TeamScoreResult;
    winner: 1 | 2 | 0;
    comparison: string;
  } {
    const score1 = this.scoreTeam(team1);
    const score2 = this.scoreTeam(team2);
    
    let winner: 1 | 2 | 0;
    if (score1.overall > score2.overall + 5) winner = 1;
    else if (score2.overall > score1.overall + 5) winner = 2;
    else winner = 0;
    
    const comparison = winner === 0 
      ? "Les deux équipes sont équivalentes"
      : `L'équipe ${winner} est meilleure (${winner === 1 ? score1.overall : score2.overall} vs ${winner === 1 ? score2.overall : score1.overall})`;
    
    return {
      team1Score: score1,
      team2Score: score2,
      winner,
      comparison
    };
  }
}

export default TeamScorerTool;
