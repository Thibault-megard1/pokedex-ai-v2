"use client";

import { useState, useEffect } from "react";

type Props = {
  pokemonId: number;
  pokemonName: string;
};

export default function PokemonNotes({ pokemonId, pokemonName }: Props) {
  const [note, setNote] = useState("");
  const [rating, setRating] = useState(0);
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadNote();
  }, [pokemonId]);

  async function loadNote() {
    try {
      const res = await fetch(`/api/notes?pokemonId=${pokemonId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.note) {
          setNote(data.note.note || "");
          setRating(data.note.rating || 0);
          setTags(data.note.tags || []);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function saveNote() {
    setSaving(true);
    try {
      await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pokemonId,
          pokemonName,
          note,
          rating,
          tags
        })
      });
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="text-sm text-gray-500">Chargement...</div>;

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">⭐ Évaluation</label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map(star => (
            <button
              key={star}
              onClick={() => setRating(star)}
              className="text-3xl hover:scale-110 transition"
            >
              {star <= rating ? "⭐" : "☆"}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">📝 Notes personnelles</label>
        <textarea
          className="input w-full h-24"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Stratégie, moveset, souvenirs..."
        />
      </div>

      <button
        className="btn btn-primary w-full"
        onClick={saveNote}
        disabled={saving}
      >
        {saving ? "Sauvegarde..." : "Sauvegarder"}
      </button>
    </div>
  );
}
