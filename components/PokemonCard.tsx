import Link from "next/link";
import type { PokemonBasic } from "@/lib/types";
import { typeStyle } from "@/lib/typeStyle";


export default function PokemonCard({ p }: { p: PokemonBasic }) {
  return (
    <Link href={`/pokemon/${p.name}`} className="card p-4 hover:shadow-md transition block">
      <div className="flex items-center gap-3">
        <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden">
          {p.sprite ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={p.sprite} alt={p.name} className="w-16 h-16" />
          ) : (
            <span className="text-xs text-gray-500">no sprite</span>
          )}
        </div>
        <div className="min-w-0">
          <div className="font-semibold capitalize truncate">{p.name}</div>
          <div className="flex flex-wrap gap-1 mt-1">
            {p.types.map(t => {
              const s = typeStyle(t);
              return (
                <span
                  key={t}
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs border ${s.badgeClass}`}
                  title={s.label}
                >
                  <span aria-hidden>{s.icon}</span>
                  <span className="capitalize">{t}</span>
                </span>
              );
            })}
          </div>
        </div>
      </div>
    </Link>
  );
}
