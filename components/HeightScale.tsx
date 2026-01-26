"use client";

// Échelle verticale avec sprites redimensionnés proportionnellement aux tailles réelles.
// Les tailles viennent de /api/compare (height en décimètres) et on borne les sprites pour rester dans la zone.

type Props = {
  aName: string;
  aSprite: string | null;
  aHeightDm: number; // decimeters
  bName: string;
  bSprite: string | null;
  bHeightDm: number;
};

function dmToM(dm: number) {
  return dm / 10;
}

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

export default function HeightScale({ aName, aSprite, aHeightDm, bName, bSprite, bHeightDm }: Props) {
  const aM = dmToM(aHeightDm);
  const bM = dmToM(bHeightDm);

  const maxM = Math.max(aM, bM, 1);
  const maxDm = Math.max(aHeightDm, bHeightDm, 1);
  const scaleMax = Math.ceil(maxM * 10) / 10; // arrondi au 0.1m au dessus

  const SPRITE_MAX = 160; // px max
  const SPRITE_MIN = 56;  // px min pour rester visible
  const spriteHeightFor = (dm: number) => clamp((dm / maxDm) * SPRITE_MAX, SPRITE_MIN, SPRITE_MAX);

  // graduation tous les 0.2m
  const step = 0.2;
  const ticksCount = Math.floor(scaleMax / step) + 1;

  const yFor = (m: number) => {
    // 0m en bas, scaleMax en haut
    const ratio = m / scaleMax;
    return `${(1 - ratio) * 100}%`;
  };

  return (
    <div className="card p-4">
      <div className="font-semibold">Comparaison des tailles</div>
      <div className="text-xs text-gray-600 mt-1">Échelle en mètres</div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
        {/* Colonne A */}
        <div className="flex items-end justify-center gap-3">
          <div className="text-right">
            <div className="font-semibold capitalize">{aName}</div>
            <div className="text-sm text-gray-600">{aM.toFixed(1)} m</div>
          </div>

          {/* sprite A proportionnel à la taille */}
          {aSprite ? (
            <div className="flex items-end justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                className="poke-sprite"
                style={{ height: `${spriteHeightFor(aHeightDm)}px`, width: "auto" }}
                src={aSprite ?? ""}
                alt={aName}
              />
            </div>
          ) : null}

          {/* barre hauteur A */}
          <div className="relative w-10 h-72 border rounded-xl bg-white overflow-hidden">
            <div
              className="absolute bottom-0 left-0 right-0"
              style={{ height: `${(aM / scaleMax) * 100}%` }}
            >
              <div className="h-full w-full bg-gray-200" />
            </div>
            <div className="absolute inset-0 border border-transparent" />
          </div>
        </div>

        {/* Échelle au centre */}
        <div className="relative h-72 border rounded-xl bg-white px-3 py-2">
          {/* ticks */}
          {Array.from({ length: ticksCount }).map((_, i) => {
            const m = i * step;
            const y = yFor(m);
            const major = i % 5 === 0; // tous les 1.0m si step=0.2 -> 5 ticks
            return (
              <div key={i} className="absolute left-0 right-0" style={{ top: y }}>
                <div className="flex items-center gap-2">
                  <div className={`${major ? "w-6" : "w-3"} h-px bg-gray-400`} />
                  {major ? (
                    <div className="text-xs text-gray-600 w-10">{m.toFixed(1)}</div>
                  ) : (
                    <div className="text-[10px] text-gray-400 w-10">{/* blank */}</div>
                  )}
                  <div className="flex-1 h-px bg-transparent" />
                </div>
              </div>
            );
          })}

          {/* marqueurs A/B */}
          <div
            className="absolute left-14 -translate-y-1/2 px-2 py-1 rounded-lg bg-white/90 border text-xs font-semibold"
            style={{ top: yFor(aM) }}
            title={aName}
          >
            A
          </div>

          <div
            className="absolute right-14 -translate-y-1/2 px-2 py-1 rounded-lg bg-white/90 border text-xs font-semibold"
            style={{ top: yFor(bM) }}
            title={bName}
          >
            B
          </div>

          <div className="absolute inset-x-0 bottom-2 text-center text-xs text-gray-600">
            Plus haut ↑
          </div>
        </div>

        {/* Colonne B */}
        <div className="flex items-end justify-center gap-3">
          {/* barre hauteur B */}
          <div className="relative w-10 h-72 border rounded-xl bg-white overflow-hidden">
            <div
              className="absolute bottom-0 left-0 right-0"
              style={{ height: `${(bM / scaleMax) * 100}%` }}
            >
              <div className="h-full w-full bg-gray-200" />
            </div>
          </div>

          {/* sprite B proportionnel à la taille */}
          {bSprite ? (
            <div className="flex items-end justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                className="poke-sprite"
                style={{ height: `${spriteHeightFor(bHeightDm)}px`, width: "auto" }}
                src={bSprite ?? ""}
                alt={bName}
              />
            </div>
          ) : null}

          <div>
            <div className="font-semibold capitalize">{bName}</div>
            <div className="text-sm text-gray-600">{bM.toFixed(1)} m</div>
          </div>
        </div>
      </div>
    </div>
  );
}
