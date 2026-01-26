import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export const dynamic = "force-dynamic";

// Résout un nom français en nom anglais en cherchant dans le cache
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const name = searchParams.get("name");

  if (!name) {
    return NextResponse.json({ error: "Missing name parameter" }, { status: 400 });
  }

  const normalized = name.trim().toLowerCase();

  try {
    // Charger la liste des noms anglais
    const namesPath = path.join(process.cwd(), "data", "pokemon-names.json");
    const namesData = await fs.readFile(namesPath, "utf-8");
    const englishNames: string[] = JSON.parse(namesData);

    // Chercher d'abord si c'est déjà un nom anglais
    const exactMatch = englishNames.find(n => n.toLowerCase() === normalized);
    if (exactMatch) {
      return NextResponse.json({ englishName: exactMatch });
    }

    // Chercher dans le cache pour trouver le nom français correspondant
    const cacheDir = path.join(process.cwd(), "data", "pokemon-cache");
    
    for (const englishName of englishNames) {
      try {
        const cachePath = path.join(cacheDir, `${englishName}.json`);
        const cacheData = await fs.readFile(cachePath, "utf-8");
        const pokemon = JSON.parse(cacheData);
        
        if (pokemon.frenchName && pokemon.frenchName.toLowerCase() === normalized) {
          return NextResponse.json({ englishName });
        }
      } catch {
        // Fichier cache non trouvé ou erreur de lecture, continuer
        continue;
      }
    }

    // Nom non trouvé
    return NextResponse.json({ error: "Pokemon not found" }, { status: 404 });
  } catch (error) {
    console.error("Error resolving pokemon name:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
