"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

interface TrendsData {
  top_tags: { tag: string; count: number }[];
  top_queries: { query: string; count: number }[];
  by_day: { date: string; count: number }[];
}

const MOCK_TRENDS: TrendsData = {
  top_tags: [
    { tag: "seniorzy", count: 45 },
    { tag: "wykluczenie_cyfrowe", count: 38 },
    { tag: "samotność", count: 31 },
    { tag: "zdrowie_psychiczne", count: 22 },
    { tag: "niepełnosprawność", count: 18 },
    { tag: "dzieci", count: 14 },
    { tag: "ubóstwo", count: 12 },
    { tag: "transport", count: 9 },
    { tag: "NGO", count: 8 },
    { tag: "gmina_wiejska", count: 7 },
  ],
  top_queries: [
    { query: "Samotny senior na wsi", count: 12 },
    { query: "Brak transportu do lekarza", count: 9 },
    { query: "Młodzież w kryzysie psychicznym", count: 7 },
    { query: "Seniorzy i internet", count: 6 },
    { query: "Bezdomność w gminie", count: 4 },
  ],
  by_day: [
    { date: "2026-10-01", count: 8 },
    { date: "2026-10-02", count: 23 },
    { date: "2026-10-03", count: 45 },
    { date: "2026-10-04", count: 15 },
  ],
};

function Bar({ value, max, label }: { value: number; max: number; label: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="w-40 truncate text-sm font-bold text-deep" title={label}>
        {label}
      </span>
      <div
        className="h-6 rounded-ui bg-leaf"
        style={{ width: `${pct}%`, minWidth: "4px" }}
        role="presentation"
        aria-hidden="true"
      />
      <span className="text-sm tabular-nums text-muted">{value}</span>
    </div>
  );
}

function DayBar({ value, max, date }: { value: number; max: number; date: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  const label = new Date(date).toLocaleDateString("pl-PL", { day: "numeric", month: "short" });
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex h-32 items-end">
        <div
          className="w-10 rounded-t-ui bg-leaf"
          style={{ height: `${Math.max(pct, 4)}%` }}
          role="presentation"
          aria-hidden="true"
        />
      </div>
      <span className="text-xs text-muted">{label}</span>
      <span className="text-xs font-bold tabular-nums">{value}</span>
    </div>
  );
}

export default function TrendyPage() {
  const [data, setData] = useState<TrendsData>(MOCK_TRENDS);

  useEffect(() => {
    apiFetch<TrendsData>("/api/admin/trends", { headers: { "X-Dev-Admin": "true" } })
      .then((d) => d.top_tags.length > 0 ? setData(d) : null)
      .catch(() => {});
  }, []);

  const maxTagCount = Math.max(...data.top_tags.map((t) => t.count), 1);
  const maxDayCount = Math.max(...data.by_day.map((d) => d.count), 1);

  return (
    <div className="space-y-12">
      <h1 className="text-2xl font-bold text-deep">Trendy wyszukiwań</h1>

      <section aria-labelledby="tagi-tytul">
        <h2 id="tagi-tytul" className="text-lg font-bold text-deep">
          Top 10 tagów
        </h2>
        <div
          className="mt-4 space-y-2 rounded-ui border-(length:--bw) border-deep bg-surface p-6"
          role="img"
          aria-label="Wykres słupkowy top tagów"
        >
          {data.top_tags.map(({ tag, count }) => (
            <Bar key={tag} value={count} max={maxTagCount} label={tag} />
          ))}
        </div>
      </section>

      <section aria-labelledby="dzienne-tytul">
        <h2 id="dzienne-tytul" className="text-lg font-bold text-deep">
          Zgłoszenia per dzień
        </h2>
        <div
          className="mt-4 flex items-end gap-3 rounded-ui border-(length:--bw) border-deep bg-surface p-6"
          role="img"
          aria-label="Wykres słupkowy zgłoszeń per dzień"
        >
          {data.by_day.map(({ date, count }) => (
            <DayBar key={date} value={count} max={maxDayCount} date={date} />
          ))}
        </div>
      </section>

      <section aria-labelledby="zapytania-tytul">
        <h2 id="zapytania-tytul" className="text-lg font-bold text-deep">
          Najczęstsze zapytania
        </h2>
        <ol className="mt-4 space-y-2">
          {data.top_queries.map(({ query, count }, i) => (
            <li
              key={query}
              className="flex items-center gap-4 rounded-ui border-(length:--bw) border-deep bg-surface px-4 py-3"
            >
              <span className="w-6 text-center text-sm font-bold text-muted tabular-nums">{i + 1}.</span>
              <span className="flex-1 font-bold text-deep">{query}</span>
              <span className="rounded-full bg-sage px-2 py-0.5 text-sm tabular-nums">{count}×</span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
