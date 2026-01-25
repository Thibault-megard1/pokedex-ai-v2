import Link from "next/link";
import { BACKGROUNDS } from "@/lib/backgrounds";

export default function HomePage() {
  return (
    <div className="page-bg" style={{ ["--bg-url" as any]: `url(${BACKGROUNDS.home})` }}>
      <div className="page-content">
        <div className="card p-6">
          <h1 className="text-2xl font-semibold">Bienvenue sur le Pokédex</h1>
          <p className="text-gray-600 mt-2">
            Explore les Pokémon, crée ton équipe, et lance des combats basés sur les stats/types.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link className="btn btn-primary" href="/pokemon">Voir la liste des Pokémon</Link>
            <Link className="btn" href="/team">Gérer mon équipe</Link>
            <Link className="btn" href="/battle">Faire un combat</Link>
          </div>

          <p className="text-xs text-gray-500 mt-6">
            Données via PokéAPI, mises en cache dans <code>./data/pokemon-cache</code>.
          </p>
        </div>
      </div>
    </div>
  );
}
