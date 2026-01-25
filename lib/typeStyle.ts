export type TypeStyle = {
  label: string;
  badgeClass: string; // tailwind classes
  icon: string; // emoji icon for simplicity
};

const MAP: Record<string, TypeStyle> = {
  grass: { label: "Herbe", badgeClass: "bg-green-100 border-green-300 text-green-900", icon: "🍃" },
  fire: { label: "Feu", badgeClass: "bg-red-100 border-red-300 text-red-900", icon: "🔥" },
  water: { label: "Eau", badgeClass: "bg-blue-100 border-blue-300 text-blue-900", icon: "💧" },
  electric: { label: "Électrik", badgeClass: "bg-yellow-100 border-yellow-300 text-yellow-900", icon: "⚡" },
  ice: { label: "Glace", badgeClass: "bg-cyan-100 border-cyan-300 text-cyan-900", icon: "❄️" },
  fighting: { label: "Combat", badgeClass: "bg-orange-100 border-orange-300 text-orange-900", icon: "🥊" },
  poison: { label: "Poison", badgeClass: "bg-purple-100 border-purple-300 text-purple-900", icon: "☠️" },
  ground: { label: "Sol", badgeClass: "bg-amber-100 border-amber-300 text-amber-900", icon: "⛰️" },
  flying: { label: "Vol", badgeClass: "bg-sky-100 border-sky-300 text-sky-900", icon: "🪽" },
  psychic: { label: "Psy", badgeClass: "bg-pink-100 border-pink-300 text-pink-900", icon: "🔮" },
  bug: { label: "Insecte", badgeClass: "bg-lime-100 border-lime-300 text-lime-900", icon: "🐛" },
  rock: { label: "Roche", badgeClass: "bg-stone-100 border-stone-300 text-stone-900", icon: "🪨" },
  ghost: { label: "Spectre", badgeClass: "bg-indigo-100 border-indigo-300 text-indigo-900", icon: "👻" },
  dragon: { label: "Dragon", badgeClass: "bg-violet-100 border-violet-300 text-violet-900", icon: "🐉" },
  dark: { label: "Ténèbres", badgeClass: "bg-gray-200 border-gray-400 text-gray-900", icon: "🌑" },
  steel: { label: "Acier", badgeClass: "bg-slate-100 border-slate-300 text-slate-900", icon: "⚙️" },
  fairy: { label: "Fée", badgeClass: "bg-rose-100 border-rose-300 text-rose-900", icon: "🧚" },
  normal: { label: "Normal", badgeClass: "bg-gray-100 border-gray-300 text-gray-900", icon: "⭕" }
};

export function typeStyle(type: string): TypeStyle {
  return MAP[type] ?? { label: type, badgeClass: "bg-gray-100 border-gray-300 text-gray-900", icon: "🏷️" };
}
