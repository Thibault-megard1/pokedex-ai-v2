"use client";

import { useMemo } from "react";
import { analyzeTeam, suggestPokemon, type TeamAnalysis } from "@/lib/teamAnalysis";
import TypeBadge from "@/components/TypeBadge";
import type { BadgeKey } from "@/lib/typeBadgesSprite";

type Props = {
  team: Array<{ types: string[]; name: string }>;
};

export default function TeamStrategyBuilder({ team }: Props) {
  const analysis = useMemo(() => {
    if (team.length === 0) return null;
    return analyzeTeam(team);
  }, [team]);

  const suggestions = useMemo(() => {
    if (!analysis) return [];
    return suggestPokemon(analysis, team);
  }, [analysis, team]);

  if (!analysis) {
    return (
      <div className="card p-4">
        <p className="text-gray-500 text-sm">Ajoutez des Pokémon à votre équipe pour voir l'analyse</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Score de Synergie */}
      <div className="card p-4">
        <h3 className="font-bold text-lg mb-2">Score de Synergie</h3>
        <div className="flex items-center gap-3">
          <div className="flex-1 h-6 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-6 rounded-full transition-all ${
                analysis.synergyScore >= 70 ? "bg-green-500" :
                analysis.synergyScore >= 50 ? "bg-yellow-500" :
                "bg-red-500"
              }`}
              style={{ width: `${analysis.synergyScore}%` }}
            />
          </div>
          <span className="font-bold text-2xl">{analysis.synergyScore}/100</span>
        </div>
      </div>

      {/* Recommandations */}
      <div className="card p-4">
        <h3 className="font-bold text-lg mb-3">📋 Recommandations</h3>
        <div className="space-y-2">
          {analysis.recommendations.map((rec, i) => (
            <div key={i} className="p-2 bg-gray-50 rounded text-sm">
              {rec}
            </div>
          ))}
        </div>
      </div>

      {/* Couverture Offensive */}
      <div className="card p-4">
        <h3 className="font-bold text-lg mb-3">⚔️ Couverture Offensive</h3>
        <div className="flex flex-wrap gap-2">
          {analysis.coverages.map(type => (
            <TypeBadge key={type} kind={type as BadgeKey} width={85} />
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-2">
          {analysis.coverages.length}/18 types couverts
        </p>
      </div>

      {/* Faiblesses Principales */}
      {Object.keys(analysis.weaknesses).length > 0 && (
        <div className="card p-4">
          <h3 className="font-bold text-lg mb-3">⚠️ Faiblesses Principales</h3>
          <div className="space-y-2">
            {Object.entries(analysis.weaknesses)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 5)
              .map(([type, count]) => (
                <div key={type} className="flex items-center justify-between">
                  <TypeBadge kind={type as BadgeKey} width={85} />
                  <span className="text-sm text-red-600 font-semibold">
                    {count} Pokémon faible{count > 1 ? "s" : ""}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Résistances */}
      {Object.keys(analysis.resistances).length > 0 && (
        <div className="card p-4">
          <h3 className="font-bold text-lg mb-3">🛡️ Résistances</h3>
          <div className="space-y-2">
            {Object.entries(analysis.resistances)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 5)
              .map(([type, count]) => (
                <div key={type} className="flex items-center justify-between">
                  <TypeBadge kind={type as BadgeKey} width={85} />
                  <span className="text-sm text-green-600 font-semibold">
                    {count} Pokémon résistant{count > 1 ? "s" : ""}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="card p-4">
          <h3 className="font-bold text-lg mb-3">💡 Suggestions</h3>
          <div className="space-y-2">
            {suggestions.map((sug, i) => (
              <div key={i} className="p-3 bg-blue-50 border border-blue-200 rounded">
                <p className="text-sm font-semibold text-blue-900">{sug.reason}</p>
                <div className="flex gap-2 mt-2">
                  {sug.types.map(type => (
                    <TypeBadge key={type} kind={type as BadgeKey} width={70} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
