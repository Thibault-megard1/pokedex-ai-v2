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
    <div className="page-bg" style={{ ["--bg-url" as any]: `url(${BACKGROUNDS.auth})` }}>
      <div className="page-content">
    <div className="max-w-md mx-auto card p-6">
      <h1 className="text-xl font-semibold">Connexion</h1>

      <form className="mt-4 space-y-3" onSubmit={onSubmit}>
        <div>
          <label className="text-sm">Pseudo</label>
          <input className="input mt-1" name="username" required />
        </div>
        <div>
          <label className="text-sm">Mot de passe</label>
          <input className="input mt-1" name="password" type="password" required />
        </div>

        {error ? <div className="text-sm text-red-600">{error}</div> : null}

        <button className="btn btn-primary w-full" type="submit">Se connecter</button>
        <a className="btn w-full" href="/auth/register">Créer un compte</a>
      </form>
    </div>
        </div>
    </div>
  );
}