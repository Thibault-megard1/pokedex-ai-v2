import PokemonCard from "@/components/PokemonCard";
import { queryPokemon } from "@/lib/pokeapi";
import { backgroundForPokedex } from "@/lib/backgrounds";
import PokedexSearchBar from "@/components/PokedexSearchBar";
import RecentPokemon from "@/components/RecentPokemon";

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
  searchParams: { page?: string; q?: string; size?: string; type?: string; region?: string; sort?: string; order?: string; includeForms?: string };
}) {
  const page = Math.max(1, Number(searchParams.page ?? "1"));
  const q = (searchParams.q ?? "").toString();
  const pageSize = parseSize(searchParams.size);
  const type = (searchParams.type ?? "").toString();
  const region = (searchParams.region ?? "").toString();
  const includeForms = searchParams.includeForms === "true";

  const sort = (searchParams.sort ?? "id").toString();
  const order = (searchParams.order ?? "asc").toString();

  const result = await queryPokemon({
    page,
    pageSize,
    q,
    type: type || undefined,
    region: region || undefined,
    sort: sort as any,
    order: order as any,
    includeForms
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
    if (includeForms) sp.set("includeForms", "true");
    return `/pokemon?${sp.toString()}`;
  };

  const bg = backgroundForPokedex(region || undefined, type || undefined);

  return (
    <div className="page-bg min-h-screen" style={{ ["--bg-url" as any]: `url(${bg})` }}>
      <div className="page-content py-24 px-4">
        
        {/* Header */}
        <div className="pokedex-panel max-w-7xl mx-auto mb-6 pokedex-open-animation">
          <div className="pokedex-panel-content p-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h1 className="text-3xl font-bold text-pokemon mb-2">POKÉDEX NATIONAL</h1>
                <p className="text-sm text-gray-600">
                  {result.total} Pokémon trouvés — Page {page}/{totalPages}
                </p>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-xs text-gray-600 pokemon-text">SYSTÈME ACTIF</span>
              </div>
            </div>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="pokedex-screen max-w-7xl mx-auto mb-6 p-6">
          <h2 className="text-pokemon text-lg mb-4">🔍 RECHERCHE & FILTRES</h2>
          <PokedexSearchBar
            initialQ={q}
            initialSize={String(pageSize)}
            initialType={type}
            initialRegion={region}
            initialSort={sort}
            initialOrder={order}
            initialIncludeForms={includeForms ? "true" : undefined}
          />
        </div>

        {/* Recent Pokemon */}
        <div className="max-w-7xl mx-auto mb-6">
          <RecentPokemon />
        </div>

        {/* Pokemon Grid */}
        <div className="max-w-7xl mx-auto mb-6">
          {result.items.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {result.items.map(p => <PokemonCard key={p.id} p={p} />)}
            </div>
          ) : (
            <div className="pokedex-panel">
              <div className="pokedex-panel-content p-12 text-center">
                <div className="text-6xl mb-4">❌</div>
                <h3 className="text-pokemon text-xl mb-2">AUCUN RÉSULTAT</h3>
                <p className="text-gray-600">Essayez de modifier vos filtres de recherche.</p>
              </div>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pokedex-panel max-w-7xl mx-auto">
            <div className="pokedex-panel-content p-4">
              <div className="flex flex-wrap items-center justify-center gap-2">
                <a 
                  className="pokedex-button text-sm" 
                  href={buildLink(Math.max(1, page - 1))}
                  aria-label="Page précédente"
                >
                  ← Précédent
                </a>

                {pageList(page, totalPages).map((v, idx) => {
                  if (v === "…") return (
                    <span key={`dots-${idx}`} className="px-3 text-gray-500">
                      …
                    </span>
                  );
                  
                  const isActive = v === page;
                  return (
                    <a 
                      key={v} 
                      className={`pokedex-button text-sm min-w-[44px] ${
                        isActive ? "pokedex-button-yellow" : ""
                      }`}
                      href={buildLink(v)}
                    >
                      {v}
                    </a>
                  );
                })}

                <a 
                  className="pokedex-button text-sm" 
                  href={buildLink(Math.min(totalPages, page + 1))}
                  aria-label="Page suivante"
                >
                  Suivant →
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
