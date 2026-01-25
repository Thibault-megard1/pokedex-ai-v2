import Link from "next/link";
import { getPokemonDetail, getAdjacentPokemonId } from "@/lib/pokeapi";
import { typeStyle } from "@/lib/typeStyle";
import { backgroundForPokemonDetail } from "@/lib/backgrounds";


export default async function PokemonDetailPage({ params }: { params: { name: string } }) {
  const p = await getPokemonDetail(params.name);
  const bg = backgroundForPokemonDetail({ id: p.id, region: p.region ?? null, types: p.types });
  const prevId = await getAdjacentPokemonId(p.id, "prev");
  const nextId = await getAdjacentPokemonId(p.id, "next");

  const heightM = (p.heightDecimeters / 10).toFixed(1);
  const weightKg = (p.weightHectograms / 10).toFixed(1);

  const cryUrl = p.cry?.latest ?? p.cry?.legacy ?? null;

  return (
    <div className="page-bg" style={{ ["--bg-url" as any]: `url(${bg})` }}>
      <div className="page-content space-y-4">
      <div className="card p-5 mt-24">
        <div className="flex items-center gap-4">
          <div className="w-24 h-24 rounded-xl bg-gray-100 flex items-center justify-center overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {p.sprite ? <img src={p.sprite} alt={p.name} className="w-24 h-24" /> : null}
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold capitalize truncate">
              {p.name} <span className="text-gray-400 text-base">#{p.id}</span>
            </h1>
            <div className="mt-4 flex gap-2 flex-wrap">
              <Link className="btn" href={`/pokemon/${prevId}`}>← Précédent</Link>
              <Link className="btn" href={`/pokemon/${nextId}`}>Suivant →</Link>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {p.types.map(t => {
                const s = typeStyle(t);
                return (
                  <span key={t} className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm border ${s.badgeClass}`}>
                    <span aria-hidden>{s.icon}</span>
                    <span className="capitalize">{t}</span>
                  </span>
                );
              })}
            </div>
            <div className="text-sm text-gray-600 mt-2">
              Taille: <b>{heightM} m</b> — Poids: <b>{weightKg} kg</b>
              {p.generation ? <> — Génération: <b className="capitalize">{p.generation}</b></> : null}
            </div>
          </div>
        </div>

        {cryUrl ? (
          <div className="mt-4">
            <div className="text-sm font-semibold">Cri</div>
            <audio controls src={cryUrl} className="mt-1 w-full" />
            <p className="text-xs text-gray-500 mt-1">Si le navigateur bloque, clique “play” manuellement.</p>
          </div>
        ) : (
          <p className="text-xs text-gray-500 mt-4">Cri non disponible pour ce Pokémon (fallback).</p>
        )}
      </div>

      <div className="card p-5">
        <h2 className="text-lg font-semibold">Stats</h2>
        <div className="mt-3 space-y-2">
          {p.stats.map(s => (
            <div key={s.name} className="flex items-center gap-3">
              <div className="w-28 text-sm text-gray-700 capitalize">{s.name}</div>
              <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden border">
                <div className="h-3 bg-gray-800" style={{ width: `${Math.min(100, s.value)}%` }} />
              </div>
              <div className="w-10 text-right text-sm">{s.value}</div>
            </div>
          ))}
        </div>

        <div className="mt-5 flex gap-2">
          <form action="/team" method="GET">
            <input type="hidden" name="add" value={p.name} />
            <button className="btn btn-primary" type="submit">Ajouter à mon équipe</button>
          </form>
          <a className="btn" href="/pokemon">Retour</a>
        </div>
      </div>
      </div>
    </div>
  );
}
