import "./globals.css";
import NavBar from "@/components/NavBar";

export const metadata = {
  title: "Pokédex AI",
  description: "Pokédex + combat + équipe + auth (DB locale)"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <NavBar />
        {children}
      </body>
    </html>
  );
}
