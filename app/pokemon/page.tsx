import PokemonCard from "@/components/PokemonCard";
import { queryPokemon } from "@/lib/pokeapi";
import { REGION_OPTIONS, TYPE_OPTIONS } from "@/lib/regions";
import { backgroundForPokedex } from "@/lib/backgrounds";

export const dynamic = "force-dynamic";

const ALLOWED_SIZES = [20, 50, 100] as const;
type AllowedSize = (typeof ALLOWED_SIZES)[number];

function parseSize(value: string | undefined): AllowedSize {
  const n = Number(value);
  if ((ALLOWED_SIZES as readonly number[]).includes(n)) return n as AllowedSize;
  return 20;
}

function pageList(current: number, total: number) {
  const out: (number | "…")[] = [];
  const push = (v: number | "…") => out.push(v);
  const addRange = (a: number, b: number) => { for (let i = a; i <= b; i++) push(i); };

  if (total <= 10) { addRange(1, total); return out; }
  push(1);
  if (current > 4) push("…");
  addRange(Math.max(2, current - 2), Math.min(total - 1, current + 2));
  if (current < total - 3) push("…");
  push(total);
  return out.filter((v, i) => v !== out[i - 1]);
}

export default async function PokemonListPage({
  searchParams
}: {
  searchParams: { page?: string; q?: string; size?: string; type?: string; region?: string; sort?: string; order?: string };
}) {
  const page = Math.max(1, Number(searchParams.page ?? "1"));
  const q = (searchParams.q ?? "").toString();
  const pageSize = parseSize(searchParams.size);
  const type = (searchParams.type ?? "").toString();
  const region = (searchParams.region ?? "").toString();

  const sort = (searchParams.sort ?? "id").toString();
  const order = (searchParams.order ?? "asc").toString();

  const result = await queryPokemon({
    page,
    pageSize,
    q,
    type: type || undefined,
    region: region || undefined,
    sort: sort as any,
    order: order as any
  });

  const totalPages = result.totalPages;

  const buildLink = (p: number) => {
    const sp = new URLSearchParams();
    sp.set("page", String(p));
    sp.set("q", q);
    sp.set("size", String(pageSize));
    sp.set("type", type);
    sp.set("region", region);
    sp.set("sort", sort);
    sp.set("order", order);
    return `/pokemon?${sp.toString()}`;
  };

  const bg = backgroundForPokedex(region || undefined, type || undefined);

  return (
    <div className="page-bg" style={{ ["--bg-url" as any]: `url(${bg})` }}>
      <div className="page-content space-y-4">
        <div className="card p-4 mt-24">
          <h1 className="text-xl font-semibold">Pokédex</h1>

          <form className="mt-3 grid grid-cols-1 lg:grid-cols-6 gap-2" action="/pokemon" method="GET">
            <input className="input lg:col-span-2" name="q" placeholder="Rechercher (ex: pika)" defaultValue={q} />
            <input type="hidden" name="page" value="1" />

            <select className="input" name="size" defaultValue={String(pageSize)}>
              <option value="20">20 / page</option>
              <option value="50">50 / page</option>
              <option value="100">100 / page</option>
            </select>

            <select className="input" name="type" defaultValue={type}>
              <option value="">Tous types</option>
              {TYPE_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>

            <select className="input" name="region" defaultValue={region}>
              <option value="">Toutes régions</option>
              {REGION_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>

            <select className="input" name="sort" defaultValue={sort}>
              <option value="id">Numéro</option>
              <option value="name">Nom</option>
              <option value="height">Taille</option>
              <option value="weight">Poids</option>
              <option value="total">Total stats</option>
              <option value="hp">HP</option>
              <option value="attack">Attack</option>
              <option value="defense">Defense</option>
              <option value="speed">Speed</option>
            </select>

            <select className="input" name="order" defaultValue={order}>
              <option value="asc">Croissant</option>
              <option value="desc">Décroissant</option>
            </select>

            <button className="btn btn-primary lg:col-span-6" type="submit">Appliquer</button>
          </form>

          <p className="text-xs text-gray-500 mt-2">
            Résultats: {result.total} — Page {page} / {totalPages}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {result.items.map(p => <PokemonCard key={p.id} p={p} />)}
        </div>

        <div className="card p-4 flex flex-wrap items-center justify-center gap-2">
          <a className="btn" href={buildLink(Math.max(1, page - 1))}>←</a>

          {pageList(page, totalPages).map((v, idx) => {
            if (v === "…") return <span key={`dots-${idx}`} className="px-2 text-gray-500">…</span>;
            const isActive = v === page;
            return (
              <a key={v} className={`btn ${isActive ? "btn-primary" : ""}`} href={buildLink(v)}>
                {v}
              </a>
            );
          })}

          <a className="btn" href={buildLink(Math.min(totalPages, page + 1))}>→</a>
        </div>
      </div>
    </div>
  );
}
