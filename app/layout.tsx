import "./globals.css";
import NavBar from "@/components/NavBar";
import { ensurePokemonNames } from "@/lib/pokemonNames";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Inter } from 'next/font/google';

// Load Inter font for body text
const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata = {
  title: "Pokédex AI - Official Pokémon Database",
  description: "Explore the complete Pokédex with AI-powered features, team building, battles, and more!",
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
    <html lang="fr" className={inter.variable}>
      <head>
        {/* Preload Pokemon font from Google Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-screen">
        <ThemeProvider>
          <div className="flex flex-col min-h-screen">
            <NavBar />
            <main className="flex-1">
              {children}
            </main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
