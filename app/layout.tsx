import "./globals.css";
import NavBar from "@/components/NavBar";
import { ensurePokemonNames } from "@/lib/pokemonNames";
import { ThemeProvider } from "@/components/ThemeProvider";
import { LanguageProvider } from "@/components/LanguageProvider";
import { PWAInstallBanner } from "@/components/PWAComponents";
import { Inter } from 'next/font/google';

// Load Inter font for body text
const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata = {
  title: "Pokédex AI Pro - Official Pokémon Database",
  description: "Explore the complete Pokédex with AI-powered features, team building, battles, competitive tools, and more!",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Pokédex AI Pro",
  },
  icons: {
    icon: [
      { url: "/icon.png", sizes: "any" },
      { url: "/icon.png", type: "image/png" },
    ],
    apple: [
      { url: "/icons/icon-152x152.png", sizes: "152x152", type: "image/png" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
    ],
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  await ensurePokemonNames();

  return (
    <html lang="fr" className={inter.variable}>
      <head>
        {/* PWA manifest */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#CC0000" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Pokédex AI Pro" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        
        {/* Preload Pokemon font from Google Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* Prevent flash of unstyled content - inline script runs before hydration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const stored = localStorage.getItem('theme');
                  const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  const theme = stored || (systemPrefersDark ? 'dark' : 'light');
                  if (theme === 'dark') {
                    document.documentElement.classList.add('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-screen">
        <ThemeProvider>
          <LanguageProvider>
            <div className="flex flex-col min-h-screen">
              <NavBar />
              <main className="flex-1">
                {children}
              </main>
            </div>
            <PWAInstallBanner />
          </LanguageProvider>
        </ThemeProvider>
        <script dangerouslySetInnerHTML={{
          __html: `
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js')
                  .then(reg => console.log('✓ Service Worker registered'))
                  .catch(err => console.log('✗ Service Worker registration failed:', err));
              });
            }
          `
        }} />
      </body>
    </html>
  );
}
