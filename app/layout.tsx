import "./globals.css";
import NavBar from "@/components/NavBar";
import { ensurePokemonNames } from "@/lib/pokemonNames";

export const metadata = {
  title: "Pokédex AI",
  description: "Pokédex + combat + équipe + auth (DB locale)"
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  await ensurePokemonNames();

  return (
    <html lang="fr">
      <body>
        <NavBar />
        {children}
      </body>
    </html>
  );
}
