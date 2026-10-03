"use client";

import { useCallback, useEffect, useState } from "react";
import { BookOpen, RefreshCw, Search, Users, ClipboardCheck, Clock, Lightbulb, MessageSquare } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";

interface Stats {
  innovations: number;
  users: number;
  testers: number;
  pending_testers: number;
  searches: number;
  ideas: number;
  pending_ideas: number;
}

interface RecentItem {
  query?: string;
  content?: string;
  title?: string;
  author_name?: string;
  badge?: string;
  status?: string;
  created_at: string | null;
}

interface Recent {
  searches: RecentItem[];
  forum_posts: RecentItem[];
  ideas: RecentItem[];
}

const MOCK_STATS: Stats = {
  innovations: 21,
  users: 0,
  testers: 0,
  pending_testers: 0,
  searches: 0,
  ideas: 0,
  pending_ideas: 0,
};

function fmtTime(iso: string | null) {
  if (!iso) return "";
  return new Date(iso).toLocaleString("pl-PL", { hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" });
}

export default function StatystykiPage() {
  const [stats, setStats] = useState<Stats>(MOCK_STATS);
  const [recent, setRecent] = useState<Recent | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const [statsData, recentData] = await Promise.all([
        apiFetch<Stats>("/api/admin/stats", { headers: { "X-Dev-Admin": "true" } }),
        apiFetch<Recent>("/api/admin/recent", { headers: { "X-Dev-Admin": "true" } }),
      ]);
      if (statsData) { setStats(statsData); setLastUpdated(new Date()); }
      if (recentData) setRecent(recentData);
    } catch {
      /* keep previous */
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const cards = [
    { label: "Innowacje w bazie", value: stats.innovations, icon: BookOpen, bg: "bg-mint" },
    { label: "Zarejestrowani użytkownicy", value: stats.users, icon: Users, bg: "bg-sage" },
    { label: "Aktywni testerzy", value: stats.testers, icon: ClipboardCheck, bg: "bg-butter" },
    { label: "Oczekujące zgłoszenia", value: stats.pending_testers, icon: Clock, bg: "bg-paper" },
    { label: "Wyszukiwania łącznie", value: stats.searches, icon: Search, bg: "bg-sage" },
    { label: "Pomysły z Kreatora", value: stats.ideas ?? 0, icon: Lightbulb, bg: "bg-butter", sub: (stats.pending_ideas ?? 0) > 0 ? `${stats.pending_ideas} nowych` : undefined },
  ];

  const hasRecent = recent && (
    recent.searches.length > 0 ||
    recent.forum_posts.length > 0 ||
    recent.ideas.length > 0
  );

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-2xl font-bold text-deep">Statystyki platformy</h1>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-sm text-muted">
              Odświeżono: {lastUpdated.toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
          <Button variant="secondary" onClick={load} disabled={refreshing} className="gap-2 text-sm">
            <RefreshCw className={`size-4 ${refreshing ? "animate-spin" : ""}`} aria-hidden="true" />
            Odśwież
          </Button>
        </div>
      </div>

      <ul className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map(({ label, value, icon: Icon, bg, ...rest }) => {
          const sub = (rest as { sub?: string }).sub;
          return (
            <li key={label} className={`border-(length:--bw) border-deep ${bg} p-6 shadow-paper`}>
              <Icon className="size-8 text-leaf" aria-hidden="true" />
              <p className="mt-4 text-4xl font-bold text-deep tabular-nums">{value.toLocaleString("pl-PL")}</p>
              <p className="mt-1 text-muted">{label}</p>
              {sub && <p className="mt-1 text-sm font-bold text-alert">{sub}</p>}
            </li>
          );
        })}
      </ul>

      {hasRecent && (
        <div className="grid gap-6 md:grid-cols-3">
          {/* Recent searches */}
          <section aria-labelledby="last-searches-tytul">
            <h2 id="last-searches-tytul" className="flex items-center gap-2 font-bold text-deep">
              <Search className="size-4" aria-hidden="true" />
              Ostatnie wyszukiwania
            </h2>
            <ul className="mt-3 space-y-2">
              {recent.searches.length > 0 ? recent.searches.map((s, i) => (
                <li key={i} className="rounded-ui border-(length:--bw) border-sage bg-surface p-3 text-sm">
                  <p className="font-bold text-deep line-clamp-1">{s.query}</p>
                  <p className="mt-0.5 text-xs text-muted">{fmtTime(s.created_at)}</p>
                </li>
              )) : <li className="text-sm text-muted">Brak</li>}
            </ul>
          </section>

          {/* Recent forum posts */}
          <section aria-labelledby="last-posts-tytul">
            <h2 id="last-posts-tytul" className="flex items-center gap-2 font-bold text-deep">
              <MessageSquare className="size-4" aria-hidden="true" />
              Ostatnie wpisy forum
            </h2>
            <ul className="mt-3 space-y-2">
              {recent.forum_posts.length > 0 ? recent.forum_posts.map((p, i) => (
                <li key={i} className="rounded-ui border-(length:--bw) border-sage bg-surface p-3 text-sm">
                  <p className="font-bold text-deep">{p.author_name}</p>
                  <p className="text-muted line-clamp-1">{p.content}</p>
                  <p className="mt-0.5 text-xs text-muted">{fmtTime(p.created_at)}</p>
                </li>
              )) : <li className="text-sm text-muted">Brak</li>}
            </ul>
          </section>

          {/* Recent ideas */}
          <section aria-labelledby="last-ideas-tytul">
            <h2 id="last-ideas-tytul" className="flex items-center gap-2 font-bold text-deep">
              <Lightbulb className="size-4" aria-hidden="true" />
              Ostatnie pomysły
            </h2>
            <ul className="mt-3 space-y-2">
              {recent.ideas.length > 0 ? recent.ideas.map((idea, i) => (
                <li key={i} className="rounded-ui border-(length:--bw) border-sage bg-surface p-3 text-sm">
                  <p className="font-bold text-deep line-clamp-1">{idea.title}</p>
                  <p className="mt-0.5 text-xs text-muted">{fmtTime(idea.created_at)}</p>
                </li>
              )) : <li className="text-sm text-muted">Brak</li>}
            </ul>
          </section>
        </div>
      )}
    </div>
  );
}
