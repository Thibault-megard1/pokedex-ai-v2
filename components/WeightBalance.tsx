"use client";

import { useEffect, useMemo, useRef, useState } from "react";

// Balance animée : le plus lourd descend, le plus léger est propulsé avec une pseudo-physique (gravité, drag, rebond).
// Les données proviennent de /api/compare (poids en hectogrammes, sprites, cris optionnels).

type Props = {
  aName: string;
  aSprite: string | null;
  aWeightHg: number; // hectograms
  bName: string;
  bSprite: string | null;
  bWeightHg: number;
  aCryUrl?: string | null;
  bCryUrl?: string | null;
  cryRate?: number; // vitesse du cri (ex: 1.6)
};

function hgToKg(hg: number) {
  return hg / 10;
}

export default function WeightBalance({
  aName, aSprite, aWeightHg, aCryUrl,
  bName, bSprite, bWeightHg, bCryUrl,
  cryRate = 1.6,
}: Props) {
  const aKg = hgToKg(aWeightHg);
  const bKg = hgToKg(bWeightHg);

  const heavy = useMemo(() => (aKg >= bKg ? "A" : "B"), [aKg, bKg]);
  const light = heavy === "A" ? "B" : "A";
  const lightCryUrl = light === "A" ? (aCryUrl ?? null) : (bCryUrl ?? null);
  const diff = Math.abs(aKg - bKg);

  // refs DOM pour appliquer transform
  const panRef = useRef<HTMLDivElement | null>(null);
  const lightRef = useRef<HTMLDivElement | null>(null);
  const heavyRef = useRef<HTMLDivElement | null>(null);

  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    // reset transforms à chaque changement de pokemons
    if (panRef.current) panRef.current.style.transform = `rotate(0deg)`;
    if (lightRef.current) lightRef.current.style.transform = `translate(0px, 0px) rotate(0deg)`;
    if (heavyRef.current) heavyRef.current.style.transform = `translate(0px, 0px) rotate(0deg)`;
    setPlaying(false);
  }, [aName, bName, aKg, bKg]);

  function play() {
    if (playing) return;
    setPlaying(true);

    let hasPlayedLandingCry = false;

    const pan = panRef.current;
    const light = lightRef.current;
    const heavyEl = heavyRef.current;
    if (!pan || !light || !heavyEl) return;

    // --- physique du léger (impulsion + gravité + drag + rebond) ---
    let x = 0;
    let y = 0;

    // impulsion dépendante du delta de poids (bornée)
    const strength = Math.min(1, diff / 40); // 40kg = très fort
    const dir = heavy === "A" ? 1 : -1; // si A est lourd -> le léger (B) part vers la droite, sinon gauche

    let vx = dir * (220 + 420 * strength);   // px/s
    let vy = -(240 + 520 * strength);        // px/s vers le haut

    const g = 1050;        // gravité
    const air = 3.2;       // résistance air (plus grand = frein plus fort)
    const bounce = 0.28;   // rebond
    const floorY = 0;
    const maxUp = -150;

    // animation pan (balance) + chute lourd (CSS-ish via RAF)
    const start = performance.now();
    let last = start;

    const tick = (t: number) => {
      const dt = Math.min(0.03, (t - last) / 1000); // sec
      last = t;

      // rotation de la balance (ease)
      const p = Math.min(1, (t - start) / 650);
      const ease = 1 - Math.pow(1 - p, 3);
      const tiltTarget = leftIsHeavy ? 12 : -12; // tilt angle based on which side is heavier
      pan.style.transform = `rotate(${tiltTarget * ease}deg)`;

      // petit impact visuel quand la balance est quasi en place
      if (p > 0.8) {
        heavyEl.style.filter = "drop-shadow(0 2px 0 rgba(0,0,0,0.15))";
      }

      // dynamique du léger
      // drag quadratique simplifiée : v -= air * v * |v| * dt
      const dragX = air * vx * Math.abs(vx);
      const dragY = air * vy * Math.abs(vy);

      vx -= dragX * dt * 0.00008;
      vy -= dragY * dt * 0.00008;

      vy += g * dt;

      x += vx * dt;
      y += vy * dt;

      // plafond
      if (y < maxUp) {
        y = maxUp;
        vy = 0;
      }

      // sol + rebond
      if (y > floorY) {
        y = floorY;

        // cri au premier impact au sol
        if (!hasPlayedLandingCry && lightCryUrl) {
          hasPlayedLandingCry = true;
          try {
            const audio = new Audio(lightCryUrl);
            audio.playbackRate = cryRate;
            audio.volume = 0.9;
            audio.currentTime = 0;
            audio.play().catch(() => {});
          } catch {}
        }

        vy = -vy * bounce;
        vx *= 0.55;

        // arrêt quand presque immobile et rotation finie
        if (Math.abs(vy) < 70 && Math.abs(vx) < 25 && p >= 1) {
          light.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) rotate(0deg)`;
          setPlaying(false);
          return;
        }
      }

      // rotation du léger pendant le vol (petit effet)
      const rot = x * 0.08;
      light.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) rotate(${rot.toFixed(1)}deg)`;

      requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  }

  const leftIsHeavy = heavy === "A"; // plateau gauche = A
  const A = { name: aName, sprite: aSprite, kg: aKg.toFixed(1) };
  const B = { name: bName, sprite: bSprite, kg: bKg.toFixed(1) };

  return (
    <div className="card p-4">
      <div className="font-semibold">Comparaison des poids (balance)</div>
      <div className="text-xs text-gray-600 dark:text-gray-300 mt-1">
        Le plus lourd “tombe”, le plus léger est propulsé (avec résistance de l’air).
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 text-sm">
        <div className="capitalize"><b>A:</b> {A.name} — {A.kg} kg</div>
        <button className="btn btn-primary" onClick={play} disabled={playing}>
          {playing ? "Animation..." : "Lancer l'animation"}
        </button>
        <div className="capitalize text-right"><b>B:</b> {B.name} — {B.kg} kg</div>
      </div>

      {/* Zone balance */}
      <div className="mt-4 relative h-56 overflow-hidden border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800">
        {/* pivot */}
        <div className="absolute left-1/2 top-24 -translate-x-1/2 w-3 h-3 bg-gray-500 rounded-full" />
        <div className="absolute left-1/2 top-24 -translate-x-1/2 w-2 h-28 bg-gray-300 rounded" />
        <div className="absolute left-1/2 top-24 -translate-x-1/2 w-28 h-3 bg-gray-300 rounded" />

        {/* bras qui tourne autour du pivot */}
        <div
          ref={panRef}
          className="absolute left-1/2 top-24 -translate-x-1/2 origin-center"
          style={{ width: 460, height: 1 }}
        >
          {/* bras */}
          <div className="absolute left-1/2 top-0 -translate-x-1/2 w-[460px] h-2 bg-gray-400 rounded" />

          {/* plateau gauche */}
          <div className="absolute left-0 top-10 w-44 h-3 bg-gray-300 rounded" />
          {/* plateau droit */}
          <div className="absolute right-0 top-10 w-44 h-3 bg-gray-300 rounded" />

          {/* Pokemon A attaché au plateau gauche */}
          <div
            className="absolute left-10 top-0 w-24 text-center select-none"
            ref={leftIsHeavy ? heavyRef : lightRef}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="w-20 h-20 poke-sprite mx-auto" src={A.sprite ?? ""} alt={A.name} />
            <div className="text-xs font-semibold capitalize mt-1">{A.name}</div>
          </div>

          {/* Pokemon B attaché au plateau droit */}
          <div
            className="absolute right-10 top-0 w-24 text-center select-none"
            ref={!leftIsHeavy ? heavyRef : lightRef}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="w-20 h-20 poke-sprite mx-auto" src={B.sprite ?? ""} alt={B.name} />
            <div className="text-xs font-semibold capitalize mt-1">{B.name}</div>
          </div>
        </div>

        <div className="absolute bottom-2 inset-x-0 text-center text-xs text-gray-600 dark:text-gray-300">
          Plus lourd = plateau qui descend
        </div>
      </div>
    </div>
  );
}
