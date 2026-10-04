"use client";

import Link from "next/link";
import { useId, useState } from "react";
import {
  ArrowDown,
  Eye,
  Flame,
  FlaskConical,
  Info,
  MessageSquare,
  MessageSquareText,
  MousePointerClick,
  Route,
  TrendingDown,
  TrendingUp,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { CutoutText } from "@/components/cutout-text";
import { ErrorNote, LoadingRows, OfflineNote, useAdminData, useAdminI18n } from "@/components/admin/shared";
import { DataTable } from "@/components/admin/trends-view";
import { getEngagement, type EngagementMetric, type InnovationEngagement } from "@/lib/admin-api";
import { cn } from "@/lib/utils";

// Jedna seria na wykres w kolorze marki (jak w trends-view); metrykę wybiera się przełącznikiem,
// zamiast mieszać kilka skal na jednej osi.
// Kolory wykresów to tokeny CSS (recharts przekazuje je do atrybutów SVG), więc tryb kontrastu działa i tu.
const PRIMARY = "var(--color-primary)";
const FOREGROUND = "var(--color-foreground)";
const MUTED = "var(--color-muted)";
const GRID = "var(--color-secondary)";
const SURFACE = "var(--color-surface)";
const PERIODS = [7, 14, 30] as const;

// Etykiety metryk i kolumn są w słowniku (admin.engagement).
const CHART_METRICS: EngagementMetric[] = ["views", "clicks", "comments", "middleman_starts"];

type SortKey = "views" | "ctr_pct" | "comments" | "middleman_starts" | "tester_requests" | "views_delta";
const COLUMNS: SortKey[] = ["views", "views_delta", "ctr_pct", "comments", "middleman_starts", "tester_requests"];

function Change({ pct }: { pct: number | null }) {
  const { a, number } = useAdminI18n();
  if (pct === null) return <span className="text-muted">{a.engagement.noPrev}</span>;
  const up = pct >= 0;
  const Icon = up ? TrendingUp : TrendingDown;
  return (
    <span className="inline-flex items-center gap-1 rounded-full border-2 border-border bg-secondary/60 px-2.5 text-sm font-bold text-foreground">
      <Icon aria-hidden="true" className="size-4" />
      {up ? "+" : ""}
      {number(pct)}%<span className="sr-only">{a.engagement.vsPrev}</span>
    </span>
  );
}

function Kpi({ icon: Icon, label, value, suffix, change }: { icon: LucideIcon; label: string; value: string; suffix?: string; change?: React.ReactNode }) {
  return (
    <div className="flex flex-col border-(length:--bw) border-border bg-surface p-5 shadow-raised">
      <dt className="flex items-center gap-2 font-bold text-muted">
        <Icon aria-hidden="true" className="size-5 shrink-0 text-primary" />
        {label}
      </dt>
      <dd className="mt-2 text-[2.75rem] leading-none font-bold text-foreground tabular-nums">
        {value}
        {suffix && <span className="text-2xl">{suffix}</span>}
      </dd>
      {change && <dd className="mt-3">{change}</dd>}
    </div>
  );
}

export function AdminEngagementView() {
  const ids = useId();
  const [days, setDays] = useState<(typeof PERIODS)[number]>(14);
  const [metric, setMetric] = useState<EngagementMetric>("views");
  const [sort, setSort] = useState<SortKey>("views");
  const { data, offline, error, loading } = useAdminData(() => getEngagement(days), String(days));
  const { a, tagLabel, shortDate, number } = useAdminI18n();
  const e = a.engagement;
  const NUMBER = { format: number };

  const m = data?.overview.metrics;
  const series = data?.timeseries.map((d) => ({ date: shortDate(d.date), count: d[metric] })) ?? [];
  const rising = [...(data?.innovations ?? [])].filter((i) => i.views_delta > 0).sort((a, b) => b.views_delta - a.views_delta).slice(0, 5);
  const ranking = [...(data?.innovations ?? [])]
    .sort((a, b) => ((b[sort] as number | null) ?? -1) - ((a[sort] as number | null) ?? -1) || b.views - a.views)
    .slice(0, 15);
  const maxDemand = Math.max(1, ...(data?.demand.map((d) => d.searches) ?? []));

  return (
    <div>
      <CutoutText as="h1" size="section" text={e.title} />
      <p className="mt-3 mb-6 max-w-[60ch] text-lg">
        {e.lead}
      </p>

      <fieldset className="mb-8 flex flex-wrap items-center gap-2">
        <legend className="mb-2 font-bold text-foreground">{e.period}</legend>
        {PERIODS.map((period) => (
          <label
            key={period}
            className={cn(
              "inline-flex min-h-12 cursor-pointer items-center rounded-ui border-(length:--bw) border-border px-4 font-bold has-focus-visible:outline-2 has-focus-visible:outline-offset-2",
              days === period ? "bg-primary text-primary-foreground" : "bg-surface text-primary hover:bg-primary/10",
            )}
          >
            <input type="radio" name={`${ids}-okres`} className="sr-only" checked={days === period} onChange={() => setDays(period)} />
            {e.days(period)}
          </label>
        ))}
      </fieldset>

      <OfflineNote offline={offline} />
      <ErrorNote message={error} />
      {data?.demo && !offline && (
        <p className="mb-6 flex items-start gap-3 rounded-ui border-2 border-warning bg-warning/10 px-4 py-3">
          <Info aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-warning" />
          {e.demo}
        </p>
      )}

      {loading && !data ? (
        <LoadingRows label={e.loading} />
      ) : data && m ? (
        <div className="grid grid-cols-1 gap-6">
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Kpi icon={Eye} label={e.metrics.views} value={NUMBER.format(m.views.value)} change={<Change pct={m.views.change_pct} />} />
            <Kpi
              icon={MousePointerClick}
              label={e.ctr}
              value={data.overview.ctr_pct === null ? "–" : number(data.overview.ctr_pct)}
              suffix={data.overview.ctr_pct === null ? undefined : "%"}
              change={<span className="text-muted">{e.ctrDetail(NUMBER.format(m.clicks.value), NUMBER.format(m.impressions.value))}</span>}
            />
            <Kpi icon={MessageSquare} label={e.metrics.comments} value={NUMBER.format(m.comments.value)} change={<Change pct={m.comments.change_pct} />} />
            <Kpi icon={UserRound} label={e.visitors} value={NUMBER.format(data.overview.unique_visitors)} />
            <Kpi icon={MessageSquareText} label={e.metrics.middleman_starts} value={NUMBER.format(m.middleman_starts.value)} change={<Change pct={m.middleman_starts.change_pct} />} />
            <Kpi icon={Route} label={e.metrics.middleman_plans} value={NUMBER.format(m.middleman_plans.value)} change={<Change pct={m.middleman_plans.change_pct} />} />
            <Kpi icon={FlaskConical} label={e.metrics.tester_requests} value={NUMBER.format(m.tester_requests.value)} change={<Change pct={m.tester_requests.change_pct} />} />
            <Kpi icon={MousePointerClick} label={e.metrics.cta_clicks} value={NUMBER.format(m.cta_clicks.value)} change={<Change pct={m.cta_clicks.change_pct} />} />
          </dl>

          <section aria-labelledby={`${ids}-dni`} className="border-(length:--bw) border-border bg-surface p-6">
            <h2 id={`${ids}-dni`} className="text-xl font-bold text-primary">
              {e.perDay(e.metrics[metric])}
            </h2>
            <fieldset className="mt-3 flex flex-wrap gap-2">
              <legend className="sr-only">{e.chartMetric}</legend>
              {CHART_METRICS.map((key) => (
                <label
                  key={key}
                  className={cn(
                    "inline-flex min-h-10 cursor-pointer items-center rounded-full border-2 border-border px-3 text-sm font-bold has-focus-visible:outline-2 has-focus-visible:outline-offset-2",
                    metric === key ? "bg-primary text-primary-foreground" : "bg-surface text-muted hover:bg-primary/10",
                  )}
                >
                  <input type="radio" name={`${ids}-metryka`} className="sr-only" checked={metric === key} onChange={() => setMetric(key)} />
                  {e.metrics[key]}
                </label>
              ))}
            </fieldset>
            <div aria-hidden="true" className="mt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart accessibilityLayer={false} data={series} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid stroke={GRID} vertical={false} />
                  <XAxis dataKey="date" tick={{ fill: MUTED, fontSize: 14 }} tickLine={false} axisLine={{ stroke: GRID }} interval="preserveStartEnd" minTickGap={24} />
                  <YAxis allowDecimals={false} tick={{ fill: MUTED, fontSize: 14 }} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ background: SURFACE, border: "var(--bw) solid var(--color-border)", borderRadius: 12, color: FOREGROUND, fontSize: 16, padding: "8px 12px" }}
                    cursor={{ stroke: MUTED, strokeDasharray: "4 4" }}
                    formatter={(value) => [`${value}`, e.metrics[metric]]}
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke={PRIMARY}
                    strokeWidth={2}
                    fill={PRIMARY}
                    fillOpacity={0.14}
                    activeDot={{ r: 5, stroke: SURFACE, strokeWidth: 2, fill: PRIMARY }}
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <DataTable caption={e.perDayCaption(e.metrics[metric])} head={[e.day, e.metrics[metric]]} rows={series.map((d) => [d.date, d.count])} />
          </section>

          <div className="grid gap-6 lg:grid-cols-2">
            <section aria-labelledby={`${ids}-fala`} className="border-(length:--bw) border-border bg-surface p-6">
              <h2 id={`${ids}-fala`} className="flex items-center gap-2 text-xl font-bold text-foreground">
                <Flame aria-hidden="true" className="size-6 shrink-0 text-primary" />
                {e.rising}
              </h2>
              <p className="mt-1 text-muted">{e.risingHint(days)}</p>
              {rising.length === 0 ? (
                <p className="mt-4">{e.noRising}</p>
              ) : (
                <ol className="mt-4 space-y-3">
                  {rising.map((item, index) => (
                    <li key={item.id} className="flex items-start gap-3">
                      <span aria-hidden="true" className="w-6 shrink-0 text-right font-bold text-muted tabular-nums">
                        {index + 1}.
                      </span>
                      <Link href={`/innowacje/${item.id}`} className="min-w-0 flex-1 font-bold break-words text-primary underline underline-offset-4 hover:text-primary-hover">
                        {item.title}
                      </Link>
                      <span className="shrink-0 tabular-nums">
                        <strong>+{item.views_delta}</strong>{" "}
                        <span className="text-muted">
                          ({item.views_prev} → {item.views})
                        </span>
                      </span>
                    </li>
                  ))}
                </ol>
              )}
            </section>

            <section aria-labelledby={`${ids}-lejek`} className="border-(length:--bw) border-border bg-surface p-6">
              <h2 id={`${ids}-lejek`} className="text-xl font-bold text-foreground">
                {e.funnel}
              </h2>
              <p className="mt-1 text-muted">{e.funnelHint}</p>
              <ol className="mt-4 space-y-3">
                {data.funnel.steps.map((step, index) => (
                  <li key={step.step}>
                    {index > 0 && step.pct_of_prev !== null && (
                      <p className="mb-1 flex items-center gap-1 text-sm text-muted">
                        <ArrowDown aria-hidden="true" className="size-4" />
                        {e.ofPrev(number(step.pct_of_prev))}
                      </p>
                    )}
                    <div className="flex items-center justify-between gap-4">
                      <span className="font-bold">{step.label}</span>
                      <span className="font-bold tabular-nums">{NUMBER.format(step.count)}</span>
                    </div>
                    <div aria-hidden="true" className="mt-1.5 h-3 rounded-full bg-secondary">
                      <div className="h-3 rounded-full bg-primary" style={{ width: `${step.pct_of_first ?? 0}%` }} />
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          </div>

          <section aria-labelledby={`${ids}-ranking`} className="border-(length:--bw) border-border bg-surface p-6">
            <h2 id={`${ids}-ranking`} className="text-xl font-bold text-foreground">
              {e.ranking}
            </h2>
            <p className="mt-1 text-muted">
              {e.rankingHint}
            </p>
            <div tabIndex={0} className="relative mt-4 overflow-x-auto">
              <table className="w-full min-w-[44rem] border-collapse text-left">
                <caption className="sr-only">{e.rankingCaption(days)}</caption>
                <thead>
                  <tr className="border-b-2 border-border">
                    <th scope="col" className="py-2 pr-4 font-bold text-foreground">{e.innovation}</th>
                    {COLUMNS.map((key) => ({ key, label: e.columns[key] })).map((col) => (
                      <th key={col.key} scope="col" aria-sort={sort === col.key ? "descending" : undefined} className="py-2 pl-3 text-right">
                        <button
                          type="button"
                          onClick={() => setSort(col.key)}
                          className={cn("inline-flex min-h-10 items-center gap-1 font-bold", sort === col.key ? "text-primary underline underline-offset-4" : "text-muted hover:text-primary-hover")}
                        >
                          {col.label}
                          {sort === col.key && <ArrowDown aria-hidden="true" className="size-4" />}
                        </button>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ranking.map((item: InnovationEngagement) => (
                    <tr key={item.id} className="border-b border-border/40">
                      <th scope="row" className="max-w-[22rem] py-2 pr-4 text-left font-normal">
                        <Link href={`/innowacje/${item.id}`} className="text-primary underline underline-offset-4 hover:text-primary-hover">
                          {item.title}
                        </Link>
                      </th>
                      <td className="py-2 pl-3 text-right tabular-nums">{item.views}</td>
                      <td className="py-2 pl-3 text-right tabular-nums">
                        {item.views_delta > 0 ? "+" : ""}
                        {item.views_delta}
                      </td>
                      <td className="py-2 pl-3 text-right tabular-nums">{item.ctr_pct === null ? "–" : `${number(item.ctr_pct)}%`}</td>
                      <td className="py-2 pl-3 text-right tabular-nums">{item.comments}</td>
                      <td className="py-2 pl-3 text-right tabular-nums">{item.middleman_starts}</td>
                      <td className="py-2 pl-3 text-right tabular-nums">{item.tester_requests}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {ranking.length === 0 && <p className="mt-4">{e.noEvents}</p>}
            </div>
          </section>

          <section aria-labelledby={`${ids}-popyt`} className="border-(length:--bw) border-destructive bg-surface p-6">
            <h2 id={`${ids}-popyt`} className="text-xl font-bold text-foreground">
              {e.demand}
            </h2>
            <p className="mt-1 text-muted">
              {e.demandHint}
            </p>
            {data.demand.length === 0 ? (
              <p className="mt-4">{e.noSearches}</p>
            ) : (
              <div tabIndex={0} className="relative mt-4 overflow-x-auto">
                <table className="w-full min-w-[36rem] border-collapse text-left">
                  <caption className="sr-only">{e.demandCaption}</caption>
                  <thead>
                    <tr className="border-b-2 border-border">
                      <th scope="col" className="py-2 pr-4 font-bold text-foreground">{e.topic}</th>
                      <th scope="col" className="py-2 pr-4 font-bold text-foreground">{e.searches}</th>
                      <th scope="col" className="py-2 pl-3 text-right font-bold text-foreground">{e.innovations}</th>
                      <th scope="col" className="py-2 pl-3 text-right font-bold text-foreground">{e.perInnovation}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.demand.map((row) => {
                      const gap = row.gap_ratio === null || row.gap_ratio >= 10;
                      return (
                        <tr key={row.tag} className="border-b border-border/40">
                          <th scope="row" className="py-2 pr-4 text-left font-normal">{tagLabel(row.tag)}</th>
                          <td className="py-2 pr-4">
                            <span className="flex items-center gap-3">
                              <span aria-hidden="true" className="h-3 flex-1 rounded-full bg-secondary">
                                <span className="block h-3 rounded-full bg-primary" style={{ width: `${(row.searches / maxDemand) * 100}%` }} />
                              </span>
                              <span className="w-10 text-right tabular-nums">{row.searches}</span>
                            </span>
                          </td>
                          <td className="py-2 pl-3 text-right tabular-nums">{row.innovations}</td>
                          <td className={cn("py-2 pl-3 text-right tabular-nums", gap && "font-bold text-destructive")}>
                            {row.gap_ratio === null ? e.noInnovations : number(row.gap_ratio)}
                            {gap && <span className="sr-only">{e.gap}</span>}
                          </td>
                        </tr>
                      );
                    })}
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
