export type TypeStyle = {
  label: string;
  badgeClass: string; // tailwind classes
  icon: string; // path to simple type logo (no text)
};

const MAP: Record<string, TypeStyle> = {
  grass: { label: "Herbe", badgeClass: "bg-green-100 border-green-300 text-green-900", icon: "/icons/types/grass.png" },
  fire: { label: "Feu", badgeClass: "bg-red-100 border-red-300 text-red-900", icon: "/icons/types/fire.png" },
  water: { label: "Eau", badgeClass: "bg-blue-100 border-blue-300 text-blue-900", icon: "/icons/types/water.png" },
  electric: { label: "Électrik", badgeClass: "bg-yellow-100 border-yellow-300 text-yellow-900", icon: "/icons/types/electric.png" },
  ice: { label: "Glace", badgeClass: "bg-cyan-100 border-cyan-300 text-cyan-900", icon: "/icons/types/ice.png" },
  fighting: { label: "Combat", badgeClass: "bg-orange-100 border-orange-300 text-orange-900", icon: "/icons/types/fighting.png" },
  poison: { label: "Poison", badgeClass: "bg-purple-100 border-purple-300 text-purple-900", icon: "/icons/types/poison.png" },
  ground: { label: "Sol", badgeClass: "bg-amber-100 border-amber-300 text-amber-900", icon: "/icons/types/ground.png" },
  flying: { label: "Vol", badgeClass: "bg-sky-100 border-sky-300 text-sky-900", icon: "/icons/types/flying.png" },
  psychic: { label: "Psy", badgeClass: "bg-pink-100 border-pink-300 text-pink-900", icon: "/icons/types/psychic.png" },
  bug: { label: "Insecte", badgeClass: "bg-lime-100 border-lime-300 text-lime-900", icon: "/icons/types/bug.png" },
  rock: { label: "Roche", badgeClass: "bg-stone-100 border-stone-300 text-stone-900", icon: "/icons/types/rock.png" },
  ghost: { label: "Spectre", badgeClass: "bg-indigo-100 border-indigo-300 text-indigo-900", icon: "/icons/types/ghost.png" },
  dragon: { label: "Dragon", badgeClass: "bg-violet-100 border-violet-300 text-violet-900", icon: "/icons/types/dragon.png" },
  dark: { label: "Ténèbres", badgeClass: "bg-gray-200 border-gray-400 text-gray-900", icon: "/icons/types/dark.png" },
  steel: { label: "Acier", badgeClass: "bg-slate-100 border-slate-300 text-slate-900", icon: "/icons/types/steel.png" },
  fairy: { label: "Fée", badgeClass: "bg-rose-100 border-rose-300 text-rose-900", icon: "/icons/types/fairy.png" },
  normal: { label: "Normal", badgeClass: "bg-gray-100 border-gray-300 text-gray-900", icon: "/icons/types/normal.png" }
};

export function typeStyle(type: string): TypeStyle {
  return MAP[type] ?? { label: type, badgeClass: "bg-gray-100 border-gray-300 text-gray-900", icon: "/icons/ui/ic-pokemon.png" };
}

// Couleurs pour les badges de types (pour les composants qui n'utilisent pas Tailwind classes)
export const typeColors: Record<string, string> = {
  grass: "#4ade80",
  fire: "#f87171",
  water: "#60a5fa",
  electric: "#facc15",
  ice: "#67e8f9",
  fighting: "#fb923c",
  poison: "#c084fc",
  ground: "#fbbf24",
  flying: "#7dd3fc",
  psychic: "#f9a8d4",
  bug: "#bef264",
  rock: "#a8a29e",
  ghost: "#a78bfa",
  dragon: "#c4b5fd",
  dark: "#6b7280",
  steel: "#cbd5e1",
  fairy: "#fda4af",
  normal: "#d1d5db"
};
