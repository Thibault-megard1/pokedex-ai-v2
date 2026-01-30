"use client";

import { useEffect, useState } from "react";
import { typeColors } from "@/lib/typeStyle";
import TypeIcon from "@/components/TypeIcon";
import TypeBadge from "@/components/TypeBadge";
import MoveCategoryBadge from "@/components/MoveCategoryBadge";

type MoveDetail = {
  name: string;
  frenchName: string | null;
  type: string;
  power: number | null;
  accuracy: number | null;
  pp: number;
  damageClass: string;
  effectChance: number | null;
  effectDescription: string;
  shortEffect: string;
  priority: number;
  target: string;
  ailment: string | null;
  critRate: number;
  drain: number;
  flinchChance: number;
  statChanges: Array<{ stat: string; change: number }>;
};

type Props = {
  moveName: string;
  isOpen: boolean;
  onClose: () => void;
};

export default function MoveDetailModal({ moveName, isOpen, onClose }: Props) {
  const [moveDetail, setMoveDetail] = useState<MoveDetail | null>(null);
  const [loading, setLoading] = useState(false);

  // Fonction pour nettoyer les descriptions de l'API
  const cleanEffectText = (text: string, effectChance?: number | null): string => {
    if (!text) return "";
    
    // Remplacer les marqueurs spéciaux
    let cleaned = text
      .replace(/\$effect_chance/g, effectChance ? `${effectChance}%` : "")
      .replace(/\[/g, "")
      .replace(/\]/g, "")
      .replace(/\{/g, "")
      .replace(/\}/g, "")
      .trim();
    
    return cleaned;
  };

  useEffect(() => {
    if (!isOpen || !moveName) {
      setMoveDetail(null);
      return;
    }

    const fetchMoveDetail = async () => {
      setLoading(true);
      try {
        const res = await fetch(`https://pokeapi.co/api/v2/move/${moveName}`);
        if (!res.ok) throw new Error("Failed to fetch move");
        const data = await res.json();

        const frenchName = data.names?.find((n: any) => n.language.name === "fr")?.name ?? null;
        const frenchEffect = data.effect_entries?.find((e: any) => e.language.name === "fr")?.effect ?? "";
        const englishEffect = data.effect_entries?.find((e: any) => e.language.name === "en")?.effect ?? "";
        const shortEffect = data.effect_entries?.find((e: any) => e.language.name === "en")?.short_effect ?? "";
        const effectChance = data.effect_chance;

        // Nettoyer les descriptions
        const cleanedFrenchEffect = cleanEffectText(frenchEffect, effectChance);
        const cleanedEnglishEffect = cleanEffectText(englishEffect, effectChance);
        const cleanedShortEffect = cleanEffectText(shortEffect, effectChance);

        // Extraire les changements de stats
        const statChanges = data.stat_changes?.map((sc: any) => ({
          stat: sc.stat.name,
          change: sc.change
        })) ?? [];

        setMoveDetail({
          name: data.name,
          frenchName,
          type: data.type?.name ?? "unknown",
          power: data.power,
          accuracy: data.accuracy,
          pp: data.pp ?? 0,
          damageClass: data.damage_class?.name ?? "status",
          effectChance,
          effectDescription: cleanedFrenchEffect || cleanedEnglishEffect,
          shortEffect: cleanedShortEffect,
          priority: data.priority ?? 0,
          target: data.target?.name ?? "selected-pokemon",
          ailment: data.meta?.ailment?.name ?? null,
          critRate: data.meta?.crit_rate ?? 0,
          drain: data.meta?.drain ?? 0,
          flinchChance: data.meta?.flinch_chance ?? 0,
          statChanges,
        });
      } catch (error) {
        console.error("Error fetching move detail:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMoveDetail();
  }, [moveName, isOpen]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const getDamageClassLabel = (damageClass: string) => {
    switch (damageClass) {
      case "physical": return "Physique";
      case "special": return "Spéciale";
      case "status": return "Statut";
      default: return damageClass;
    }
  };

  const getDamageClassColor = (damageClass: string) => {
    switch (damageClass) {
      case "physical": return "bg-orange-100 text-orange-800 border-orange-300";
      case "special": return "bg-purple-100 text-purple-800 border-purple-300";
      case "status": return "bg-gray-100 text-gray-800 border-gray-300";
      default: return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto"
      onClick={handleBackdropClick}
    >
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-lg w-full my-8 max-h-[85vh] overflow-y-auto">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-300">Chargement...</p>
          </div>
        ) : moveDetail ? (
          <div>
            {/* Header */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold capitalize text-gray-900 dark:text-white">
                    {moveDetail.frenchName || moveDetail.name.replace(/-/g, " ")}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 capitalize italic">
                    {moveDetail.name.replace(/-/g, " ")}
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl font-bold leading-none"
                  aria-label="Fermer"
                >
                  ×
                </button>
              </div>

              {/* Type et Catégorie */}
              <div className="flex flex-wrap gap-3 mt-4">
                <TypeBadge kind={moveDetail.type} width={120} />
                <MoveCategoryBadge 
                  category={moveDetail.damageClass as "physical" | "special" | "status"} 
                  width={120} 
                />
              </div>
            </div>

            {/* Animation - Affichage visuel basé sur le type */}
            <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 border-b border-gray-200 dark:border-gray-700">
              <div className="flex flex-col items-center justify-center min-h-[180px] relative">
                {/* Animation de fond basée sur le type */}
                <div 
                  className="absolute inset-0 opacity-20"
                  style={{
                    background: `radial-gradient(circle, ${typeColors[moveDetail.type] || '#999'} 0%, transparent 70%)`,
                    animation: 'pulse 2s ease-in-out infinite'
                  }}
                />
                
                {/* Icône du type animée */}
                <div className="relative z-10 flex flex-col items-center gap-4">
                  <div 
                    className="w-40 h-40 rounded-full flex items-center justify-center shadow-2xl"
                    style={{ 
                      backgroundColor: typeColors[moveDetail.type] || '#999',
                      boxShadow: `
                        0 0 40px 20px ${typeColors[moveDetail.type] || '#999'}80,
                        0 0 80px 40px ${typeColors[moveDetail.type] || '#999'}40,
                        0 0 120px 60px ${typeColors[moveDetail.type] || '#999'}20
                      `,
                      animation: 'bounce 2s ease-in-out infinite'
                    }}
                  >
                    <TypeIcon type={moveDetail.type} size={96} />
                  </div>
                </div>
              </div>

              <style jsx>{`
                @keyframes pulse {
                  0%, 100% {
                    transform: scale(1);
                    opacity: 0.2;
                  }
                  50% {
                    transform: scale(1.5);
                    opacity: 0.3;
                  }
                }
                @keyframes bounce {
                  0%, 100% {
                    transform: translateY(0);
                  }
                  50% {
                    transform: translateY(-10px);
                  }
                }
              `}</style>
            </div>

            {/* Stats */}
            <div className="p-6 grid grid-cols-2 gap-4">
              <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-3 border border-blue-200 dark:border-blue-700">
                <div className="text-xs text-blue-600 dark:text-blue-300 font-semibold uppercase">Puissance</div>
                <div className="text-2xl font-bold text-blue-800 dark:text-blue-200 mt-1">
                  {moveDetail.power ?? "—"}
                </div>
              </div>

              <div className="bg-green-50 dark:bg-green-900/30 rounded-lg p-3 border border-green-200 dark:border-green-700">
                <div className="text-xs text-green-600 dark:text-green-300 font-semibold uppercase">Précision</div>
                <div className="text-2xl font-bold text-green-800 dark:text-green-200 mt-1">
                  {moveDetail.accuracy ? `${moveDetail.accuracy}%` : "—"}
                </div>
              </div>

              <div className="bg-purple-50 dark:bg-purple-900/30 rounded-lg p-3 border border-purple-200 dark:border-purple-700">
                <div className="text-xs text-purple-600 dark:text-purple-300 font-semibold uppercase">PP</div>
                <div className="text-2xl font-bold text-purple-800 dark:text-purple-200 mt-1">
                  {moveDetail.pp}
                </div>
              </div>

              {moveDetail.effectChance && (
                <div className="bg-orange-50 dark:bg-orange-900/30 rounded-lg p-3 border border-orange-200 dark:border-orange-700">
                  <div className="text-xs text-orange-600 dark:text-orange-300 font-semibold uppercase">Chance effet</div>
                  <div className="text-2xl font-bold text-orange-800 dark:text-orange-200 mt-1">
                    {moveDetail.effectChance}%
                  </div>
                </div>
              )}
            </div>

            {/* Informations détaillées supplémentaires */}
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">📋 Détails de l'attaque</h3>
              
              <div className="grid grid-cols-2 gap-3 text-sm">
                {/* Priorité */}
                <div className="flex items-center gap-2">
                  <span className="text-gray-600 dark:text-gray-400">Priorité:</span>
                  <span className={`font-semibold ${
                    moveDetail.priority > 0 ? 'text-green-600 dark:text-green-400' :
                    moveDetail.priority < 0 ? 'text-red-600 dark:text-red-400' :
                    'text-gray-700 dark:text-gray-300'
                  }`}>
                    {moveDetail.priority > 0 ? `+${moveDetail.priority}` : moveDetail.priority}
                  </span>
                </div>

                {/* Cible */}
                <div className="flex items-center gap-2">
                  <span className="text-gray-600 dark:text-gray-400">Cible:</span>
                  <span className="font-semibold text-gray-700 dark:text-gray-300 capitalize">
                    {moveDetail.target.replace(/-/g, ' ')}
                  </span>
                </div>

                {/* Ailment */}
                {moveDetail.ailment && moveDetail.ailment !== 'none' && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600 dark:text-gray-400">Statut:</span>
                    <span className="font-semibold text-purple-600 dark:text-purple-400 capitalize">
                      {moveDetail.ailment.replace(/-/g, ' ')}
                    </span>
                  </div>
                )}

                {/* Taux de critique */}
                {moveDetail.critRate > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600 dark:text-gray-400">Taux critique:</span>
                    <span className="font-semibold text-yellow-600 dark:text-yellow-400">
                      +{moveDetail.critRate}
                    </span>
                  </div>
                )}

                {/* Drain */}
                {moveDetail.drain !== 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600 dark:text-gray-400">Drainage:</span>
                    <span className={`font-semibold ${
                      moveDetail.drain > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                    }`}>
                      {moveDetail.drain > 0 ? `+${moveDetail.drain}%` : `${moveDetail.drain}%`}
                    </span>
                  </div>
                )}

                {/* Chance de flinch */}
                {moveDetail.flinchChance > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600 dark:text-gray-400">Chance flinch:</span>
                    <span className="font-semibold text-orange-600 dark:text-orange-400">
                      {moveDetail.flinchChance}%
                    </span>
                  </div>
                )}
              </div>

              {/* Changements de stats */}
              {moveDetail.statChanges.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                  <h4 className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">Modifications de stats:</h4>
                  <div className="flex flex-wrap gap-2">
                    {moveDetail.statChanges.map((sc, idx) => (
                      <span
                        key={idx}
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          sc.change > 0
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-300 dark:border-green-700'
                            : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-700'
                        }`}
                      >
                        {sc.stat.replace(/-/g, ' ')}: {sc.change > 0 ? '+' : ''}{sc.change}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Description */}
            <div className="p-6 border-t border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                📖 Description de l'attaque
              </h3>
              
              {/* Description principale avec style narratif */}
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-700 mb-4">
                <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed">
                  {moveDetail.effectDescription || "Aucune description disponible."}
                </p>
              </div>

              {/* Contexte tactique */}
              <div className="space-y-3">
                {/* Utilisation au combat */}
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
                  <h4 className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2 flex items-center gap-1">
                    ⚔️ Utilisation tactique
                  </h4>
                  <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                    {moveDetail.damageClass === "physical" && "Cette attaque utilise la force physique du Pokémon pour infliger des dégâts directs. Les Pokémon avec une haute Attaque excelleront avec cette capacité."}
                    {moveDetail.damageClass === "special" && "Cette attaque canalise l'énergie spéciale du Pokémon pour frapper l'adversaire. Les Pokémon avec une haute Attaque Spéciale brilleront avec cette technique."}
                    {moveDetail.damageClass === "status" && "Cette capacité de soutien ne cause pas de dégâts directs mais peut influencer le cours du combat par ses effets stratégiques."}
                    {moveDetail.priority > 0 && " Son exécution prioritaire permet de frapper en premier, ignorant la Vitesse."}
                    {moveDetail.priority < 0 && " Cette attaque est plus lente et sera généralement exécutée en dernier."}
                  </p>
                </div>

                {/* Effets spéciaux */}
                {(moveDetail.ailment && moveDetail.ailment !== 'none' || moveDetail.statChanges.length > 0 || moveDetail.drain !== 0) && (
                  <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 border border-purple-200 dark:border-purple-700">
                    <h4 className="text-xs font-semibold text-purple-700 dark:text-purple-300 mb-2 flex items-center gap-1">
                      ✨ Effets spéciaux
                    </h4>
                    <div className="text-xs text-purple-900 dark:text-purple-200 space-y-1">
                      {moveDetail.ailment && moveDetail.ailment !== 'none' && (
                        <p>• Inflige l'altération de statut : <span className="font-semibold capitalize">{moveDetail.ailment.replace(/-/g, ' ')}</span></p>
                      )}
                      {moveDetail.drain > 0 && (
                        <p>• Le Pokémon récupère {moveDetail.drain}% des dégâts infligés, une technique vitale pour la survie prolongée.</p>
                      )}
                      {moveDetail.drain < 0 && (
                        <p>• L'attaque inflige un recul de {Math.abs(moveDetail.drain)}% des dégâts au lanceur - à utiliser avec précaution.</p>
                      )}
                      {moveDetail.statChanges.length > 0 && (
                        <p>• Modifie les statistiques : {moveDetail.statChanges.map(sc => 
                          `${sc.stat.replace(/-/g, ' ')} ${sc.change > 0 ? '+' + sc.change : sc.change}`
                        ).join(', ')}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Conseil stratégique */}
                <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3 border border-amber-200 dark:border-amber-700">
                  <h4 className="text-xs font-semibold text-amber-700 dark:text-amber-300 mb-2 flex items-center gap-1">
                    💡 Conseil du Professeur
                  </h4>
                  <p className="text-xs text-amber-900 dark:text-amber-200 leading-relaxed italic">
                    {moveDetail.power && moveDetail.power >= 100 && "Une attaque dévastatrice ! Utilisez-la au moment crucial pour renverser le combat."}
                    {moveDetail.power && moveDetail.power >= 80 && moveDetail.power < 100 && "Une capacité puissante et fiable, excellent choix pour le combat."}
                    {moveDetail.power && moveDetail.power < 80 && moveDetail.power > 0 && "Bien que moins puissante, cette attaque peut être combinée avec d'autres stratégies pour un effet optimal."}
                    {!moveDetail.power && moveDetail.damageClass === "status" && "Ne sous-estimez pas les capacités de statut - elles peuvent changer le cours d'un combat !"}
                    {moveDetail.accuracy && moveDetail.accuracy < 100 && ` Attention à sa précision de ${moveDetail.accuracy}%, prévoyez un plan B.`}
                    {moveDetail.effectChance && ` Avec ${moveDetail.effectChance}% de chance d'effet additionnel, la chance peut sourire aux audacieux !`}
                  </p>
                </div>
              </div>
            </div>

            {/* Bouton Fermer */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
              <button
                onClick={onClose}
                className="w-full btn btn-primary"
              >
                Fermer
              </button>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center">
            <p className="text-gray-600 dark:text-gray-400">Impossible de charger les détails de l'attaque.</p>
            <button onClick={onClose} className="mt-4 btn">
              Fermer
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
