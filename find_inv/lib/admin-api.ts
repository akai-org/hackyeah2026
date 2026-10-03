// Klient panelu admina (/api/admin/*). Gdy backend nie odpowiada, działa na kopii
// z data/admin.mock.ts trzymanej w pamięci karty — zmiany są widoczne do odświeżenia strony.

import {
  seedInnovations,
  seedTesters,
  seedTrends,
  seedUsers,
  type AdminInnovation,
  type AdminStats,
  type AdminTester,
  type AdminTrends,
  type AdminUser,
  type InnovationStatus,
} from "@/data/admin.mock";
import { seedEngagement } from "@/data/engagement.mock";
import type { Role } from "@/data/mock";
import { apiFetch } from "@/lib/api";

export type Result<T> = { data: T; offline: boolean };

export type InnovationAction = "approve" | "archive" | "flag-unmaintained";

export const ACTION_STATUS: Record<InnovationAction, InnovationStatus> = {
  approve: "active",
  archive: "archived",
  "flag-unmaintained": "unmaintained",
};

// Tymczasowy dostęp do czasu auth od A1 (backend: X-Dev-Admin). Strony panelu wpuszczają tylko rolę admin.
const ADMIN_HEADERS = { "X-Dev-Admin": "true" };

const local = {
  innovations: seedInnovations(),
  users: seedUsers(),
  testers: seedTesters(),
  trends: seedTrends(),
};

async function call<T>(path: string, fallback: () => T, init: RequestInit = {}): Promise<Result<T>> {
  try {
    const data = await apiFetch<T>(path, { ...init, headers: { ...ADMIN_HEADERS, ...init.headers } });
    return { data, offline: false };
  } catch (error) {
    // TypeError = brak połączenia z serwerem. Błędy HTTP (403, 404…) idą dalej do strony.
    if (error instanceof TypeError) return { data: fallback(), offline: true };
    throw error;
  }
}

export type InnovationFilters = { status?: string; tags?: string; search?: string };

export function getInnovations(filters: InnovationFilters = {}) {
  const params = new URLSearchParams(Object.entries(filters).filter(([, value]) => value) as Array<[string, string]>);
  return call<{ items: AdminInnovation[]; total: number }>(`/api/admin/innovations?${params}`, () => {
    const needle = filters.search?.toLowerCase();
    const items = local.innovations.filter(
      (item) =>
        (!filters.status || item.status === filters.status) &&
        (!filters.tags || item.tags.includes(filters.tags)) &&
        (!needle || item.title.toLowerCase().includes(needle) || item.short_desc.toLowerCase().includes(needle)),
    );
    return { items, total: items.length };
  });
}

export function setInnovationStatus(id: number, action: InnovationAction) {
  return call<AdminInnovation>(
    `/api/admin/innovations/${id}/${action}`,
    () => {
      const item = local.innovations.find((row) => row.id === id)!;
      item.status = ACTION_STATUS[action];
      item.updated_at = new Date().toISOString().slice(0, 19);
      return { ...item };
    },
    { method: "POST" },
  );
}

export function getUsers() {
  return call<AdminUser[]>("/api/admin/users", () => local.users.map((user) => ({ ...user })));
}

export function setUserRole(id: number, role: Exclude<Role, "admin">) {
  return call<AdminUser>(
    `/api/admin/users/${id}/set-role`,
    () => {
      const user = local.users.find((row) => row.id === id)!;
      user.role = role;
      return { ...user };
    },
    { method: "POST", body: JSON.stringify({ role }) },
  );
}

export function getTesters(approved?: boolean) {
  const query = approved === undefined ? "" : `?approved=${approved}`;
  return call<AdminTester[]>(`/api/admin/testers${query}`, () =>
    local.testers.filter((tester) => approved === undefined || tester.approved === approved).map((t) => ({ ...t })),
  );
}

export function approveTester(id: number) {
  return call<AdminTester>(
    `/api/admin/testers/${id}/approve`,
    () => {
      const tester = local.testers.find((row) => row.id === id)!;
      tester.approved = true;
      const user = local.users.find((row) => row.id === tester.user_id);
      if (user && user.role !== "admin") {
        user.role = "tester";
        user.tester_pending = false;
      }
      return { ...tester };
    },
    { method: "POST" },
  );
}

