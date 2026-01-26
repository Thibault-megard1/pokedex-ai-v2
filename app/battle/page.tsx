"use client";

import { useMemo, useRef, useState } from "react";
import PokemonAutocomplete from "@/components/PokemonAutocomplete";
import TypeLogo from "@/components/TypeLogo";
import { BACKGROUNDS } from "@/lib/backgrounds";

// Type pour stocker les données d'un Pokémon (léger)
type PokeLite = {
  name: string;
  sprite: string | null;
  backSprite: string | null;
  types: string[];
  stats: { name: string; value: number }[];
  cry: string | null;
};

// Type pour un tour de combat
type Turn = { attacker: "A" | "B"; damage: number; aHp: number; bHp: number; note: string };

// Type pour le résultat du combat simulé
type Result = {
  a: PokeLite;           // Pokémon du joueur
  b: PokeLite;           // Pokémon adversaire
  chanceA: number;       // Probabilité de victoire du joueur (0-1)
  winner: "A" | "B";    // Gagnant du combat
  turns: Turn[];         // Liste de tous les tours du combat
};

function stat(p: PokeLite, key: string) {
  // Récupère la valeur d'une stat (ex: "hp", "attack", etc.) d'un Pokémon
  return p.stats.find(s => s.name === key)?.value ?? 0;
}
function clamp(n: number, a: number, b: number) {
  // Limite une valeur entre min (a) et max (b)
  // Utilisé pour: s'assurer que les PV n'affichent pas de valeurs négatives ou > maxHP
  return Math.max(a, Math.min(b, n));
}

export default function BattlePage() {
  // === ÉTATS DE SAISIE ===
  const [aName, setAName] = useState("");      // Nom du Pokémon du joueur (A)
  const [bName, setBName] = useState("");      // Nom du Pokémon adversaire (B)
  
  // === RÉSULTAT DU COMBAT ===
  const [res, setRes] = useState<Result | null>(null);  // Données du combat simulé
  const [error, setError] = useState<string | null>(null);  // Message d'erreur
  const [loading, setLoading] = useState(false);  // État de chargement
  
  // === ANIMATION DU COMBAT ===
  const [step, setStep] = useState(0);           // Tour actuel de l'animation
  const [aHpNow, setAHpNow] = useState<number>(0);  // PV actuels du joueur (A)
  const [bHpNow, setBHpNow] = useState<number>(0);  // PV actuels de l'adversaire (B)
  const [aAnim, setAAnim] = useState<string>("");  // Animation du joueur (attack-left, hit, etc.)
  const [bAnim, setBAnim] = useState<string>("");  // Animation de l'adversaire (attack-right, hit, etc.)

  // === RÉFÉRENCES POUR CONTRÔLE DE TOKENS ===
  const playToken = useRef(0);                    // Permet d'annuler l'animation si une nouvelle commence
  const audioRef = useRef<HTMLAudioElement | null>(null);  // Référence pour jouer les cris

  const chanceText = useMemo(() => {
    if (!res) return null;
    const pctA = Math.round(res.chanceA * 100);
    const pctB = 100 - pctA;
    return { pctA, pctB };
  }, [res]);

  // === STATISTIQUES DU COMBAT ===
  const maxAHp = res ? stat(res.a, "hp") : 1;   // PV max du joueur (A)
  const maxBHp = res ? stat(res.b, "hp") : 1;   // PV max de l'adversaire (B)

  // === VÉRIFICATION KO ===
  const aKO = res ? aHpNow <= 0 : false;        // Le joueur est KO
  const bKO = res ? bHpNow <= 0 : false;        // L'adversaire est KO

  // Joue un cri audio d'un Pokémon
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

  // Lance le combat: appelle l'API, récupère les données, initialise les PV
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

  // Joue l'animation complète du combat
  // Joue l'animation complète du combat
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

      // Joue le cri du Pokémon qui attaque
      playCry(t.attacker === "A" ? res.a.cry : res.b.cry);

      // Lance l'animation d'attaque et de coup reçu
      // Si A attaque : A attaque vers la gauche (attack-left), B prend un coup (hit)
      // Si B attaque : B attaque vers la droite (attack-right), A prend un coup (hit)
      if (t.attacker === "A") {
        setAAnim("attack-left");
        setBAnim("hit");
      } else {
        setBAnim("attack-right");
        setAAnim("hit");
      }

      await new Promise(r => setTimeout(r, 380));
      if (token !== playToken.current) return;

      // Arrête l'animation d'attaque et met à jour les PV
      setAAnim("");
      setBAnim("");

      // Met à jour les PV avec les dégâts du tour
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
                placeholder="ex: dialga"
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
              {/* BARRE DE PV DE L'ADVERSAIRE (B) - HAUT À DROITE */}
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
                    {res.b.types.map(t => (
                      <TypeLogo key={t} type={t} size={24} />
                    ))}
                  </div>
                </div>
              </div>

              {/* ZONE D'ARÈNE - Contient les sprites des deux Pokémon */}
              <div className="h-[260px] relative">
                {/* SPRITE DE L'ADVERSAIRE (B) - À DROITE - HAUT */}
                {/* Position: top-6 right-10 (en haut à droite) */}
                {/* Animation: ${bAnim} (peut être 'attack-right', 'hit', ou vide) */}
                {/* Taille: 140x140px */}
                {/* Classe KO: appliquée si bKO est true (quand PV <= 0) */}
                <div className={`absolute top-6 right-10 ${bAnim} bob`}>
                  {/* Nom de l'adversaire au-dessus de son sprite */}
                  <div className="absolute -top-6 right-0 bg-white/85 border rounded-lg px-2 py-1 text-sm font-semibold capitalize">
                    {res.b.name}
                  </div>
                  {/* Sprite frontal de l'adversaire - applique la classe 'ko' si KO */}
                  <img className={`poke-sprite w-[140px] h-[140px] ${bKO ? "ko" : ""}`} src={res.b.sprite ?? ""} alt={res.b.name} />
                </div>

                {/* SPRITE DU JOUEUR (A) - À GAUCHE - BAS */}
                {/* Position: bottom-2 left-10 (en bas à gauche) */}
                {/* Animation: ${aAnim} (peut être 'attack-left', 'hit', ou vide) */}
                {/* Taille: 160x160px (légèrement plus grand) */}
                {/* Classe KO: appliquée si aKO est true (quand PV <= 0) */}
                <div className={`absolute bottom-1 left-10 ${aAnim} bob`}>
                  {/* Nom du joueur au-dessus de son sprite */}
                  <div className="absolute -top-6 left-0 bg-white/85 border rounded-lg px-2 py-1 text-sm font-semibold capitalize">
                    {res.a.name}
                  </div>
                  {/* Sprite de dos du joueur (ou sprite frontal en fallback) - applique la classe 'ko' si KO */}
                  <img className={`poke-sprite w-[160px] h-[160px] ${aKO ? "ko" : ""}`} src={res.a.backSprite ?? res.a.sprite ?? ""} alt={res.a.name} />
                </div>
              </div>

              {/* BARRE DE PV DU JOUEUR (A) - BAS À GAUCHE */}
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
                    {res.a.types.map(t => (
                      <TypeLogo key={t} type={t} size={24} />
                    ))}
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
