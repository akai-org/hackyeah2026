"use client";

import { useId } from "react";
import { SearchX, TrendingDown, TrendingUp } from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { CutoutText } from "@/components/cutout-text";
import { ErrorNote, LoadingRows, OfflineNote, tagLabel, useAdminData } from "@/components/admin/shared";
import { getTrends } from "@/lib/admin-api";

// Jedna seria na wykres → jeden kolor marki (leaf, kontrast 6,19:1 na surface), bez legendy.
// Każdy wykres ma tabelę z tymi samymi danymi dla czytników ekranu i bez myszy.
const LEAF = "#2D6A4F";
const INK = "#14251C";
const MUTED = "#3D5A4A";
const GRID = "#D3E3D0";
const SURFACE = "#FAFCF7";

const tooltipStyle = {
  background: SURFACE,
  border: `2px solid #1B4332`,
  borderRadius: 12,
  color: INK,
  fontSize: 16,
  padding: "8px 12px",
};

function shortDate(iso: string) {
  return new Date(iso).toLocaleDateString("pl-PL", { day: "numeric", month: "short" });
}

export function DataTable({ caption, head, rows }: { caption: string; head: [string, string]; rows: Array<[string, number]> }) {
  return (
    <details className="mt-4">
      <summary className="inline-flex min-h-12 cursor-pointer items-center rounded-ui font-bold text-leaf underline underline-offset-4">
        Pokaż dane w tabeli
      </summary>
      <table className="mt-2 w-full border-collapse text-left">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b-2 border-deep">
            <th scope="col" className="py-2 pr-4 font-bold text-deep">{head[0]}</th>
            <th scope="col" className="py-2 text-right font-bold text-deep">{head[1]}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([label, value]) => (
            <tr key={label} className="border-b border-sage">
              <th scope="row" className="py-1.5 pr-4 text-left font-normal">{label}</th>
              <td className="py-1.5 text-right tabular-nums">{value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </details>
  );
}

export function AdminTrendsView() {
  const ids = useId();
  const { data, offline, error, loading } = useAdminData(getTrends);

  const tags = data?.top_tags.map((t) => ({ name: tagLabel(t.tag), count: t.count })) ?? [];
  const days = data?.by_day.map((d) => ({ date: shortDate(d.date), count: d.count })) ?? [];
  const change = data?.change_pct;

  return (
    <div>
      <CutoutText as="h1" size="section" text="Czego szukają ludzie" />
      <p className="mt-3 mb-8 max-w-[60ch] text-lg">
        Każde wyszukiwanie w HubMI to sygnał potrzeby. Tak widać, gdzie brakuje rozwiązań w Małopolsce.
      </p>

      <OfflineNote offline={offline} />
      <ErrorNote message={error} />

      {loading && !data ? (
        <LoadingRows label="Wczytuję trendy" />
      ) : data ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <section aria-labelledby={`${ids}-dni`} className="border-(length:--bw) border-deep bg-surface p-6 lg:col-span-2">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <h2 id={`${ids}-dni`} className="text-xl font-bold text-deep">
                Wyszukiwania dzień po dniu
              </h2>
              <p className="flex items-center gap-2 font-bold text-deep">
                <span className="tabular-nums">{data.total}</span> w ostatnich 14 dniach
                {change !== null && change !== undefined && (
                  <span className="inline-flex items-center gap-1 rounded-full border-2 border-deep bg-mint px-2.5 text-sm">
                    {change >= 0 ? <TrendingUp aria-hidden="true" className="size-4" /> : <TrendingDown aria-hidden="true" className="size-4" />}
                    {change >= 0 ? "+" : ""}
                    {change.toLocaleString("pl-PL")}% tydzień do tygodnia
                  </span>
                )}
              </p>
            </div>
            <div aria-hidden="true" className="mt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={days} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid stroke={GRID} vertical={false} />
                  <XAxis dataKey="date" tick={{ fill: MUTED, fontSize: 14 }} tickLine={false} axisLine={{ stroke: GRID }} interval="preserveStartEnd" minTickGap={24} />
                  <YAxis allowDecimals={false} tick={{ fill: MUTED, fontSize: 14 }} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    cursor={{ stroke: MUTED, strokeDasharray: "4 4" }}
                    formatter={(value) => [`${value}`, "Wyszukiwania"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke={LEAF}
                    strokeWidth={2}
                    fill={LEAF}
                    fillOpacity={0.14}
                    activeDot={{ r: 5, stroke: SURFACE, strokeWidth: 2, fill: LEAF }}
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <DataTable caption="Liczba wyszukiwań każdego dnia" head={["Dzień", "Wyszukiwania"]} rows={days.map((d) => [d.date, d.count])} />
          </section>

          <section aria-labelledby={`${ids}-tagi`} className="border-(length:--bw) border-deep bg-surface p-6">
            <h2 id={`${ids}-tagi`} className="text-xl font-bold text-deep">
              Najczęstsze tematy
            </h2>
            <p className="mt-1 text-muted">Tagi nadane przez autotagger, top 10</p>
            <div aria-hidden="true" className="mt-4" style={{ height: Math.max(tags.length * 36, 120) }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={tags} layout="vertical" margin={{ top: 0, right: 40, left: 0, bottom: 0 }} barCategoryGap={6}>
                  <XAxis type="number" hide />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={150}
                    tick={{ fill: INK, fontSize: 15 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip contentStyle={tooltipStyle} cursor={{ fill: GRID, opacity: 0.6 }} formatter={(value) => [`${value}`, "Wyszukiwania"]} />
                  <Bar dataKey="count" fill={LEAF} radius={[0, 4, 4, 0]} isAnimationActive={false}>
                    <LabelList dataKey="count" position="right" fill={INK} fontSize={15} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <DataTable caption="Najczęstsze tagi w wyszukiwaniach" head={["Temat", "Wyszukiwania"]} rows={tags.map((t) => [t.name, t.count])} />
          </section>

          <div className="flex flex-col gap-6">
            <section aria-labelledby={`${ids}-zapytania`} className="border-(length:--bw) border-deep bg-surface p-6">
              <h2 id={`${ids}-zapytania`} className="text-xl font-bold text-deep">
                Najczęstsze zapytania
              </h2>
              <ol className="mt-4 space-y-3">
                {data.top_queries.slice(0, 6).map((q, index) => (
                  <li key={q.query} className="flex items-start gap-3">
                    <span aria-hidden="true" className="w-6 shrink-0 text-right font-bold text-muted tabular-nums">
                      {index + 1}.
                    </span>
                    <span className="flex-1">„{q.query}”</span>
                    <span className="shrink-0 font-bold tabular-nums">
                      {q.count}
                      <span className="sr-only"> razy</span>
                    </span>
                  </li>
                ))}
              </ol>
            </section>

            <section aria-labelledby={`${ids}-luki`} className="border-(length:--bw) border-alert bg-surface p-6">
              <h2 id={`${ids}-luki`} className="flex items-center gap-2 text-xl font-bold text-alert">
                <SearchX aria-hidden="true" className="size-6 shrink-0" />
                Luki: szukano, nie znaleziono
              </h2>
              <p className="mt-1 text-muted">Tu warto poszukać nowych innowacji albo ogłosić konkurs.</p>
              {data.zero_result_queries.length === 0 ? (
                <p className="mt-4">Każde zapytanie miało wyniki.</p>
              ) : (
                <ul className="mt-4 space-y-2">
                  {data.zero_result_queries.map((q) => (
                    <li key={q.query} className="flex items-start justify-between gap-3">
                      <span>„{q.query}”</span>
                      <span className="shrink-0 font-bold tabular-nums">
                        {q.count}
                        <span className="sr-only"> razy</span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </div>
      ) : null}
    </div>
  );
}
