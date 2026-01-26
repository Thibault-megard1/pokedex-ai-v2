"use client";

type Nature = {
  name: string;
  increasedStat?: string | null;
  decreasedStat?: string | null;
};

type Props = {
  natures: Nature[];
};

export default function NaturesList({ natures }: Props) {
  if (!natures || natures.length === 0) {
    return (
      <div className="text-sm text-gray-500">
        Aucune nature disponible
      </div>
    );
  }

  const formatStatName = (stat: string | null | undefined) => {
    if (!stat) return null;
    return stat.replace(/-/g, " ");
  };

  return (
    <div>
      <p className="text-sm text-gray-600 mb-3">
        Un Pokémon peut avoir n'importe quelle nature. Les natures modifient les stats du Pokémon.
      </p>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-96 overflow-y-auto pr-2">
        {natures.map((nature) => {
          const isNeutral = !nature.increasedStat && !nature.decreasedStat;
          
          return (
            <div
              key={nature.name}
              className={`p-3 rounded-lg border-2 transition-all hover:shadow-md ${
                isNeutral
                  ? "bg-gray-50 border-gray-200"
                  : "bg-gradient-to-br from-green-50 to-red-50 border-gray-300"
              }`}
            >
              <div className="font-semibold text-sm capitalize text-gray-800">
                {nature.name}
              </div>
              
              {isNeutral ? (
                <div className="text-xs text-gray-500 mt-1">
                  Neutre
                </div>
              ) : (
                <div className="text-xs mt-1 space-y-0.5">
                  {nature.increasedStat && (
                    <div className="text-green-700 flex items-center gap-1">
                      <span>↑</span>
                      <span className="capitalize">{formatStatName(nature.increasedStat)}</span>
                    </div>
                  )}
                  {nature.decreasedStat && (
                    <div className="text-red-700 flex items-center gap-1">
                      <span>↓</span>
                      <span className="capitalize">{formatStatName(nature.decreasedStat)}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
