"use client";

import TypeBadge from "@/components/TypeBadge";
import type { BadgeKey } from "@/lib/typeBadgesSprite";

type Props = {
  weakTo: string[];
  resistantTo: string[];
  immuneTo: string[];
  strongAgainst: string[];
  weakAgainst: string[];
};

export default function TypeRelations({ weakTo, resistantTo, immuneTo, strongAgainst, weakAgainst }: Props) {
  const renderTypeBadges = (types: string[]) => {
    if (types.length === 0) {
      return <span className="text-sm text-gray-400">Aucun</span>;
    }

    return (
      <div className="flex flex-wrap gap-2">
        {types.map(type => (
          <TypeBadge key={type} kind={type as BadgeKey} width={85} />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Défensif - Ce que subit le Pokémon */}
      <div className="p-4 bg-gradient-to-br from-red-50 to-orange-50 border-2 border-red-200 rounded-lg">
        <h3 className="text-lg font-semibold text-red-800 mb-3">🛡️ Défense</h3>
        
        <div className="space-y-3">
          {/* Faiblesses */}
          <div>
            <div className="text-sm font-semibold text-red-700 mb-2">
              ❌ Faible contre (x2 ou x4 dégâts)
            </div>
            {renderTypeBadges(weakTo)}
          </div>

          {/* Résistances */}
          <div>
            <div className="text-sm font-semibold text-green-700 mb-2">
              ✅ Résistant à (x0.5 ou x0.25 dégâts)
            </div>
            {renderTypeBadges(resistantTo)}
          </div>

          {/* Immunités */}
          {immuneTo.length > 0 && (
            <div>
              <div className="text-sm font-semibold text-purple-700 mb-2">
                🚫 Immunisé contre (x0 dégâts)
              </div>
              {renderTypeBadges(immuneTo)}
            </div>
          )}
        </div>
      </div>

      {/* Offensif - Ce que fait le Pokémon */}
      <div className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-lg">
        <h3 className="text-lg font-semibold text-blue-800 mb-3">⚔️ Attaque</h3>
        
        <div className="space-y-3">
          {/* Forces offensives */}
          <div>
            <div className="text-sm font-semibold text-blue-700 mb-2">
              💪 Efficace contre (x2 ou x4 dégâts)
            </div>
            {renderTypeBadges(strongAgainst)}
          </div>

          {/* Faiblesses offensives */}
          <div>
            <div className="text-sm font-semibold text-orange-700 mb-2">
              🔻 Peu efficace contre (x0.5 ou x0.25 dégâts)
            </div>
            {renderTypeBadges(weakAgainst)}
          </div>
        </div>
      </div>

      {/* Légende */}
      <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-600">
        <p className="font-semibold mb-1">💡 Légende :</p>
        <ul className="space-y-1 ml-4">
          <li>• <span className="font-semibold">x4</span> : Double faiblesse (2 types faibles au même type)</li>
          <li>• <span className="font-semibold">x2</span> : Faiblesse simple</li>
          <li>• <span className="font-semibold">x0.5</span> : Résistance simple</li>
          <li>• <span className="font-semibold">x0.25</span> : Double résistance</li>
          <li>• <span className="font-semibold">x0</span> : Immunité totale (aucun dégât)</li>
        </ul>
      </div>
    </div>
  );
}
