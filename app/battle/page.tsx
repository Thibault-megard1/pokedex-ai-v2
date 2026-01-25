"use client";

import { useMemo, useRef, useState } from "react";
import PokemonAutocomplete from "@/components/PokemonAutocomplete";
import { typeStyle } from "@/lib/typeStyle";
import { BACKGROUNDS } from "@/lib/backgrounds";

type PokeLite = {
  name: string;
  sprite: string | null;
  backSprite: string | null;
  types: string[];
  stats: { name: string; value: number }[];
  cry: string | null;
};

type Turn = { attacker: "A" | "B"; damage: number; aHp: number; bHp: number; note: string };

type Result = {
  a: PokeLite;
  b: PokeLite;
  chanceA: number;
  winner: "A" | "B";
  turns: Turn[];
};

function stat(p: PokeLite, key: string) {
  return p.stats.find(s => s.name === key)?.value ?? 0;
}
function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

export default function BattlePage() {
  const [aName, setAName] = useState("");
  const [bName, setBName] = useState("");
  const [res, setRes] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [step, setStep] = useState(0);
  const [aHpNow, setAHpNow] = useState<number>(0);
  const [bHpNow, setBHpNow] = useState<number>(0);
  const [aAnim, setAAnim] = useState<string>("");
  const [bAnim, setBAnim] = useState<string>("");

  const playToken = useRef(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const chanceText = useMemo(() => {
    if (!res) return null;
    const pctA = Math.round(res.chanceA * 100);
    const pctB = 100 - pctA;
    return { pctA, pctB };
  }, [res]);

  const maxAHp = res ? stat(res.a, "hp") : 1;
  const maxBHp = res ? stat(res.b, "hp") : 1;

  function playCry(url: string | null) {
    if (!url) return;
    try {
      if (!audioRef.current) audioRef.current = new Audio();
      audioRef.current.src = url;
      audioRef.current.currentTime = 0;
      void audioRef.current.play();
    } catch {
      // ignore autoplay errors
    }
  }

  async function fightNow() {
    setError(null);
    setRes(null);
    setLoading(true);
    setStep(0);
    setAAnim("");
    setBAnim("");

    try {
      if (!aName.trim() || !bName.trim()) {
        setError("Choisis 2 Pokémon (nom).");
        return;
      }

      const r = await fetch("/api/battle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ a: aName.trim(), b: bName.trim() })
      });

      const data = await r.json();
      if (!r.ok) {
        setError(data.error ?? "Erreur");
        return;
      }

      const rr: Result = data.result;
      setRes(rr);

      const initA = stat(rr.a, "hp");
      const initB = stat(rr.b, "hp");
      setAHpNow(initA);
      setBHpNow(initB);
      setStep(0);
    } finally {
      setLoading(false);
    }
  }

  async function playTurns() {
    if (!res) return;

    playToken.current += 1;
    const token = playToken.current;

    const initA = stat(res.a, "hp");
    const initB = stat(res.b, "hp");
    setAHpNow(initA);
    setBHpNow(initB);
    setStep(0);

    for (let i = 0; i < res.turns.length; i++) {
      if (token !== playToken.current) return;

      const t = res.turns[i];

      playCry(t.attacker === "A" ? res.a.cry : res.b.cry);

      if (t.attacker === "A") {
        setAAnim("attack-left");
        setBAnim("hit");
      } else {
        setBAnim("attack-right");
        setAAnim("hit");
      }

      await new Promise(r => setTimeout(r, 380));
      if (token !== playToken.current) return;

      setAAnim("");
      setBAnim("");

      setAHpNow(t.aHp);
      setBHpNow(t.bHp);
      setStep(i + 1);

      await new Promise(r => setTimeout(r, 520));
      if (token !== playToken.current) return;
    }
  }

return (
  <div className="page-bg" style={{ ["--bg-url" as any]: `url(${BACKGROUNDS.battle})` }}>
    <div className="page-content space-y-4">
      <div className="card p-6 mt-24">
        <h1 className="text-xl font-semibold">Combat</h1>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-sm">Joueur (A)</label>
              <PokemonAutocomplete
                id="a"
                value={aName}
                onChange={setAName}
                placeholder="ex: raichu"
              />
            </div>
            <div>
              <label className="text-sm">Adversaire (B)</label>
              <PokemonAutocomplete
                id="b"
                value={bName}
                onChange={setBName}
                placeholder="ex: rattata"
              />
            </div>
          </div>

          {error ? <div className="text-sm text-red-600 mt-2">{error}</div> : null}

          <div className="mt-4 flex flex-wrap gap-2">
            <button className="btn btn-primary" onClick={fightNow} disabled={loading}>
              {loading ? "Chargement..." : "Préparer le combat"}
            </button>
            <button className="btn" onClick={playTurns} disabled={!res}>
              Lancer l’animation + cris
            </button>
          </div>
        </div>

        {res ? (
          <>
            <div className="card p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-sm text-gray-700">
                  Tour animé: <b>{step}</b> / {res.turns.length} — Gagnant:{" "}
                  <b className="capitalize">{res.winner === "A" ? res.a.name : res.b.name}</b>
                </div>
                {chanceText ? (
                  <div className="text-sm">
                    Chances: <b className="capitalize">{res.a.name}</b> {chanceText.pctA}% —{" "}
                    <b className="capitalize">{res.b.name}</b> {chanceText.pctB}%
                  </div>
                ) : null}
              </div>
            </div>

            <div className="card p-4 relative overflow-hidden">
              <div className="flex justify-end">
                <div className="bg-white/85 rounded-xl border px-4 py-3 w-[280px]">
                  <div className="flex items-center justify-between">
                    <div className="font-semibold capitalize">{res.b.name}</div>
                    <div className="text-xs text-gray-600">PV {clamp(bHpNow,0,maxBHp)} / {maxBHp}</div>
                  </div>
                  <div className="hpbar mt-2">
                    <div className="hpfill" style={{ width: `${clamp((bHpNow / maxBHp) * 100, 0, 100)}%` }} />
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {res.b.types.map(t => {
                      const s = typeStyle(t);
                      return (
                        <span key={t} className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm border ${s.badgeClass}`}>
                          <span aria-hidden>{s.icon}</span><span className="capitalize">{t}</span>
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="h-[260px] relative">
                <div className={`absolute top-6 left-10 ${bAnim} bob`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img className="poke-sprite w-[140px] h-[140px]" src={res.b.sprite ?? ""} alt={res.b.name} />
                </div>

                <div className={`absolute bottom-2 right-10 ${aAnim} bob`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img className="poke-sprite w-[160px] h-[160px]" src={res.a.backSprite ?? res.a.sprite ?? ""} alt={res.a.name} />
                </div>
              </div>

              <div className="flex justify-start">
                <div className="bg-white/85 rounded-xl border px-4 py-3 w-[320px]">
                  <div className="flex items-center justify-between">
                    <div className="font-semibold capitalize">{res.a.name}</div>
                    <div className="text-xs text-gray-600">PV {clamp(aHpNow,0,maxAHp)} / {maxAHp}</div>
                  </div>
                  <div className="hpbar mt-2">
                    <div className="hpfill" style={{ width: `${clamp((aHpNow / maxAHp) * 100, 0, 100)}%` }} />
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {res.a.types.map(t => {
                      const s = typeStyle(t);
                      return (
                        <span key={t} className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm border ${s.badgeClass}`}>
                          <span aria-hidden>{s.icon}</span><span className="capitalize">{t}</span>
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
