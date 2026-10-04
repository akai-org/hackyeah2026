"use client";

import { useId, useState } from "react";
import { Inbox, TrendingDown, TrendingUp } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { CutoutText } from "@/components/cutout-text";
import { ErrorNote, LoadingRows, OfflineNote, formatDate, useAdminData } from "@/components/admin/shared";
import { DataTable } from "@/components/admin/trends-view";
import { getReportedNeeds, type NeedsTrends, type ReporterType } from "@/lib/admin-api";
import { cn } from "@/lib/utils";

// Kolory jak w trends-view; druga seria (wyszukiwania) w ciemniejszej zieleni marki.
const LEAF = "#2D6A4F";
const DEEP = "#1B4332";
const INK = "#14251C";
const MUTED = "#3D5A4A";
const GRID = "#D3E3D0";
const SURFACE = "#FAFCF7";

const tooltipStyle = { background: SURFACE, border: `2px solid ${DEEP}`, borderRadius: 12, color: INK, fontSize: 16, padding: "8px 12px" };

const REPORTER_LABELS: Record<ReporterType, string> = {
  resident: "Mieszkaniec",
  ngo: "Organizacja pozarządowa",
  institution: "Instytucja",
  local_government: "Samorząd",
  other: "Inne",
};

const TREND_LABELS: Record<NeedsTrends["areas"][number]["trend"], string> = {
  up: "rośnie",
  down: "spada",
  flat: "bez zmian",
  new: "nowy temat",
};

const PERIODS = [3, 6, 12];

function areaName(area: { name: string } | null) {
  return area?.name ?? "Bez obszaru";
}

