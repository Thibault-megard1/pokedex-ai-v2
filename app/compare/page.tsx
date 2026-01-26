"use client";

import { useMemo, useState } from "react";
import PokemonAutocomplete from "@/components/PokemonAutocomplete";
import HeightScale from "@/components/HeightScale";
import { typeStyle } from "@/lib/typeStyle";
import { BACKGROUNDS } from "@/lib/backgrounds";
import { getDisplayName } from "@/lib/pokemonNames.utils";

// Modèle minimal utilisé par la page (données renvoyées par /api/compare)
type P = {
  id: number;
  name: string;
  frenchName?: string | null;
  sprite: string | null;
  types: string[];
  stats: { name: string; value: number }[];
  height: number; // decimeters
  weight: number; // hectograms
  region: string | null;
  cryUrl?: string | null;
};

type StatKey = "hp" | "attack" | "defense" | "special-attack" | "special-defense" | "speed";
const STAT_KEYS: StatKey[] = ["hp", "attack", "defense", "special-attack", "special-defense", "speed"];

function StatsRadar({ a, b }: { a: P; b: P }) {
  const size = 320;
  const cx = size / 2;
  const cy = size / 2;
  const radius = 130; // rayon max
  const maxStat = 255;
  const ticks = [64, 128, 192, 255];

  const valueFor = (p: P, k: StatKey) => stat(p, k);

  const point = (val: number, index: number, total: number) => {
    const angle = (Math.PI * 2 * index) / total - Math.PI / 2; // démarre en haut
    const r = (Math.max(0, Math.min(maxStat, val)) / maxStat) * radius;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  };

  const polygonFor = (p: P) => STAT_KEYS.map((k, i) => point(valueFor(p, k), i, STAT_KEYS.length)).join(" ");

  return (
    <div className="pokedex-panel">
      <div className="pokedex-panel-content p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-pokemon text-xl">Radar de Stats (0 → 255)</h2>
          <div className="flex items-center gap-3 text-xs">
            <span className="inline-flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-500 inline-block" /> {getDisplayName(a.name, a.frenchName)}</span>
            <span className="inline-flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-blue-500 inline-block" /> {getDisplayName(b.name, b.frenchName)}</span>
          </div>
        </div>

        <div className="flex justify-center">
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="max-w-full">
            {/* cercles de graduation */}
            {ticks.map(t => (
              <circle
                key={t}
                cx={cx}
                cy={cy}
                r={(t / maxStat) * radius}
                fill="none"
                stroke="rgba(107,114,128,0.35)"
                strokeWidth={1}
              />
            ))}

            {/* axes */}
            {STAT_KEYS.map((k, i) => {
              const angle = (Math.PI * 2 * i) / STAT_KEYS.length - Math.PI / 2;
              const x = cx + radius * Math.cos(angle);
              const y = cy + radius * Math.sin(angle);
              return <line key={k} x1={cx} y1={cy} x2={x} y2={y} stroke="rgba(107,114,128,0.3)" strokeWidth={1} />;
            })}

            {/* labels */}
            {STAT_KEYS.map((k, i) => {
              const angle = (Math.PI * 2 * i) / STAT_KEYS.length - Math.PI / 2;
              const x = cx + (radius + 18) * Math.cos(angle);
              const y = cy + (radius + 18) * Math.sin(angle);
              return (
                <text key={k} x={x} y={y} textAnchor="middle" dominantBaseline="middle" className="text-[11px] fill-gray-700 font-bold">
                  {k.replace("special-", "sp-").toUpperCase()}
                </text>
              );
            })}

            {/* polygones */}
            <polygon points={polygonFor(b)} fill="rgba(59,130,246,0.2)" stroke="rgba(59,130,246,0.9)" strokeWidth={2} />
            <polygon points={polygonFor(a)} fill="rgba(239,68,68,0.2)" stroke="rgba(239,68,68,0.9)" strokeWidth={2} />
          </svg>
        </div>
      </div>
    </div>
  );
}

