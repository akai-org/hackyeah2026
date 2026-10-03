"use client";

import { useCallback, useEffect, useState } from "react";
import { BookOpen, RefreshCw, Search, Users, ClipboardCheck, Clock, Lightbulb } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";

interface Stats {
  innovations: number;
  users: number;
  testers: number;
  pending_testers: number;
  searches: number;
  ideas: number;
}

const MOCK_STATS: Stats = {
  innovations: 21,
  users: 0,
  testers: 0,
  pending_testers: 0,
  searches: 0,
  ideas: 0,
};

export default function StatystykiPage() {
  const [stats, setStats] = useState<Stats>(MOCK_STATS);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const data = await apiFetch<Stats>("/api/admin/stats", {
        headers: { "X-Dev-Admin": "true" },
      });
      if (data) {
        setStats(data);
        setLastUpdated(new Date());
      }
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
    { label: "Pomysły z Kreatora", value: stats.ideas ?? 0, icon: Lightbulb, bg: "bg-butter" },
  ];

  return (
    <div>
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
      <ul className="mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map(({ label, value, icon: Icon, bg }) => (
          <li key={label} className={`border-(length:--bw) border-deep ${bg} p-6 shadow-paper`}>
            <Icon className="size-8 text-leaf" aria-hidden="true" />
            <p className="mt-4 text-4xl font-bold text-deep tabular-nums">{value.toLocaleString("pl-PL")}</p>
            <p className="mt-1 text-muted">{label}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
