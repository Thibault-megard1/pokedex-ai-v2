import React, { ReactNode, useRef, useEffect, useState } from "react";

interface PokedexScreenProps {
  children: ReactNode;
  sourceLabel?: string;
  onChangeSource?: () => void;
  showChangeSource?: boolean;
  scrollHint?: boolean;
}

export default function PokedexScreen({
  children,
  sourceLabel,
  onChangeSource,
  showChangeSource = true,
  scrollHint = false,
}: PokedexScreenProps) {
  const screenRef = useRef<HTMLDivElement>(null);
  const [overflowing, setOverflowing] = useState(false);

  useEffect(() => {
    if (screenRef.current) {
      setOverflowing(screenRef.current.scrollHeight > screenRef.current.clientHeight);
    }
  }, [children]);

  return (
    <div className="relative w-full max-w-[620px] mx-auto pokedex-frame rounded-2xl shadow-xl border-4 border-pokedex-red bg-white dark:bg-[#2a1818] p-4 flex flex-col items-center">
      {/* Decorative bolts/lights */}
      <div className="absolute left-4 top-3 w-3 h-3 bg-pokedex-red rounded-full shadow-pokedex-bolt" />
      <div className="absolute right-4 top-3 w-3 h-3 bg-yellow-400 rounded-full shadow-pokedex-bolt" />
      {/* Device screen */}
      <div
        ref={screenRef}
        className="relative w-full bg-pokedex-screen dark:bg-pokedex-screen-dark border-4 border-pokedex-screen-border rounded-lg px-5 py-4 min-h-[90px] max-h-48 md:max-h-64 overflow-y-auto font-pokedex text-pokedex-screen-text dark:text-pokedex-screen-text-dark text-base leading-relaxed shadow-inner pokedex-screen-effect"
        style={{
          fontFamily: 'var(--font-pokedex, "Press Start 2P", "VT323", "monospace")',
        }}
      >
        {children}
        {/* Scanlines overlay */}
        <div className="pointer-events-none absolute inset-0 opacity-20 mix-blend-overlay pokedex-scanlines" />
        {/* Scroll hint */}
        {overflowing && scrollHint && (
          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 animate-bounce text-pokedex-screen-text/60 dark:text-pokedex-screen-text-dark/60 text-lg">
            ▼
          </div>
        )}
      </div>
      {/* Source label and button */}
      <div className="flex items-center justify-between w-full mt-2 gap-2">
        {sourceLabel && (
          <span className="text-xs bg-pokedex-screen border border-pokedex-screen-border px-2 py-0.5 rounded text-pokedex-screen-text dark:bg-pokedex-screen-dark dark:text-pokedex-screen-text-dark">
            Source : {sourceLabel}
          </span>
        )}
        {showChangeSource && onChangeSource && (
          <button
            className="ml-auto pokedex-btn px-3 py-1 text-xs font-bold rounded-lg border-2 border-pokedex-red bg-white dark:bg-[#3a2323] text-pokedex-red dark:text-pokedex-red-dark shadow-pokedex-btn transition-all active:scale-95 hover:-translate-y-0.5 hover:shadow-pokedex-btn-hover focus:outline-none"
            onClick={onChangeSource}
            type="button"
          >
            Changer la source
          </button>
        )}
      </div>
    </div>
  );
}
