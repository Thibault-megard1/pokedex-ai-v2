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
    <div className="card p-4">
      <div className="flex items-center justify-between">
        <div className="font-semibold">Comparaison des stats (0 → 255)</div>
        <div className="flex items-center gap-3 text-xs">
          <span className="inline-flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-500 inline-block" /> {getDisplayName(a.name, a.frenchName)}</span>
          <span className="inline-flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-blue-500 inline-block" /> {getDisplayName(b.name, b.frenchName)}</span>
        </div>
      </div>

      <div className="mt-4 flex justify-center">
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
              <text key={k} x={x} y={y} textAnchor="middle" dominantBaseline="middle" className="text-[11px] fill-gray-700">
                {k.replace("special-", "sp-")}
              </text>
            );
          })}

          {/* polygones */}
          <polygon points={polygonFor(b)} fill="rgba(59,130,246,0.2)" stroke="rgba(59,130,246,0.9)" strokeWidth={2} />
          <polygon points={polygonFor(a)} fill="rgba(239,68,68,0.2)" stroke="rgba(239,68,68,0.9)" strokeWidth={2} />
        </svg>
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
    <div className="page-bg" style={{ ["--bg-url" as any]: `url(${BACKGROUNDS.compare})` }}>
      <div className="page-content space-y-4">
      <div className="card p-6">
        <h1 className="text-xl font-semibold">Comparer deux Pokémon</h1>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-sm">Pokémon A</label>
            <PokemonAutocomplete id="compare-a" value={aName} onChange={setAName} placeholder="ex: raichu" />
          </div>
          <div>
            <label className="text-sm">Pokémon B</label>
            <PokemonAutocomplete id="compare-b" value={bName} onChange={setBName} placeholder="ex: rattata" />
          </div>
        </div>

        {error ? <div className="text-sm text-red-600 mt-2">{error}</div> : null}

        <div className="mt-4">
          <button className="btn btn-primary" onClick={runCompare} disabled={loading}>
            {loading ? "Chargement..." : "Comparer"}
          </button>
        </div>
      </div>

      {a && b ? (
        <>
          {/* 2 colonnes + diff au centre */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            <div className="card p-4">
              <div className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="w-16 h-16 poke-sprite" src={a.sprite ?? ""} alt={getDisplayName(a.name, a.frenchName)} />
                <div>
                  <div className="font-semibold">{getDisplayName(a.name, a.frenchName)}</div>
                  <div className="text-xs text-gray-600">Taille: {toMeters(a.height)} m — Poids: {toKg(a.weight)} kg</div>
                </div>
              </div>

              <div className="mt-2 flex flex-wrap gap-2">
                {a.types.map(t => (
                  <TypeBadge key={t} kind={t as BadgeKey} width={85} />
                ))}
              </div>

              <div className="mt-3 space-y-1 text-sm">
                {a.stats.map(s => (
                  <div key={s.name} className="flex justify-between">
                    <span className="capitalize">{s.name}</span>
                    <b>{s.value}</b>
                  </div>
                ))}
              </div>
            </div>

            <div className="card p-4">
              <div className="font-semibold">Différences (A - B)</div>
              <div className="mt-3 space-y-2">
                {diff?.map(row => (
                  <div key={row.key} className="flex items-center justify-between text-sm">
                    <span className="capitalize">{row.key}</span>
                    <span className={`font-semibold ${row.d > 0 ? "text-green-700" : row.d < 0 ? "text-red-700" : "text-gray-700"}`}>
                      {row.d > 0 ? `+${row.d}` : row.d}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-4 text-xs text-gray-600">
                (Graphiques juste en dessous)
              </div>
            </div>

            <div className="card p-4">
              <div className="flex items-center gap-3 justify-end">
                <div className="text-right">
                  <div className="font-semibold">{getDisplayName(b.name, b.frenchName)}</div>
                  <div className="text-xs text-gray-600">Taille: {toMeters(b.height)} m — Poids: {toKg(b.weight)} kg</div>
                </div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="w-16 h-16 poke-sprite" src={b.sprite ?? ""} alt={getDisplayName(b.name, b.frenchName)} />
              </div>

              <div className="mt-2 flex flex-wrap gap-2 justify-end">
                {b.types.map(t => (
                  <TypeBadge key={t} kind={t as BadgeKey} width={85} />
                ))}
              </div>

              <div className="mt-3 space-y-1 text-sm">
                {b.stats.map(s => (
                  <div key={s.name} className="flex justify-between">
                    <span className="capitalize">{s.name}</span>
                    <b>{s.value}</b>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <StatsRadar a={a} b={b} />

          <div className="card p-4">
            <div className="font-semibold">Cris</div>
            <div className="text-xs text-gray-600 mt-1">Joue le cri de chaque Pokémon</div>
            <div className="mt-3 flex flex-col sm:flex-row gap-2 sm:gap-3">
              <button className="btn" disabled={!a.cryUrl} onClick={() => playCry(a.cryUrl)}>
                {a.cryUrl ? `Cri de ${getDisplayName(a.name, a.frenchName)}` : `Pas de cri pour ${getDisplayName(a.name, a.frenchName)}`}
              </button>
              <button className="btn" disabled={!b.cryUrl} onClick={() => playCry(b.cryUrl)}>
                {b.cryUrl ? `Cri de ${getDisplayName(b.name, b.frenchName)}` : `Pas de cri pour ${getDisplayName(b.name, b.frenchName)}`}
              </button>
            </div>
          </div>

          <HeightScale
            aName={getDisplayName(a.name, a.frenchName)}
            aSprite={a.sprite}
            aHeightDm={a.height}
            bName={getDisplayName(b.name, b.frenchName)}
            bSprite={b.sprite}
            bHeightDm={b.height}
          />

          <div className="card p-4">
            <div className="font-semibold">Comparaison des poids</div>
            <div className="text-xs text-gray-600 mt-1">Sprites statiques avec poids affichés (kg).</div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
              <div className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="w-20 h-20 poke-sprite" src={a.sprite ?? ""} alt={getDisplayName(a.name, a.frenchName)} />
                <div>
                  <div className="font-semibold">{getDisplayName(a.name, a.frenchName)}</div>
                  <div className="text-sm text-gray-600">{toKg(a.weight)} kg</div>
                </div>
              </div>

              <div className="flex items-center gap-3 justify-end">
                <div className="text-right">
                  <div className="font-semibold">{getDisplayName(b.name, b.frenchName)}</div>
                  <div className="text-sm text-gray-600">{toKg(b.weight)} kg</div>
                </div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="w-20 h-20 poke-sprite" src={b.sprite ?? ""} alt={getDisplayName(b.name, b.frenchName)} />
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
    </div>
  );
}