function stat(p: P, key: string) {
  return p.stats.find(s => s.name === key)?.value ?? 0;
}

function toMeters(dm: number) {
  return (dm / 10).toFixed(1);
}
function toKg(hg: number) {
  return (hg / 10).toFixed(1);
}

export default function ComparePage() {
  const [aName, setAName] = useState("");
  const [bName, setBName] = useState("");
  const [a, setA] = useState<P | null>(null);
  const [b, setB] = useState<P | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const playCry = (url?: string | null) => {
    if (!url) return;
    try {
      const audio = new Audio(url);
      audio.currentTime = 0;
      void audio.play();
    } catch {
      // ignore autoplay errors
    }
  };

  // Appelle l'API /api/compare pour récupérer les deux Pokémon
  async function runCompare() {
    setError(null);
    setLoading(true);
    try {
      const r = await fetch("/api/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ a: aName, b: bName }),
      });
      const data = await r.json();
      if (!r.ok) {
        setError(data.error ?? "Erreur");
        return;
      }
      setA(data.a);
      setB(data.b);
    } finally {
      setLoading(false);
    }
  }

  // Pré-calcul des écarts de stats (A - B) pour affichage
  const diff = useMemo(() => {
    if (!a || !b) return null;
    const keys = ["hp", "attack", "defense", "special-attack", "special-defense", "speed"] as const;

    return keys.map(k => ({
      key: k,
      a: stat(a, k),
      b: stat(b, k),
      d: stat(a, k) - stat(b, k),
    }));
  }, [a, b]);

  return (
    <div className="page-bg min-h-screen" style={{ ["--bg-url" as any]: `url(${BACKGROUNDS.compare})` }}>
      <div className="page-content py-24 px-4">
        
        {/* Header */}
        <div className="pokedex-panel max-w-6xl mx-auto mb-6 pokedex-open-animation">
          <div className="pokedex-panel-content p-6">
            <h1 className="text-3xl font-bold text-pokemon mb-4">📊 COMPARER DES POKÉMON</h1>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 pokemon-text">POKÉMON A</label>
                <PokemonAutocomplete id="compare-a" value={aName} onChange={setAName} placeholder="ex: raichu" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 pokemon-text">POKÉMON B</label>
                <PokemonAutocomplete id="compare-b" value={bName} onChange={setBName} placeholder="ex: rattata" />
              </div>
            </div>

            {error ? (
              <div className="bg-red-50 border-2 border-red-300 rounded-lg p-3 text-sm text-red-700 mb-4">
                ⚠️ {error}
              </div>
            ) : null}

            <button className="pokedex-button-yellow w-full sm:w-auto" onClick={runCompare} disabled={loading}>
              {loading ? "Chargement..." : "⚔️ Comparer"}
            </button>
          </div>
        </div>

        {a && b ? (
          <>
            {/* Pokemon Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-6xl mx-auto mb-6">
              <div className="pokedex-panel">
                <div className="pokedex-panel-content p-6">
                  <div className="flex items-center gap-4 mb-4">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img className="w-24 h-24 pixelated" src={a.sprite ?? ""} alt={getDisplayName(a.name, a.frenchName)} />
                    <div className="flex-1">
                      <h2 className="text-2xl font-bold text-pokemon capitalize">{getDisplayName(a.name, a.frenchName)}</h2>
                      <div className="text-sm text-gray-600 mt-1">#{a.id}</div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {a.types.map(t => (
                          <TypeBadge key={t} kind={t as BadgeKey} width={85} />
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-2 text-center">
                      <div className="text-xs text-blue-600 font-bold pokemon-text">TAILLE</div>
                      <div className="text-lg font-bold text-blue-900">{toMeters(a.height)} m</div>
                    </div>
                    <div className="bg-green-50 border-2 border-green-300 rounded-lg p-2 text-center">
                      <div className="text-xs text-green-600 font-bold pokemon-text">POIDS</div>
                      <div className="text-lg font-bold text-green-900">{toKg(a.weight)} kg</div>
                    </div>
                  </div>

                  <div className="pokedex-screen p-3">
                    <h3 className="text-xs font-bold pokemon-text mb-2">STATS</h3>
                    <div className="space-y-1 text-sm">
                      {a.stats.map(s => (
                        <div key={s.name} className="flex justify-between">
                          <span className="capitalize text-gray-700">{s.name}</span>
                          <b className="text-red-600">{s.value}</b>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="pokedex-panel">
                <div className="pokedex-panel-content p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex-1 text-right">
                      <h2 className="text-2xl font-bold text-pokemon capitalize">{getDisplayName(b.name, b.frenchName)}</h2>
                      <div className="text-sm text-gray-600 mt-1">#{b.id}</div>
                      <div className="flex flex-wrap gap-2 mt-2 justify-end">
                        {b.types.map(t => (
                          <TypeBadge key={t} kind={t as BadgeKey} width={85} />
                        ))}
                      </div>
                    </div>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img className="w-24 h-24 pixelated" src={b.sprite ?? ""} alt={getDisplayName(b.name, b.frenchName)} />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-2 text-center">
                      <div className="text-xs text-blue-600 font-bold pokemon-text">TAILLE</div>
                      <div className="text-lg font-bold text-blue-900">{toMeters(b.height)} m</div>
                    </div>
                    <div className="bg-green-50 border-2 border-green-300 rounded-lg p-2 text-center">
                      <div className="text-xs text-green-600 font-bold pokemon-text">POIDS</div>
                      <div className="text-lg font-bold text-green-900">{toKg(b.weight)} kg</div>
                    </div>
                  </div>

                  <div className="pokedex-screen p-3">
                    <h3 className="text-xs font-bold pokemon-text mb-2">STATS</h3>
                    <div className="space-y-1 text-sm">
                      {b.stats.map(s => (
                        <div key={s.name} className="flex justify-between">
                          <span className="capitalize text-gray-700">{s.name}</span>
                          <b className="text-blue-600">{s.value}</b>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Stat Differences */}
            <div className="pokedex-screen max-w-6xl mx-auto mb-6 p-6">
              <h2 className="text-pokemon text-xl mb-4">📈 DIFFÉRENCES (A - B)</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                {diff?.map(row => (
                  <div key={row.key} className="bg-white rounded-lg border-2 border-gray-300 p-3 text-center">
                    <div className="text-xs text-gray-600 capitalize pokemon-text">{row.key}</div>
                    <div className={`text-2xl font-bold ${row.d > 0 ? "text-green-600" : row.d < 0 ? "text-red-600" : "text-gray-600"}`}>
                      {row.d > 0 ? `+${row.d}` : row.d}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Radar Chart */}
            <div className="max-w-6xl mx-auto mb-6">
              <StatsRadar a={a} b={b} />
            </div>

            {/* Height Comparison */}
            <div className="max-w-6xl mx-auto mb-6">
              <HeightScale
                aName={getDisplayName(a.name, a.frenchName)}
                aSprite={a.sprite}
                aHeightDm={a.height}
                bName={getDisplayName(b.name, b.frenchName)}
                bSprite={b.sprite}
                bHeightDm={b.height}
              />
            </div>

            {/* Cries */}
            <div className="pokedex-panel max-w-6xl mx-auto">
              <div className="pokedex-panel-content p-6">
                <h2 className="text-pokemon text-xl mb-4">🔊 CRIS</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button 
                    className="pokedex-button" 
                    disabled={!a.cryUrl} 
                    onClick={() => playCry(a.cryUrl)}
                  >
                    {a.cryUrl ? `🎵 ${getDisplayName(a.name, a.frenchName)}` : `❌ Pas de cri`}
                  </button>
                  <button 
                    className="pokedex-button" 
                    disabled={!b.cryUrl} 
                    onClick={() => playCry(b.cryUrl)}
                  >
                    {b.cryUrl ? `🎵 ${getDisplayName(b.name, b.frenchName)}` : `❌ Pas de cri`}
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
