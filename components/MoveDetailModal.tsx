"use client";

import { useEffect, useState } from "react";
import { typeColors } from "@/lib/typeStyle";
import TypeIcon from "@/components/TypeIcon";
import TypeBadge from "@/components/TypeBadge";
import type { BadgeKey } from "@/lib/typeBadgesSprite";

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
};

type Props = {
  moveName: string;
  isOpen: boolean;
  onClose: () => void;
};

export default function MoveDetailModal({ moveName, isOpen, onClose }: Props) {
  const [moveDetail, setMoveDetail] = useState<MoveDetail | null>(null);
  const [loading, setLoading] = useState(false);

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

        setMoveDetail({
          name: data.name,
          frenchName,
          type: data.type?.name ?? "unknown",
          power: data.power,
          accuracy: data.accuracy,
          pp: data.pp ?? 0,
          damageClass: data.damage_class?.name ?? "status",
          effectChance: data.effect_chance,
          effectDescription: frenchEffect || englishEffect,
          shortEffect,
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
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Chargement...</p>
          </div>
        ) : moveDetail ? (
          <div>
            {/* Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold capitalize">
                    {moveDetail.frenchName || moveDetail.name.replace(/-/g, " ")}
                  </h2>
                  <p className="text-sm text-gray-500 mt-1 capitalize italic">
                    {moveDetail.name.replace(/-/g, " ")}
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold leading-none"
                  aria-label="Fermer"
                >
                  ×
                </button>
              </div>

              {/* Type et Catégorie */}
              <div className="flex flex-wrap gap-3 mt-4">
                <TypeBadge kind={moveDetail.type as BadgeKey} width={120} />
                <TypeBadge kind={moveDetail.damageClass as BadgeKey} width={120} />
              </div>
            </div>

            {/* Animation - Affichage visuel basé sur le type */}
            <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 border-b border-gray-200">
              <div className="flex flex-col items-center justify-center min-h-[180px] relative overflow-hidden">
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
                      boxShadow: `0 0 40px ${typeColors[moveDetail.type] || '#999'}80`,
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
              <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                <div className="text-xs text-blue-600 font-semibold uppercase">Puissance</div>
                <div className="text-2xl font-bold text-blue-800 mt-1">
                  {moveDetail.power ?? "—"}
                </div>
              </div>

              <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                <div className="text-xs text-green-600 font-semibold uppercase">Précision</div>
                <div className="text-2xl font-bold text-green-800 mt-1">
                  {moveDetail.accuracy ? `${moveDetail.accuracy}%` : "—"}
                </div>
              </div>

              <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                <div className="text-xs text-purple-600 font-semibold uppercase">PP</div>
                <div className="text-2xl font-bold text-purple-800 mt-1">
                  {moveDetail.pp}
                </div>
              </div>

              {moveDetail.effectChance && (
                <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
                  <div className="text-xs text-orange-600 font-semibold uppercase">Chance effet</div>
                  <div className="text-2xl font-bold text-orange-800 mt-1">
                    {moveDetail.effectChance}%
                  </div>
                </div>
              )}
            </div>

            {/* Description */}
            <div className="p-6 border-t border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Effet</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                {moveDetail.effectDescription || "Aucune description disponible."}
              </p>
            </div>

            {/* Bouton Fermer */}
            <div className="p-4 border-t border-gray-200 bg-gray-50">
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
            <p className="text-gray-600">Impossible de charger les détails de l'attaque.</p>
            <button onClick={onClose} className="mt-4 btn">
              Fermer
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
