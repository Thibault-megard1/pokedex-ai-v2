"use client";

import Link from "next/link";

type EvolutionNode = {
  id: number;
  name: string;
  level?: number;
  item?: string;
  trigger?: string;
};

type Props = {
  currentStage: number | null;
  evolutionChain: EvolutionNode[];
  currentPokemonId: number;
};

export default function EvolutionDisplay({ currentStage, evolutionChain, currentPokemonId }: Props) {
  if (!evolutionChain || evolutionChain.length === 0) {
    return (
      <div className="text-sm text-gray-500 mt-2">
        Aucune évolution disponible
      </div>
    );
  }

  // Trouver l'index du Pokémon actuel
  const currentIndex = evolutionChain.findIndex(evo => evo.id === currentPokemonId);

  const getEvolutionMethod = (evo: EvolutionNode): string => {
    if (evo.level) return `Niveau ${evo.level}`;
    if (evo.item) return `Pierre: ${evo.item}`;
    if (evo.trigger === "trade") return "Échange";
    if (evo.trigger === "use-item") return "Utiliser un objet";
    return "Évolution spéciale";
  };

  return (
    <div className="mt-4 p-4 bg-white rounded-lg border">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">
        Chaîne d'évolution {currentStage && `(Stade ${currentStage})`}
      </h3>

      <div className="flex flex-wrap items-center gap-3">
        {evolutionChain.map((evo, index) => {
          const isCurrent = evo.id === currentPokemonId;
          const isPast = index < currentIndex;
          const isFuture = index > currentIndex;

          return (
            <div key={evo.id} className="flex items-center gap-3">
              <Link 
                href={`/pokemon/${evo.name}`}
                className={`flex flex-col items-center p-3 rounded-lg border-2 transition-all hover:scale-105 cursor-pointer group ${
                  isCurrent 
                    ? "border-blue-500 bg-blue-50 shadow-md" 
                    : isPast
                    ? "border-gray-300 bg-gray-50 opacity-60 hover:opacity-80"
                    : "border-green-400 bg-green-50 hover:border-green-500 hover:shadow-md"
                }`}
                title={`Voir ${evo.name}`}
              >
                <div className="relative">
                  <img
                    src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${evo.id}.png`}
                    alt={evo.name}
                    className={`w-16 h-16 pixelated transition-transform group-hover:scale-110 ${isPast ? "grayscale" : ""}`}
                  />
                  {isCurrent && (
                    <div className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                      ✓
                    </div>
                  )}
                </div>
                
                <div className="text-xs font-semibold capitalize mt-1 text-center">
                  {evo.name}
                </div>
                
                <div className="text-xs text-gray-500">
                  #{evo.id}
                </div>

                {isCurrent && (
                  <div className="mt-1 px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full">
                    Actuel
                  </div>
                )}
              </Link>

              {/* Flèche vers le prochain */}
              {index < evolutionChain.length - 1 && (
                <div className="flex flex-col items-center">
                  <div className="text-2xl text-gray-400">→</div>
                  {evolutionChain[index + 1] && (
                    <div className="text-xs text-center text-gray-600 mt-1 max-w-[80px]">
                      {getEvolutionMethod(evolutionChain[index + 1])}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {currentIndex !== -1 && currentIndex < evolutionChain.length - 1 && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm font-semibold text-green-800">
            Prochaine évolution:
          </p>
          <div className="flex items-center gap-2 mt-1">
            <Link 
              href={`/pokemon/${evolutionChain[currentIndex + 1].name}`}
              className="text-sm text-green-700 font-medium hover:underline capitalize"
            >
              {evolutionChain[currentIndex + 1].name}
            </Link>
            <span className="text-sm text-green-700">
              - {getEvolutionMethod(evolutionChain[currentIndex + 1])}
            </span>
          </div>
        </div>
      )}

      {currentIndex === evolutionChain.length - 1 && (
        <div className="mt-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
          <p className="text-sm font-semibold text-purple-800">
            ✨ Forme finale atteinte!
          </p>
        </div>
      )}
    </div>
  );
}
