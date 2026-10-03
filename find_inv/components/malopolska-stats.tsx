"use client";

import { useEffect, useState } from "react";

import { MOCK_STATS_MALOPOLSKA, type MalopolskaStats } from "@/data/innovations";
import { getStats } from "@/lib/knowledge";

// Kondycja Małopolski: kafelki z jedną liczbą (to nie wykres, tylko nagłówkowe wartości).
// Liczby w kolorze tekstu, nie danych; źródło zawsze pod kafelkami.

/** 22.4 → „22,4”, 187400 → „187 400” — bez Intl, żeby serwer i przeglądarka dały ten sam tekst. */
export function formatNumber(value: number): string {
  const [whole, fraction] = String(Math.round(value * 10) / 10).split(".");
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return fraction ? `${grouped},${fraction}` : grouped;
}

export function MalopolskaStatsTiles() {
  const [stats, setStats] = useState<MalopolskaStats>(MOCK_STATS_MALOPOLSKA);

  useEffect(() => {
    getStats().then(setStats);
  }, []);

  const tiles = stats.indicators?.length ? stats.indicators : MOCK_STATS_MALOPOLSKA.indicators ?? [];

  return (
    <div>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map((tile) => (
          <li key={tile.label} className="border-(length:--bw) border-deep bg-surface p-5 shadow-paper">
            <p className="text-2xl font-bold text-deep tabular-nums">{tile.value}</p>
            <p className="mt-1">{tile.label}</p>
            <p className="mt-2 text-sm text-muted">{tile.source}</p>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-sm text-muted">
        Źródło: {stats.source ?? "GUS, Bank Danych Lokalnych"}.
      </p>
    </div>
  );
}
