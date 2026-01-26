import "./globals.css";
import NavBar from "@/components/NavBar";
import { ensurePokemonNames } from "@/lib/pokemonNames";
import { ThemeProvider } from "@/components/ThemeProvider";

export const metadata = {
  title: "Pokédex AI",
  description: "Pokédex + combat + équipe + auth (DB locale)",
  icons: {
    icon: [
      { url: "/icon.png", sizes: "any" },
      { url: "/icon.png", type: "image/png" },
    ],
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  await ensurePokemonNames();

  return (
    <html lang="fr">
      <body>
        <ThemeProvider>
          <NavBar />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
