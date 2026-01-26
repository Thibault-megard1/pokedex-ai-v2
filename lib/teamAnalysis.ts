import { TYPE_CHART } from "./typeRelations";

export type TeamAnalysis = {
  weaknesses: Record<string, number>; // Type -> nombre de Pokémon faibles
  resistances: Record<string, number>; // Type -> nombre de Pokémon résistants
  coverages: string[]; // Types couverts offensivement
  gaps: string[]; // Types non couverts
  synergyScore: number; // 0-100
  recommendations: string[];
};

export function analyzeTeam(team: Array<{ types: string[] }>): TeamAnalysis {
  const weaknesses: Record<string, number> = {};
  const resistances: Record<string, number> = {};
  const offensiveTypes = new Set<string>();
  
  // Analyser chaque Pokémon
  team.forEach(pokemon => {
    pokemon.types.forEach(type => {
      offensiveTypes.add(type);
      
      // Calculer faiblesses
      Object.entries(TYPE_CHART[type] || {}).forEach(([attackType, multiplier]) => {
        if (multiplier > 1) {
          weaknesses[attackType] = (weaknesses[attackType] || 0) + 1;
        } else if (multiplier < 1) {
          resistances[attackType] = (resistances[attackType] || 0) + 1;
        }
      });
    });
  });

  // Identifier les gaps (types non couverts)
  const allTypes = Object.keys(TYPE_CHART);
  const gaps = allTypes.filter(type => !offensiveTypes.has(type));

  // Calculer score de synergie
  const weaknessCount = Object.values(weaknesses).reduce((a, b) => a + b, 0);
  const resistanceCount = Object.values(resistances).reduce((a, b) => a + b, 0);
  const coverage = offensiveTypes.size;
  
  const synergyScore = Math.min(100, Math.max(0,
    (coverage * 5) + (resistanceCount * 2) - (weaknessCount * 3) + 30
  ));

  // Générer recommandations
  const recommendations: string[] = [];
  
  // Faiblesses critiques (>3 Pokémon)
  const criticalWeaknesses = Object.entries(weaknesses)
    .filter(([_, count]) => count > 3)
    .map(([type]) => type);
  
  if (criticalWeaknesses.length > 0) {
    recommendations.push(
      `⚠️ Votre équipe est très faible contre: ${criticalWeaknesses.join(", ")}`
    );
  }

  // Manque de couverture
  if (gaps.length > 10) {
    recommendations.push(
      `📊 Vous ne couvrez que ${offensiveTypes.size}/18 types offensivement`
    );
  }

  // Suggestions positives
  if (synergyScore >= 70) {
    recommendations.push("✅ Excellente synergie d'équipe!");
  } else if (synergyScore >= 50) {
    recommendations.push("👍 Bonne synergie, quelques améliorations possibles");
  } else {
    recommendations.push("🔧 Équipe à améliorer pour plus de synergie");
  }

  return {
    weaknesses,
    resistances,
    coverages: Array.from(offensiveTypes),
    gaps,
    synergyScore,
    recommendations
  };
}

export function suggestPokemon(analysis: TeamAnalysis, currentTeam: Array<{ types: string[] }>) {
  const suggestions: Array<{ reason: string; types: string[] }> = [];

  // Trouver les types qui couvrent les faiblesses critiques
  const criticalWeaknesses = Object.entries(analysis.weaknesses)
    .filter(([_, count]) => count > 2)
    .map(([type]) => type);

  criticalWeaknesses.forEach(weakness => {
    // Chercher un type qui résiste à cette faiblesse
    Object.entries(TYPE_CHART).forEach(([defType, chart]) => {
      if (chart[weakness] && chart[weakness] < 1) {
        suggestions.push({
          reason: `Résiste à ${weakness}`,
          types: [defType]
        });
      }
    });
  });

  // Suggérer des types pour combler les gaps
  if (analysis.gaps.length > 0) {
    const topGaps = analysis.gaps.slice(0, 3);
    topGaps.forEach(gap => {
      suggestions.push({
        reason: `Ajoute couverture ${gap}`,
        types: [gap]
      });
    });
  }

  return suggestions.slice(0, 5); // Top 5 suggestions
}
