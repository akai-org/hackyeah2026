"use client";

import { useEffect, useState } from "react";

import { MOCK_STATS_MALOPOLSKA, type MalopolskaStats } from "@/data/innovations";
import { getStats } from "@/lib/knowledge";
import { useI18n } from "@/lib/i18n/client";
import type { Locale } from "@/lib/i18n/config";

// Kondycja Małopolski: kafelki z jedną liczbą (to nie wykres, tylko nagłówkowe wartości).
// Liczby w kolorze tekstu, nie danych; źródło zawsze pod kafelkami.

/** 22.4 → „22,4” (pl, uk) / „22.4” (en), 187400 → „187 400” / „187,400” — bez Intl, żeby serwer i przeglądarka dały ten sam tekst. */
export function formatNumber(value: number, locale: Locale = "pl"): string {
  const [whole, fraction] = String(Math.round(value * 10) / 10).split(".");
  const english = locale === "en";
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, english ? "," : "\u00a0");
  return fraction ? `${grouped}${english ? "." : ","}${fraction}` : grouped;
}

export function MalopolskaStatsTiles() {
  const [stats, setStats] = useState<MalopolskaStats>(MOCK_STATS_MALOPOLSKA);
  const r = useI18n().t.region;

  useEffect(() => {
    getStats().then(setStats);
  }, []);

  const tiles = stats.indicators?.length ? stats.indicators : MOCK_STATS_MALOPOLSKA.indicators ?? [];

  return (
    <div>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map((tile) => (
          <li key={tile.label} className="border-(length:--bw) border-border bg-surface p-5 shadow-raised">
            <p className="text-2xl font-bold text-foreground tabular-nums">{tile.value}</p>
            <p className="mt-1">{tile.label}</p>
            <p className="mt-2 text-sm text-muted">{tile.source}</p>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-sm text-muted">
        {r.source} {stats.source ?? r.statsSource}.
      </p>
    </div>
  );
}
