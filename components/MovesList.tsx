"use client";

import { useState } from "react";
import MoveDetailModal from "./MoveDetailModal";
import TypeLogo from "./TypeLogo";

type Move = {
  name: string;
  type?: string;
  learnMethod: string;
  levelLearnedAt?: number;
  machineNumber?: string;
};

type Props = {
  moves: Move[];
};

export default function MovesList({ moves }: Props) {
  const [filterMethod, setFilterMethod] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMove, setSelectedMove] = useState<string | null>(null);

  if (!moves || moves.length === 0) {
    return (
      <div className="text-sm text-gray-500">
        Aucune attaque disponible
      </div>
    );
  }

  // Grouper par méthode d'apprentissage
  const levelUpMoves = moves
    .filter(m => m.learnMethod === "level-up")
    .sort((a, b) => (a.levelLearnedAt ?? 0) - (b.levelLearnedAt ?? 0));
  
  const machineMoves = moves.filter(m => m.learnMethod === "machine");
  const tutorMoves = moves.filter(m => m.learnMethod === "tutor");
  const eggMoves = moves.filter(m => m.learnMethod === "egg");

  // Filtrer selon le terme de recherche
  const filterMoves = (moveList: Move[]) => {
    if (!searchTerm) return moveList;
    return moveList.filter(m => 
      m.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const getMethodLabel = (method: string) => {
    switch (method) {
      case "level-up": return "Par niveau";
      case "machine": return "CT/CS";
      case "tutor": return "Tuteur";
      case "egg": return "Œuf";
      default: return method;
    }
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case "level-up": return "bg-blue-50 border-blue-200 text-blue-700";
      case "machine": return "bg-purple-50 border-purple-200 text-purple-700";
      case "tutor": return "bg-green-50 border-green-200 text-green-700";
      case "egg": return "bg-orange-50 border-orange-200 text-orange-700";
      default: return "bg-gray-50 border-gray-200 text-gray-700";
    }
  };

  const renderMoveList = (moveList: Move[], method: string) => {
    const filtered = filterMoves(moveList);
    
    if (filtered.length === 0) return null;

    return (
      <div className="mb-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
          <span className={`px-2 py-1 rounded-full text-xs ${getMethodColor(method)}`}>
            {getMethodLabel(method)}
          </span>
          <span className="text-gray-500">({filtered.length})</span>
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          {filtered.map((move, idx) => (
            <button
              key={`${move.name}-${idx}`}
              onClick={() => setSelectedMove(move.name)}
              className={`p-2 rounded-lg border ${getMethodColor(method)} hover:shadow-md transition-all cursor-pointer text-left flex items-center gap-2`}
            >
              {move.type && (
                <div className="flex-shrink-0">
                  <TypeLogo type={move.type} size={24} />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm capitalize truncate">
                  {move.name.replace(/-/g, " ")}
                </div>
                {move.learnMethod === "level-up" && move.levelLearnedAt !== undefined && (
                  <div className="text-xs mt-1">
                    Niveau {move.levelLearnedAt || "Départ"}
                  </div>
                )}
                {move.learnMethod === "machine" && move.machineNumber && (
                  <div className="text-xs mt-1">
                    {move.machineNumber}
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div>
      {/* Info */}
      <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          <span className="font-semibold">{moves.length} attaques</span> disponibles pour ce Pokémon
        </p>
      </div>

      {/* Filtres */}
      <div className="mb-4 space-y-3">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilterMethod("all")}
            className={`px-3 py-1 rounded-full text-sm transition ${
              filterMethod === "all"
                ? "bg-gray-800 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Toutes ({moves.length})
          </button>
          {levelUpMoves.length > 0 && (
            <button
              onClick={() => setFilterMethod("level-up")}
              className={`px-3 py-1 rounded-full text-sm transition ${
                filterMethod === "level-up"
                  ? "bg-blue-600 text-white"
                  : "bg-blue-50 text-blue-700 hover:bg-blue-100"
              }`}
            >
              Niveau ({levelUpMoves.length})
            </button>
          )}
          {machineMoves.length > 0 && (
            <button
              onClick={() => setFilterMethod("machine")}
              className={`px-3 py-1 rounded-full text-sm transition ${
                filterMethod === "machine"
                  ? "bg-purple-600 text-white"
                  : "bg-purple-50 text-purple-700 hover:bg-purple-100"
              }`}
            >
              CT/CS ({machineMoves.length})
            </button>
          )}
          {tutorMoves.length > 0 && (
            <button
              onClick={() => setFilterMethod("tutor")}
              className={`px-3 py-1 rounded-full text-sm transition ${
                filterMethod === "tutor"
                  ? "bg-green-600 text-white"
                  : "bg-green-50 text-green-700 hover:bg-green-100"
              }`}
            >
              Tuteur ({tutorMoves.length})
            </button>
          )}
          {eggMoves.length > 0 && (
            <button
              onClick={() => setFilterMethod("egg")}
              className={`px-3 py-1 rounded-full text-sm transition ${
                filterMethod === "egg"
                  ? "bg-orange-600 text-white"
                  : "bg-orange-50 text-orange-700 hover:bg-orange-100"
              }`}
            >
              Œuf ({eggMoves.length})
            </button>
          )}
        </div>

        <input
          type="text"
          placeholder="Rechercher une attaque..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="input w-full"
        />
      </div>

      {/* Liste des attaques */}
      <div className="max-h-96 overflow-y-auto pr-2">
        {filterMethod === "all" || filterMethod === "level-up" ? renderMoveList(levelUpMoves, "level-up") : null}
        {filterMethod === "all" || filterMethod === "machine" ? renderMoveList(machineMoves, "machine") : null}
        {filterMethod === "all" || filterMethod === "tutor" ? renderMoveList(tutorMoves, "tutor") : null}
        {filterMethod === "all" || filterMethod === "egg" ? renderMoveList(eggMoves, "egg") : null}
      </div>

      {/* Modal de détails d'attaque */}
      <MoveDetailModal
        moveName={selectedMove || ""}
        isOpen={selectedMove !== null}
        onClose={() => setSelectedMove(null)}
      />
    </div>
  );
}
