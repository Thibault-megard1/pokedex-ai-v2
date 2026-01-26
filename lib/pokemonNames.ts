import 'server-only';
import fs from "fs";
import path from "path";

const FILE = path.join(process.cwd(), "data", "pokemon-names.json");

export async function ensurePokemonNames() {
  if (fs.existsSync(FILE)) return;

  const res = await fetch("https://pokeapi.co/api/v2/pokemon?limit=2000");
  const data = await res.json();

  const names = (data.results ?? []).map((p: any) => p.name);

  fs.mkdirSync(path.dirname(FILE), { recursive: true });
  fs.writeFileSync(FILE, JSON.stringify(names));
}

export function loadPokemonNames(): string[] {
  if (!fs.existsSync(FILE)) return [];
  return JSON.parse(fs.readFileSync(FILE, "utf-8"));
}
