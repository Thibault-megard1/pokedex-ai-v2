import path from "path";
import { promises as fs } from "fs";

export const DATA_DIR = path.join(process.cwd(), "data");

/**
 * Cree un dossier si besoin.
 * Cette fonction n'utilise pas d'intelligence artificielle.
 */
export async function ensureDir(dirPath: string) {
  await fs.mkdir(dirPath, { recursive: true });
}

/**
 * Lit un fichier JSON avec fallback.
 * Cette fonction n'utilise pas d'intelligence artificielle.
 * Entree: chemin + valeur par defaut. Sortie: objet JSON.
 */
export async function readJsonFile<T>(filePath: string, fallback: T): Promise<T> {
  try {
    const raw = await fs.readFile(filePath, "utf-8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/**
 * Ecrit un fichier JSON (pretty print).
 * Cette fonction n'utilise pas d'intelligence artificielle.
 */
export async function writeJsonFile<T>(filePath: string, data: T): Promise<void> {
  const dir = path.dirname(filePath);
  await ensureDir(dir);
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
}
