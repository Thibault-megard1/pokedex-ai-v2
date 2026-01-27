"use client";
import { BACKGROUNDS } from "@/lib/backgrounds";
import { useLanguage } from "@/components/LanguageProvider";
import { t } from "@/lib/i18n";

import { useState } from "react";

export default function RegisterPage() {
  const { lang } = useLanguage();
  const [error, setError] = useState<string | null>(null);
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);
    const body = {
      username: String(form.get("username") ?? ""),
      password: String(form.get("password") ?? ""),
      confirmPassword: String(form.get("confirmPassword") ?? "")
    };

  const res = await fetch("/api/auth/register", {
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
    <div className="page-bg min-h-screen" style={{ "--bg-url": `url(${BACKGROUNDS.auth})` } as React.CSSProperties}>
      <div className="page-content py-24 px-4">
        <div className="max-w-md mx-auto pokedex-panel pokedex-open-animation">
          <div className="pokedex-panel-content p-8">
            
            {/* Header */}
            <div className="text-center mb-6">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-white flex items-center justify-center shadow-lg pokeball-bounce">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600"></div>
              </div>
              <h1 className="text-3xl font-bold text-pokemon mb-2">{t(lang, "auth.register.title").toUpperCase()}</h1>
              <p className="text-sm text-gray-600">{t(lang, "nav.trainer")}</p>
            </div>

            {/* Form */}
            <form className="space-y-4" onSubmit={onSubmit}>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 pokemon-text">
                  {t(lang, "auth.username").toUpperCase()}
                </label>
                <input 
                  className="pokedex-input w-full" 
                  name="username" 
                  required 
                  minLength={3}
                  placeholder={t(lang, "auth.username")}
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 pokemon-text">
                  {t(lang, "auth.password").toUpperCase()}
                </label>
                <input 
                  className="pokedex-input w-full" 
                  name="password" 
                  type="password" 
                  required 
                  minLength={6}
                  placeholder="Min. 6"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 pokemon-text">
                  {t(lang, "auth.password").toUpperCase()}
                </label>
                <input 
                  className="pokedex-input w-full" 
                  name="confirmPassword" 
                  type="password" 
                  required 
                  minLength={6}
                  placeholder="••••••••"
                />
              </div>

              {error ? (
                <div className="bg-red-50 border-2 border-red-300 rounded-lg p-3 text-sm text-red-700">
                  ⚠️ {error}
                </div>
              ) : null}

              <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-3 text-xs text-gray-600">
                💾 Les données sont stockées localement dans ./data
              </div>

              <button className="pokedex-button-yellow w-full text-base" type="submit">
                {t(lang, "auth.register.submit")}
              </button>
              
              <div className="text-center mt-4">
                <p className="text-sm text-gray-600 mb-2">{t(lang, "auth.have.account")}</p>
                <a className="pokedex-button w-full" href="/auth/login">
                  {t(lang, "auth.submit")}
                </a>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
