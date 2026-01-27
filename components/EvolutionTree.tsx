"use client";

import Link from "next/link";
import type { EvolutionNode } from "@/lib/pokeapi";
import { getDisplayName } from "@/lib/pokemonNames.utils";

type Props = {
  evolutionTree: EvolutionNode;
  currentPokemonId: number;
};

export default function EvolutionTree({ evolutionTree, currentPokemonId }: Props) {
  if (!evolutionTree) {
    return (
      <div className="text-sm text-gray-500 mt-2">
        Aucune évolution disponible
      </div>
    );
  }

  const getEvolutionMethod = (node: EvolutionNode): string => {
    if (node.formType === "mega") return node.requiredItem ? `Méga (${node.requiredItem})` : "Méga-Évolution";
    if (node.formType === "gmax") return node.requiredItem ? `Gigamax (${node.requiredItem})` : "Gigamax";
    if (node.level) return `Niv. ${node.level}`;
    if (node.item) return node.item.replace(/-/g, " ");
    if (node.trigger === "trade") return "Échange";
    if (node.trigger === "use-item") return "Objet";
    return "Spécial";
  };

  const cardAccent = (node: EvolutionNode) => {
    if (node.formType === "mega") return "border-purple-500 bg-purple-50 dark:bg-purple-950 dark:border-purple-700 ring-purple-200 dark:ring-purple-800";
    if (node.formType === "gmax") return "border-red-500 bg-red-50 dark:bg-red-950 dark:border-red-700 ring-red-200 dark:ring-red-800";
    return "border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-blue-400 dark:hover:border-blue-600 hover:shadow-md dark:hover:shadow-blue-500/20";
  };

  const renderNode = (node: EvolutionNode, depth: number = 0) => {
    const isCurrent = node.id === currentPokemonId;
    const hasMultipleEvolutions = node.evolvesTo && node.evolvesTo.length > 1;
    const displayName = getDisplayName(node.name, node.frenchName);

    return (
      <div key={node.id} className="flex flex-col items-center">
        {/* Card Pokemon */}
        <Link 
          href={`/pokemon/${node.name}`}
          className={`flex flex-col items-center p-4 rounded-xl border-2 transition-all hover:scale-105 cursor-pointer group min-w-[120px] ${
            isCurrent 
              ? "border-blue-500 bg-blue-50 dark:bg-blue-950 dark:border-blue-700 shadow-lg ring-2 ring-blue-300 dark:ring-blue-800" 
              : cardAccent(node)
          }`}
          title={`Voir ${displayName}`}
        >
          <div className="relative">
            <img
              src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${node.id}.png`}
              alt={displayName}
              className="w-20 h-20 pixelated transition-transform group-hover:scale-110"
            />
            {isCurrent && (
              <div className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold shadow-md">
                ✓
              </div>
            )}
          </div>
          
          <div className="text-sm font-bold text-center mt-2 text-gray-800 dark:text-gray-100">
            {displayName}
          </div>
          
          <div className="text-xs text-gray-600 dark:text-gray-400">
            #{node.id}
          </div>

          {node.formType && (
            <div className="mt-2 px-2 py-1 bg-gray-700 dark:bg-gray-600 text-white text-[11px] rounded-full font-semibold uppercase tracking-wide">
              {node.formType === "mega" ? "Méga" : node.formType === "gmax" ? "Gigamax" : node.formType}
            </div>
          )}

          {node.requiredItem && (
            <div className="mt-1 text-[11px] text-gray-600 dark:text-gray-300 text-center max-w-[140px] leading-tight">
              Objet: {node.requiredItem}
            </div>
          )}

          {isCurrent && (
            <div className="mt-2 px-2 py-1 bg-blue-500 text-white text-xs rounded-full font-semibold">
              Actuel
            </div>
          )}
        </Link>

        {/* Évolutions suivantes */}
        {node.evolvesTo && node.evolvesTo.length > 0 && (
          <div className="flex flex-col items-center mt-4">
            {hasMultipleEvolutions ? (
              // Affichage en éventail pour les évolutions multiples
              <div className="flex flex-col items-center">
                <div className="text-2xl text-gray-400 dark:text-gray-600 mb-2">↓</div>
                <div className="flex flex-wrap justify-center gap-6 max-w-5xl">
                  {node.evolvesTo.map((evolution) => (
                    <div key={evolution.id} className="flex flex-col items-center">
                      <div className="text-xs text-center text-gray-700 dark:text-gray-300 mb-2 max-w-[100px] px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-lg font-medium">
                        {getEvolutionMethod(evolution)}
                      </div>
                      {renderNode(evolution, depth + 1)}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              // Affichage linéaire pour une seule évolution
              <div className="flex flex-col items-center">
                <div className="text-2xl text-gray-400 dark:text-gray-600 my-2">↓</div>
                <div className="text-xs text-center text-gray-700 dark:text-gray-300 mb-2 max-w-[120px] px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-lg font-medium">
                  {getEvolutionMethod(node.evolvesTo[0])}
                </div>
                {renderNode(node.evolvesTo[0], depth + 1)}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // Trouver si le Pokémon actuel est la forme finale
  const findNodeById = (node: EvolutionNode, id: number): EvolutionNode | null => {
    if (node.id === id) return node;
    if (node.evolvesTo) {
      for (const child of node.evolvesTo) {
        const found = findNodeById(child, id);
        if (found) return found;
      }
    }
    return null;
  };

  const currentNode = findNodeById(evolutionTree, currentPokemonId);
  const isFinalForm = currentNode && (!currentNode.evolvesTo || currentNode.evolvesTo.length === 0);

  return (
    <div className="p-6 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-6 text-center">
        Chaîne d'évolution
      </h3>

      <div className="flex justify-center overflow-x-auto pb-4">
        {renderNode(evolutionTree)}
      </div>

      {isFinalForm && (
        <div className="mt-6 p-4 bg-purple-50 dark:bg-purple-950 border border-purple-300 dark:border-purple-700 rounded-xl text-center">
          <p className="text-sm font-bold text-purple-900 dark:text-purple-200">
            ✨ Forme finale atteinte !
          </p>
        </div>
      )}

      {currentNode && currentNode.evolvesTo && currentNode.evolvesTo.length > 0 && (
        <div className="mt-6 p-4 bg-green-50 dark:bg-green-950 border border-green-300 dark:border-green-700 rounded-xl">
          <p className="text-sm font-bold text-green-900 dark:text-green-200 mb-2">
            🌟 {currentNode.evolvesTo.length > 1 ? "Évolutions possibles :" : "Prochaine évolution :"}
          </p>
          <div className="flex flex-wrap gap-3">
            {currentNode.evolvesTo.map((evo) => (
              <div key={evo.id} className="flex items-center gap-2 text-sm">
                <Link 
                  href={`/pokemon/${evo.name}`}
                  className="text-green-700 dark:text-green-300 font-semibold hover:underline capitalize"
                >
                  {evo.name}
                </Link>
                <span className="text-green-600 dark:text-green-400 text-xs">
                  ({getEvolutionMethod(evo)})
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
