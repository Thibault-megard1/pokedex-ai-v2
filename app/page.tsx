"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BACKGROUNDS } from "@/lib/backgrounds";

type Me = { username: string } | null;

export default function HomePage() {
  const [me, setMe] = useState<Me>(null);

  async function refresh() {
    const res = await fetch("/api/me", { cache: "no-store" });
    const data = await res.json();
    setMe(data.user ?? null);
  }

  useEffect(() => { refresh(); }, []);

  return (
    <div
      className="page-bg"
      style={{ ["--bg-url" as any]: `url(${BACKGROUNDS.home})` }}
    >
      <div className="page-content pt-20 p-6">
        <div className="card p-6 mt-24">
          <h1 className="text-2xl font-semibold">
            Bienvenue sur le Pokédex
          </h1>

          <p className="text-gray-600 mt-2">
            Explore les Pokémons, crée ton équipe, et lance des combats. Amuse-toi bien !
          </p>
          <p className="text-gray-600 mt-2">
            (Pour faire une équipe et des combats il faut que tu sois connecté.)
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            {/* Toujours accessible */}
            <Link className="btn btn-primary" href="/pokemon">
              Voir la liste des Pokémon
            </Link>

            {/* Accessible uniquement si connecté */}
            {me && (
              <>
                <Link className="btn" href="/team">
                  Gérer mon équipe
                </Link>
                <Link className="btn" href="/battle">
                  Faire un combat
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
