"use client";
import { BACKGROUNDS } from "@/lib/backgrounds";

import { useState } from "react";

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);
    const body = {
      username: String(form.get("username") ?? ""),
      password: String(form.get("password") ?? "")
    };

  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  const data = await res.json();
  if (!res.ok) {
    setError(data.error ?? "Erreur");
      return;
    }
    window.location.href = "/team";
  }

  return (
    <div className="page-bg min-h-screen" style={{ ["--bg-url" as any]: `url(${BACKGROUNDS.auth})` }}>
      <div className="page-content py-24 px-4">
        <div className="max-w-md mx-auto pokedex-panel pokedex-open-animation">
          <div className="pokedex-panel-content p-8">
            
            {/* Header */}
            <div className="text-center mb-6">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-white flex items-center justify-center shadow-lg pokeball-bounce">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-red-500 to-red-700"></div>
              </div>
              <h1 className="text-3xl font-bold text-pokemon mb-2">CONNEXION</h1>
              <p className="text-sm text-gray-600">Bienvenue, Dresseur !</p>
            </div>

            {/* Form */}
            <form className="space-y-4" onSubmit={onSubmit}>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 pokemon-text">
                  PSEUDO
                </label>
                <input 
                  className="pokedex-input w-full" 
                  name="username" 
                  required 
                  placeholder="Votre pseudo"
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 pokemon-text">
                  MOT DE PASSE
                </label>
                <input 
                  className="pokedex-input w-full" 
                  name="password" 
                  type="password" 
                  required 
                  placeholder="••••••••"
                />
              </div>

              {error ? (
                <div className="bg-red-50 border-2 border-red-300 rounded-lg p-3 text-sm text-red-700 flex items-center gap-2">
                  <img src="/icons/ui/ic-error.png" alt="Error" className="w-4 h-4" />
                  <span>{error}</span>
                </div>
              ) : null}

              <button className="pokedex-button-yellow w-full text-base" type="submit">
                Se connecter
              </button>
              
              <div className="text-center mt-4">
                <p className="text-sm text-gray-600 mb-2">Pas encore de compte ?</p>
                <a className="pokedex-button w-full" href="/auth/register">
                  Créer un compte
                </a>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
