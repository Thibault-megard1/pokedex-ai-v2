"use client";

import { useState, useEffect } from "react";

type Props = {
  pokemonId: number;
  pokemonName: string;
  size?: "sm" | "md" | "lg";
};

export default function FavoriteButton({ pokemonId, pokemonName, size = "md" }: Props) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(false);

  const sizeClasses = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-3xl"
  };

  useEffect(() => {
    checkFavorite();
  }, [pokemonId]);

  async function checkFavorite() {
    try {
      const res = await fetch("/api/favorites");
      if (!res.ok) return;
      const data = await res.json();
      setIsFavorite(data.favorites.some((f: any) => f.pokemonId === pokemonId));
    } catch (err) {
      console.error("Error checking favorite:", err);
    }
  }

  async function toggleFavorite() {
    setLoading(true);
    try {
      if (isFavorite) {
        const res = await fetch(`/api/favorites?pokemonId=${pokemonId}`, {
          method: "DELETE"
        });
        if (res.ok) {
          setIsFavorite(false);
        }
      } else {
        const res = await fetch("/api/favorites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pokemonId, pokemonName })
        });
        if (res.ok) {
          setIsFavorite(true);
        }
      }
    } catch (err) {
      console.error("Error toggling favorite:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={toggleFavorite}
      disabled={loading}
      className={`${sizeClasses[size]} transition-all hover:scale-110 disabled:opacity-50`}
      title={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
    >
      {isFavorite ? "⭐" : "☆"}
    </button>
  );
}
