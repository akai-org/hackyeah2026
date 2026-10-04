"use client";

import { useId, useState } from "react";
import { Inbox, TrendingDown, TrendingUp } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { CutoutText } from "@/components/cutout-text";
import { ErrorNote, LoadingRows, OfflineNote, useAdminData, useAdminI18n } from "@/components/admin/shared";
import { DataTable } from "@/components/admin/trends-view";
import { getReportedNeeds } from "@/lib/admin-api";
import { cn } from "@/lib/utils";

// Kolory z tokenów, jak w trends-view (działa też w trybie wysokiego kontrastu); druga seria w akcencie.
const LEAF = "var(--color-primary)";
const DEEP = "var(--color-accent)";
const INK = "var(--color-foreground)";
const MUTED = "var(--color-muted)";
const GRID = "var(--color-secondary)";
const SURFACE = "var(--color-surface)";

const tooltipStyle = { background: SURFACE, border: "2px solid var(--color-border)", borderRadius: 12, color: INK, fontSize: 16, padding: "8px 12px" };

// Etykiety zgłaszających i trendów są w słowniku (admin.needs).
const PERIODS = [3, 6, 12];

function areaName(area: { name: string } | null, fallback: string) {
  return area?.name ?? fallback;
}

export function AdminNeedsView() {
  const ids = useId();
  const [months, setMonths] = useState(6);
  const [region, setRegion] = useState("");
  const { data, offline, error, loading } = useAdminData(() => getReportedNeeds(months), String(months));
  const { a, formatDate, number } = useAdminI18n();
  const n = a.needs;

  const trends = data?.trends;
  const areas = (trends?.areas ?? []).filter((row) => row.needs + row.searches > 0);
  const chart = areas.map((row) => ({ name: areaName(row.area, n.noArea), needs: row.needs, searches: row.searches }));
  const regions = Array.from(new Set((data?.needs ?? []).map((n) => n.region).filter(Boolean) as string[])).sort();
  const needs = (data?.needs ?? []).filter((n) => !region || n.region === region);

  return (
    <div>
      <CutoutText as="h1" size="section" text={n.title} />
      <p className="mt-3 mb-8 max-w-[60ch] text-lg">
        {n.lead}
      </p>

      <OfflineNote offline={offline} />
      <ErrorNote message={error} />

      {loading && !data ? (
        <LoadingRows label={n.loading} />
      ) : data && trends ? (
        <div className="grid grid-cols-1 gap-6">
          <section aria-labelledby={`${ids}-obszary`} className="border-(length:--bw) border-border bg-surface p-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 id={`${ids}-obszary`} className="text-xl font-bold text-foreground">
                  {n.byArea}
                </h2>
                <p className="mt-1 text-muted">
                  <span className="font-bold text-foreground tabular-nums">{trends.total_needs}</span>
                  {n.totals[1]}
                  <span className="font-bold text-foreground tabular-nums">{trends.total_searches}</span>
                  {n.totals[2]}
                </p>
              </div>
              <div>
                <label htmlFor={`${ids}-okres`} className="block font-bold text-foreground">
                  {n.period}
                </label>
                <select
                  id={`${ids}-okres`}
                  value={months}
                  onChange={(event) => setMonths(Number(event.target.value))}
                  className="mt-2 min-h-12 cursor-pointer rounded-ui border-(length:--bw) border-border bg-surface px-3 text-base"
                >
                  {PERIODS.map((p) => (
                    <option key={p} value={p}>
                      {n.lastMonths(p)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {chart.length === 0 ? (
              <p className="mt-6">{n.noneInPeriod}</p>
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
                      <Bar dataKey="needs" name={n.reported} fill={LEAF} radius={[0, 4, 4, 0]} isAnimationActive={false} />
                      <Bar dataKey="searches" name={n.searches} fill={DEEP} radius={[0, 4, 4, 0]} isAnimationActive={false} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <DataTable
                  caption={n.byAreaCaption}
                  head={[n.area, n.reports]}
                  rows={chart.map((row) => [row.name, row.needs])}
                />
                <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {areas.map((row) => (
                    <li key={row.area?.slug ?? "brak"} className="rounded-ui border-2 border-border/40 p-4">
                      <p className="font-bold text-foreground">{areaName(row.area, n.noArea)}</p>
                      <p className="mt-1 flex items-center gap-2 text-sm">
                        {row.trend === "down" ? (
                          <TrendingDown aria-hidden="true" className="size-4 text-muted" />
                        ) : (
                          <TrendingUp aria-hidden="true" className={cn("size-4", row.trend === "up" || row.trend === "new" ? "text-destructive" : "text-muted")} />
                        )}
                        <span>
                          {n.last30(row.needs_last_30d, row.needs_prev_30d, n.trend[row.trend])}
                          {row.change_pct !== null && ` (${row.change_pct > 0 ? "+" : ""}${number(row.change_pct)}%)`}
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
                {n.recent} <span className="tabular-nums">({needs.length})</span>
              </h2>
              {regions.length > 0 && (
                <div>
                  <label htmlFor={`${ids}-region`} className="block font-bold text-foreground">
                    {n.region}
                  </label>
                  <select
                    id={`${ids}-region`}
                    value={region}
                    onChange={(event) => setRegion(event.target.value)}
                    className="mt-2 min-h-12 cursor-pointer rounded-ui border-(length:--bw) border-border bg-surface px-3 text-base"
                  >
                    <option value="">{n.all}</option>
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
                {n.empty}
              </p>
            ) : (
              <div tabIndex={0} className="relative mt-4 overflow-x-auto">
                <table className="w-full min-w-[40rem] border-collapse text-left">
                  <caption className="sr-only">{n.caption}</caption>
                  <thead className="bg-secondary">
                    <tr>
                      <th scope="col" className="px-4 py-3 font-bold text-foreground">{n.colDescription}</th>
                      <th scope="col" className="px-4 py-3 font-bold text-foreground">{n.colArea}</th>
                      <th scope="col" className="px-4 py-3 font-bold text-foreground">{n.colReporter}</th>
                      <th scope="col" className="px-4 py-3 font-bold text-foreground">{n.colRegion}</th>
                      <th scope="col" className="px-4 py-3 font-bold text-foreground">{n.colDate}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {needs.map((need) => (
                      <tr key={need.id} className="border-t-2 border-border/40 align-top">
                        <td className="max-w-md px-4 py-3">{need.description}</td>
                        <td className="px-4 py-3">{need.area ? need.area.name : <span className="text-muted">{n.unassigned}</span>}</td>
                        <td className="px-4 py-3">{n.reporters[need.reporter_type] ?? need.reporter_type}</td>
                        <td className="px-4 py-3">{need.region ?? <span className="text-muted">{n.none}</span>}</td>
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
