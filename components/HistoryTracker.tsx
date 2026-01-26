"use client";

import { useEffect } from "react";
import { addToHistory } from "./RecentPokemon";

type Props = {
  id: number;
  name: string;
  sprite: string | null;
};

export default function HistoryTracker({ id, name, sprite }: Props) {
  useEffect(() => {
    addToHistory({ id, name, sprite });
  }, [id, name, sprite]);

  return null;
}