export function AdminNeedsView() {
  const ids = useId();
  const [months, setMonths] = useState(6);
  const [region, setRegion] = useState("");
  const { data, offline, error, loading } = useAdminData(() => getReportedNeeds(months), String(months));

  const trends = data?.trends;
  const areas = (trends?.areas ?? []).filter((a) => a.needs + a.searches > 0);
  const chart = areas.map((a) => ({ name: areaName(a.area), needs: a.needs, searches: a.searches }));
  const regions = Array.from(new Set((data?.needs ?? []).map((n) => n.region).filter(Boolean) as string[])).sort();
  const needs = (data?.needs ?? []).filter((n) => !region || n.region === region);

  return (
    <div>
      <CutoutText as="h1" size="section" text="Zgłoszone potrzeby" />
      <p className="mt-3 mb-8 max-w-[60ch] text-lg">
        Problemy opisane przez mieszkańców, organizacje i samorządy w Zasobniku wiedzy — z podziałem na obszary i trend
        z ostatnich 30 dni.
      </p>

      <OfflineNote offline={offline} />
      <ErrorNote message={error} />

      {loading && !data ? (
        <LoadingRows label="Wczytuję zgłoszone potrzeby" />
      ) : data && trends ? (
        <div className="grid gap-6">
          <section aria-labelledby={`${ids}-obszary`} className="border-(length:--bw) border-border bg-surface p-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 id={`${ids}-obszary`} className="text-xl font-bold text-foreground">
                  Potrzeby i wyszukiwania według obszaru
                </h2>
                <p className="mt-1 text-muted">
                  <span className="font-bold text-foreground tabular-nums">{trends.total_needs}</span> zgłoszeń i{" "}
                  <span className="font-bold text-foreground tabular-nums">{trends.total_searches}</span> wyszukiwań w okresie
                </p>
              </div>
              <div>
                <label htmlFor={`${ids}-okres`} className="block font-bold text-foreground">
                  Okres
                </label>
                <select
                  id={`${ids}-okres`}
                  value={months}
                  onChange={(event) => setMonths(Number(event.target.value))}
                  className="mt-2 min-h-12 cursor-pointer rounded-ui border-(length:--bw) border-border bg-surface px-3 text-base"
                >
                  {PERIODS.map((p) => (
                    <option key={p} value={p}>
                      ostatnie {p} mies.
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {chart.length === 0 ? (
              <p className="mt-6">W tym okresie nikt nie zgłosił potrzeby ani nie szukał w Zasobniku.</p>
            ) : (
              <>
                <div aria-hidden="true" className="mt-6" style={{ height: Math.max(chart.length * 56, 160) }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart accessibilityLayer={false} data={chart} layout="vertical" margin={{ top: 0, right: 24, left: 0, bottom: 0 }} barCategoryGap={10}>
                      <CartesianGrid stroke={GRID} horizontal={false} />
                      <XAxis type="number" allowDecimals={false} tick={{ fill: MUTED, fontSize: 14 }} tickLine={false} axisLine={false} />
                      <YAxis type="category" dataKey="name" width={170} tick={{ fill: INK, fontSize: 15 }} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={tooltipStyle} cursor={{ fill: GRID, opacity: 0.6 }} />
                      <Legend wrapperStyle={{ color: INK, fontSize: 15 }} />
                      <Bar dataKey="needs" name="Zgłoszone potrzeby" fill={LEAF} radius={[0, 4, 4, 0]} isAnimationActive={false} />
                      <Bar dataKey="searches" name="Wyszukiwania" fill={DEEP} fillOpacity={0.45} radius={[0, 4, 4, 0]} isAnimationActive={false} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <DataTable
                  caption="Zgłoszone potrzeby według obszaru"
                  head={["Obszar", "Zgłoszenia"]}
                  rows={chart.map((row) => [row.name, row.needs])}
                />
                <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {areas.map((a) => (
                    <li key={a.area?.slug ?? "brak"} className="rounded-ui border-2 border-border/40 p-4">
                      <p className="font-bold text-foreground">{areaName(a.area)}</p>
                      <p className="mt-1 flex items-center gap-2 text-sm">
                        {a.trend === "down" ? (
                          <TrendingDown aria-hidden="true" className="size-4 text-muted" />
                        ) : (
                          <TrendingUp aria-hidden="true" className={cn("size-4", a.trend === "up" || a.trend === "new" ? "text-destructive" : "text-muted")} />
                        )}
                        <span>
                          {a.needs_last_30d} w ostatnich 30 dniach (wcześniej {a.needs_prev_30d}) — {TREND_LABELS[a.trend]}
                          {a.change_pct !== null && ` (${a.change_pct > 0 ? "+" : ""}${a.change_pct.toLocaleString("pl-PL")}%)`}
                        </span>
                      </p>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </section>

          <section aria-labelledby={`${ids}-lista`} className="border-(length:--bw) border-border bg-surface p-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <h2 id={`${ids}-lista`} className="text-xl font-bold text-foreground">
                Ostatnie zgłoszenia <span className="tabular-nums">({needs.length})</span>
              </h2>
              {regions.length > 0 && (
                <div>
                  <label htmlFor={`${ids}-region`} className="block font-bold text-foreground">
                    Region
                  </label>
                  <select
                    id={`${ids}-region`}
                    value={region}
                    onChange={(event) => setRegion(event.target.value)}
                    className="mt-2 min-h-12 cursor-pointer rounded-ui border-(length:--bw) border-border bg-surface px-3 text-base"
                  >
                    <option value="">Wszystkie</option>
                    {regions.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            {needs.length === 0 ? (
              <p className="mt-6 flex items-center gap-2">
                <Inbox aria-hidden="true" className="size-5 text-muted" />
                Brak zgłoszonych potrzeb. Pojawią się tu, gdy ktoś opisze problem w Zasobniku wiedzy.
              </p>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[40rem] border-collapse text-left">
                  <caption className="sr-only">Zgłoszone potrzeby, od najnowszych</caption>
                  <thead className="bg-secondary">
                    <tr>
                      <th scope="col" className="px-4 py-3 font-bold text-foreground">Opis potrzeby</th>
                      <th scope="col" className="px-4 py-3 font-bold text-foreground">Obszar</th>
                      <th scope="col" className="px-4 py-3 font-bold text-foreground">Kto zgłosił</th>
                      <th scope="col" className="px-4 py-3 font-bold text-foreground">Region</th>
                      <th scope="col" className="px-4 py-3 font-bold text-foreground">Data</th>
                    </tr>
                  </thead>
                  <tbody>
                    {needs.map((need) => (
                      <tr key={need.id} className="border-t-2 border-border/40 align-top">
                        <td className="max-w-md px-4 py-3">{need.description}</td>
                        <td className="px-4 py-3">{need.area ? need.area.name : <span className="text-muted">nieprzypisane</span>}</td>
                        <td className="px-4 py-3">{REPORTER_LABELS[need.reporter_type] ?? need.reporter_type}</td>
                        <td className="px-4 py-3">{need.region ?? <span className="text-muted">brak</span>}</td>
                        <td className="px-4 py-3 whitespace-nowrap tabular-nums">{formatDate(need.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      ) : null}
    </div>
  );
}
