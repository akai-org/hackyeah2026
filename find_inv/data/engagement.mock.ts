// Dane przykładowe zakładki /admin/zaangazowanie — gdy backend nie odpowiada albo nie zebrał jeszcze zdarzeń.
// Liczone z jednej dziennej serii na innowację, więc liczniki, wykres, ranking i lejek są ze sobą spójne.
// Deterministyczne (stałe ziarno), żeby demo wyglądało tak samo przy każdym odświeżeniu.

import type {
  AnalyticsDay,
  AnalyticsFunnel,
  AnalyticsOverview,
  DemandRow,
  Engagement,
  EngagementMetric,
  InnovationEngagement,
} from "@/lib/admin-api";

const METRICS: EngagementMetric[] = [
  "impressions",
  "clicks",
  "views",
  "cta_clicks",
  "middleman_starts",
  "middleman_plans",
  "comments",
  "tester_requests",
];

// id jak w data/innovations.ts, żeby linki z rankingu prowadziły do kart demo.
// pop = średnio wyświetleń dziennie, hot = skok popularności w ostatnim tygodniu, cold = spadek (nieaktualna).
const INNOVATIONS: Array<{ id: number; title: string; pop: number; hot?: boolean; cold?: boolean; ctr: number }> = [
  { id: 1, title: "Cyfrowy Senior", pop: 9, ctr: 0.27 },
  { id: 2, title: "Sąsiedzka Pomoc", pop: 6, hot: true, ctr: 0.31 },
  { id: 3, title: "Centrum Aktywności Lokalnej", pop: 4, ctr: 0.18 },
  { id: 4, title: "Telemedycyna dla Wsi", pop: 5, cold: true, ctr: 0.12 },
  { id: 5, title: "Asystent Osoby z Niepełnosprawnością", pop: 3.5, ctr: 0.22 },
  { id: 6, title: "Gminny bus na telefon", pop: 4.5, hot: true, ctr: 0.34 },
  { id: 7, title: "Punkt wsparcia po lekcjach", pop: 3, ctr: 0.25 },
  { id: 8, title: "Klub Rodzica w świetlicy", pop: 2.5, ctr: 0.2 },
  { id: 9, title: "Mentor dla migranta", pop: 2, hot: true, ctr: 0.29 },
  { id: 10, title: "Wspólna kuchnia w świetlicy", pop: 2.2, ctr: 0.24 },
  { id: 12, title: "Kawiarenka integracyjna", pop: 1.2, ctr: 0.15 },
];

const DEMAND: Array<[string, number, number]> = [
  ["seniorzy", 142, 25],
  ["samotność", 96, 5],
  ["transport", 88, 4],
  ["zdrowie_psychiczne", 71, 37],
  ["bezdomność", 47, 3],
  ["migranci", 44, 6],
  ["wykluczenie_cyfrowe", 41, 18],
  ["młodzież", 38, 29],
  ["uzależnienia", 31, 0],
  ["dostępność", 27, 48],
];

/** mulberry32 — mały PRNG z ziarnem. */
function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Counts = Record<EngagementMetric, number>;
const zero = (): Counts => Object.fromEntries(METRICS.map((m) => [m, 0])) as Counts;

/** Seria [dzień 0 = dziś … dzień N-1] × innowacja. */
function simulate(totalDays: number): Counts[][] {
  const random = rng(2026);
  // Zaokrąglenie losowe: 2,3 → 2 albo 3, średnio 2,3. Dzięki temu małe proporcje nie znikają do zera.
  const round = (x: number) => Math.floor(x) + (random() < x - Math.floor(x) ? 1 : 0);

  return Array.from({ length: totalDays }, (_, day) => {
    const growth = 1 + 0.3 * (1 - day / totalDays); // ruch powoli rośnie z tygodnia na tydzień
    const weekday = new Date(Date.now() - day * 86_400_000).getDay();
    const weekend = weekday === 0 || weekday === 6 ? 0.55 : 1; // OPS i NGO szukają w dni robocze

    return INNOVATIONS.map((innovation) => {
      const hot = innovation.hot && day < 7 ? 2.2 : innovation.cold ? 0.45 + Math.min(day, 30) / 30 : 1;
      const views = round(innovation.pop * growth * weekend * hot * (0.65 + random() * 0.7));
      const clicks = round(views * 0.78);
      const middlemanStarts = round(views * 0.13);
      return {
        views,
        clicks,
        impressions: round(clicks / innovation.ctr),
        cta_clicks: round(views * 0.21),
        middleman_starts: middlemanStarts,
        middleman_plans: round(middlemanStarts * 0.6),
        comments: round(views * 0.07),
        tester_requests: round(views * 0.025),
      };
    });
  });
}

