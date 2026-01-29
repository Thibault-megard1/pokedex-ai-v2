import path from "path";
import { readJsonFile, writeJsonFile, DATA_DIR } from "@/lib/utils";

const SETTINGS_PATH = path.join(DATA_DIR, "site-settings.json");

export type ThemeColors = {
  background: string;
  text: string;
  primary: string;
  card: string;
};

export type SiteSettings = {
  light: ThemeColors;
  dark: ThemeColors;
};

const defaultSettings: SiteSettings = {
  light: {
    background: "#f3f4f6",
    text: "#1f2937",
    primary: "#ef4444",
    card: "#ffffff"
  },
  dark: {
    background: "#111827",
    text: "#f9fafb",
    primary: "#ef4444",
    card: "#1f2937"
  }
};

export async function getSiteSettings(): Promise<SiteSettings> {
  return readJsonFile<SiteSettings>(SETTINGS_PATH, defaultSettings);
}

export async function saveSiteSettings(settings: SiteSettings): Promise<void> {
  await writeJsonFile(SETTINGS_PATH, settings);
}