export function getTrends() {
  return call<AdminTrends>("/api/admin/search-trends", () => local.trends);
}

export function getStats() {
  return call<AdminStats>("/api/admin/stats", () => {
    const byStatus = { pending: 0, active: 0, archived: 0, unmaintained: 0 } as AdminStats["innovations_by_status"];
    local.innovations.forEach((item) => (byStatus[item.status] += 1));
    return {
      innovations: local.innovations.length,
      innovations_by_status: byStatus,
      users: local.users.length,
      testers: local.testers.filter((t) => t.approved).length,
      pending_testers: local.testers.filter((t) => !t.approved).length,
      searches: local.trends.total,
      searches_today: local.trends.by_day.at(-1)?.count ?? 0,
    };
  });
}

// ---------- Analityka zaangażowania (/api/admin/analytics/*, router admin.py) ----------
// Bez backendu albo bez zebranych zdarzeń widok pokazuje dane przykładowe z data/engagement.mock.ts.

export type EngagementMetric =
  | "impressions"
  | "clicks"
  | "views"
  | "cta_clicks"
  | "middleman_starts"
  | "middleman_plans"
  | "comments"
  | "tester_requests";

export type AnalyticsOverview = {
  days: number;
  metrics: Record<EngagementMetric, { value: number; previous: number; change_pct: number | null }>;
  ctr_pct: number | null;
  unique_visitors: number;
};

export type AnalyticsDay = { date: string } & Record<EngagementMetric, number>;

export type InnovationEngagement = {
  id: number;
  title: string;
  views_prev: number;
  views_delta: number;
  ctr_pct: number | null;
  trend_pct: number | null;
  avg_rating: number | null;
} & Record<EngagementMetric, number>;

export type FunnelStep = {
  step: EngagementMetric;
  label: string;
  count: number;
  pct_of_first: number | null;
  pct_of_prev: number | null;
};

export type AnalyticsFunnel = { days: number; steps: FunnelStep[]; impressions: number; clicks: number; ctr_pct: number | null };

export type DemandRow = { tag: string; searches: number; innovations: number; gap_ratio: number | null };

export type Engagement = {
  overview: AnalyticsOverview;
  timeseries: AnalyticsDay[];
  innovations: InnovationEngagement[];
  funnel: AnalyticsFunnel;
  demand: DemandRow[];
  /** true = dane przykładowe, nie z bazy. */
  demo: boolean;
};

/** Wszystkie dane widoku jednym wywołaniem — okres `days` dla liczników, rankingu i lejka. */
export async function getEngagement(days: number): Promise<Result<Engagement>> {
  let data: Engagement;
  try {
    const get = <T,>(path: string) => apiFetch<T>(path, { headers: ADMIN_HEADERS });
    const [overview, timeseries, innovations, funnel, demand] = await Promise.all([
      get<AnalyticsOverview>(`/api/admin/analytics/overview?days=${days}`),
      get<AnalyticsDay[]>(`/api/admin/analytics/timeseries?days=${Math.max(days, 14)}`),
      get<{ items: InnovationEngagement[] }>(`/api/admin/analytics/innovations?days=${days}&limit=50`),
      get<AnalyticsFunnel>(`/api/admin/analytics/funnel?days=${days}`),
      get<{ items: DemandRow[] }>(`/api/admin/analytics/demand?days=${days}`),
    ]);
    data = { overview, timeseries, innovations: innovations.items, funnel, demand: demand.items, demo: false };
  } catch (error) {
    if (error instanceof TypeError) return { data: seedEngagement(days), offline: true };
    throw error;
  }
  // Świeża baza bez żadnych zdarzeń — pusty panel nic by nie pokazał, więc dane przykładowe.
  const { views, impressions } = data.overview.metrics;
  if (views.value + impressions.value + views.previous + impressions.previous === 0) {
    return { data: seedEngagement(days), offline: false };
  }
  return { data, offline: false };
}