const pct = (now: number, before: number) =>
  before === 0 ? (now === 0 ? null : 100) : Math.round(((now - before) / before) * 1000) / 10;

const sum = (rows: Counts[]) =>
  rows.reduce((acc, row) => {
    METRICS.forEach((m) => (acc[m] += row[m]));
    return acc;
  }, zero());

export function seedEngagement(days: number): Engagement {
  const chartDays = Math.max(days, 14);
  const series = simulate(Math.max(days * 2, chartDays));
  const current = series.slice(0, days);
  const previous = series.slice(days, days * 2);

  const totalNow = sum(current.flat());
  const totalBefore = sum(previous.flat());

  const overview: AnalyticsOverview = {
    days,
    metrics: Object.fromEntries(
      METRICS.map((m) => [m, { value: totalNow[m], previous: totalBefore[m], change_pct: pct(totalNow[m], totalBefore[m]) }]),
    ) as AnalyticsOverview["metrics"],
    ctr_pct: totalNow.impressions ? Math.round((totalNow.clicks / totalNow.impressions) * 1000) / 10 : null,
    unique_visitors: Math.round(totalNow.views * 0.58),
  };

  const timeseries: AnalyticsDay[] = series
    .slice(0, chartDays)
    .map((perInnovation, day) => ({
      date: new Date(Date.now() - day * 86_400_000).toISOString().slice(0, 10),
      ...sum(perInnovation),
    }))
    .reverse();

  const innovations: InnovationEngagement[] = INNOVATIONS.map((innovation, index) => {
    const now = sum(current.map((day) => day[index]));
    const before = sum(previous.map((day) => day[index]));
    return {
      id: innovation.id,
      title: innovation.title,
      ...now,
      views_prev: before.views,
      views_delta: now.views - before.views,
      ctr_pct: now.impressions ? Math.round((now.clicks / now.impressions) * 1000) / 10 : null,
      trend_pct: pct(now.views, before.views),
      avg_rating: null,
    };
  });

  const steps: Array<[EngagementMetric, string]> = [
    ["views", "Otwarta karta innowacji"],
    ["cta_clicks", "Klik w przycisk na karcie"],
    ["middleman_starts", "Start z Middlemanem"],
    ["middleman_plans", "Gotowy plan wdrożenia"],
    ["tester_requests", "Zgłoszenie testera"],
  ];
  const funnel: AnalyticsFunnel = {
    days,
    impressions: totalNow.impressions,
    clicks: totalNow.clicks,
    ctr_pct: overview.ctr_pct,
    steps: steps.map(([step, label], index) => {
      const count = totalNow[step];
      const first = totalNow.views;
      const prev = index > 0 ? totalNow[steps[index - 1][0]] : 0;
      return {
        step,
        label,
        count,
        pct_of_first: first ? Math.round((count / first) * 1000) / 10 : null,
        pct_of_prev: index > 0 && prev ? Math.round((count / prev) * 1000) / 10 : null,
      };
    }),
  };

  // Wyszukiwania skalowane do długości okresu (liczby bazowe są dla 30 dni).
  const demand: DemandRow[] = DEMAND.map(([tag, searches30, supply]) => {
    const searches = Math.max(1, Math.round((searches30 * days) / 30));
    return { tag, searches, innovations: supply, gap_ratio: supply ? Math.round((searches / supply) * 100) / 100 : null };
  });

  return { overview, timeseries, innovations, funnel, demand, demo: true };
}
