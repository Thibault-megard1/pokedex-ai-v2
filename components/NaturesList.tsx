"use client";

import { useState } from "react";

type Nature = {
  name: string;
  increasedStat?: string | null;
  decreasedStat?: string | null;
};

type Props = {
  natures: Nature[];
};

// Nature descriptions with lore
const NATURE_INFO: Record<string, { description: string; lore: string }> = {
  hardy: { description: "Aucun changement de stats.", lore: "Un Pokémon robuste qui ne se laisse pas facilement influencer." },
  lonely: { description: "Augmente l'Attaque, diminue la Défense.", lore: "Préfère combattre seul, privilégiant l'offensive à la défense." },
  brave: { description: "Augmente l'Attaque, diminue la Vitesse.", lore: "Courageux mais sans se presser, frappe fort mais agit lentement." },
  adamant: { description: "Augmente l'Attaque, diminue l'Attaque Spéciale.", lore: "Déterminé et concentré sur la force physique pure." },
  naughty: { description: "Augmente l'Attaque, diminue la Défense Spéciale.", lore: "Espiègle et offensif, néglige sa défense magique." },
  bold: { description: "Augmente la Défense, diminue l'Attaque.", lore: "Audacieux et résistant, préfère encaisser plutôt qu'attaquer." },
  docile: { description: "Aucun changement de stats.", lore: "Docile et équilibré, s'adapte à toutes les situations." },
  relaxed: { description: "Augmente la Défense, diminue la Vitesse.", lore: "Décontracté et patient, privilégie la résistance." },
  impish: { description: "Augmente la Défense, diminue l'Attaque Spéciale.", lore: "Malicieux et robuste, se moque des attaques spéciales." },
  lax: { description: "Augmente la Défense, diminue la Défense Spéciale.", lore: "Relâché mais solide physiquement." },
  timid: { description: "Augmente la Vitesse, diminue l'Attaque.", lore: "Craintif mais rapide comme l'éclair." },
  hasty: { description: "Augmente la Vitesse, diminue la Défense.", lore: "Impulsif et pressé, fonce sans réfléchir." },
  serious: { description: "Aucun changement de stats.", lore: "Sérieux et méthodique, garde un équilibre parfait." },
  jolly: { description: "Augmente la Vitesse, diminue l'Attaque Spéciale.", lore: "Joyeux et énergique, toujours en mouvement." },
  naive: { description: "Augmente la Vitesse, diminue la Défense Spéciale.", lore: "Naïf et insouciant, court vite sans penser au danger." },
  modest: { description: "Augmente l'Attaque Spéciale, diminue l'Attaque.", lore: "Modeste mais puissant mentalement." },
  mild: { description: "Augmente l'Attaque Spéciale, diminue la Défense.", lore: "Doux mais doté d'un pouvoir mystique fort." },
  quiet: { description: "Augmente l'Attaque Spéciale, diminue la Vitesse.", lore: "Silencieux et réfléchi, maîtrise les arts mystiques." },
  bashful: { description: "Aucun changement de stats.", lore: "Timide mais équilibré dans ses capacités." },
  rash: { description: "Augmente l'Attaque Spéciale, diminue la Défense Spéciale.", lore: "Impétueux et puissant, attaque sans se protéger." },
  calm: { description: "Augmente la Défense Spéciale, diminue l'Attaque.", lore: "Calme et serein, résiste aux attaques mentales." },
  gentle: { description: "Augmente la Défense Spéciale, diminue la Défense.", lore: "Gentil et spirituellement fort." },
  sassy: { description: "Augmente la Défense Spéciale, diminue la Vitesse.", lore: "Effronté mais mentalement résistant." },
  careful: { description: "Augmente la Défense Spéciale, diminue l'Attaque Spéciale.", lore: "Prudent et défensif contre les menaces psychiques." },
  quirky: { description: "Aucun changement de stats.", lore: "Excentrique et imprévisible, mais équilibré." },
};

export default function NaturesList({ natures }: Props) {
  const [selectedNature, setSelectedNature] = useState<string | null>(null);

  if (!natures || natures.length === 0) {
    return (
      <div className="text-sm text-gray-500 dark:text-gray-400">
        Aucune nature disponible
      </div>
    );
  }

  const formatStatName = (stat: string | null | undefined) => {
    if (!stat) return null;
    return stat.replace(/-/g, " ");
  };

  const getNatureInfo = (natureName: string) => {
    return NATURE_INFO[natureName.toLowerCase()] || { 
      description: "Information non disponible.",
      lore: "Un Pokémon avec cette nature a ses propres caractéristiques uniques."
    };
  };

  return (
    <div>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
        Un Pokémon peut avoir n'importe quelle nature. Les natures modifient les stats du Pokémon. Cliquez sur une nature pour en savoir plus.
      </p>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-96 overflow-y-auto pr-2">
        {natures.map((nature) => {
          const isNeutral = !nature.increasedStat && !nature.decreasedStat;
          
          return (
            <button
              key={nature.name}
              onClick={() => setSelectedNature(nature.name)}
              className={`p-3 rounded-lg border-2 transition-all hover:shadow-md cursor-pointer text-left ${
                isNeutral
                  ? "bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600"
                  : "bg-gradient-to-br from-green-50 to-red-50 dark:from-green-900 dark:to-red-900 border-gray-300 dark:border-gray-600"
              }`}
            >
              <div className="font-semibold text-sm capitalize text-gray-800 dark:text-gray-100">
                {nature.name}
              </div>
              
              {isNeutral ? (
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Neutre
                </div>
              ) : (
                <div className="text-xs mt-1 space-y-0.5">
                  {nature.increasedStat && (
                    <div className="text-green-700 dark:text-green-400 flex items-center gap-1">
                      <span>↑</span>
                      <span className="capitalize">{formatStatName(nature.increasedStat)}</span>
                    </div>
                  )}
                  {nature.decreasedStat && (
                    <div className="text-red-700 dark:text-red-400 flex items-center gap-1">
                      <span>↓</span>
                      <span className="capitalize">{formatStatName(nature.decreasedStat)}</span>
                    </div>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Nature Detail Modal */}
      {selectedNature && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedNature(null)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-2xl font-bold capitalize text-gray-900 dark:text-white">
                Nature {selectedNature}
              </h2>
              <button
                onClick={() => setSelectedNature(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl font-bold"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              {/* Effect Description */}
              <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
                <h3 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">📊 Effet sur les stats</h3>
                <p className="text-sm text-blue-900 dark:text-blue-200">
                  {getNatureInfo(selectedNature).description}
                </p>
              </div>

              {/* Lore */}
              <div className="bg-purple-50 dark:bg-purple-900/30 rounded-lg p-4 border border-purple-200 dark:border-purple-700">
                <h3 className="font-semibold text-purple-800 dark:text-purple-300 mb-2">✨ Personnalité</h3>
                <p className="text-sm text-purple-900 dark:text-purple-200">
                  {getNatureInfo(selectedNature).lore}
                </p>
              </div>

              {/* Stat Changes */}
              {(() => {
                const nature = natures.find(n => n.name === selectedNature);
                const isNeutral = !nature?.increasedStat && !nature?.decreasedStat;
                
                return !isNeutral && nature ? (
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                    <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">📈 Modifications</h3>
                    <div className="space-y-2">
                      {nature.increasedStat && (
                        <div className="flex items-center gap-2">
                          <span className="text-green-600 dark:text-green-400 font-bold">↑ +10%</span>
                          <span className="text-sm capitalize text-gray-700 dark:text-gray-300">
                            {formatStatName(nature.increasedStat)}
                          </span>
                        </div>
                      )}
                      {nature.decreasedStat && (
                        <div className="flex items-center gap-2">
                          <span className="text-red-600 dark:text-red-400 font-bold">↓ -10%</span>
                          <span className="text-sm capitalize text-gray-700 dark:text-gray-300">
                            {formatStatName(nature.decreasedStat)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Cette nature est neutre et ne modifie aucune statistique.
                    </p>
                  </div>
                );
              })()}
            </div>

            <button
              onClick={() => setSelectedNature(null)}
              className="w-full mt-6 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
