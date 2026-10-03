"use client";

import { useEffect, useState } from "react";
import { BookOpen, Search, Users, ClipboardCheck, Clock } from "lucide-react";
import { apiFetch } from "@/lib/api";

interface Stats {
  innovations: number;
  users: number;
  testers: number;
  pending_testers: number;
  searches: number;
}

const MOCK_STATS: Stats = {
  innovations: 87,
  users: 34,
  testers: 12,
  pending_testers: 3,
  searches: 156,
};

export default function StatystykiPage() {
  const [stats, setStats] = useState<Stats>(MOCK_STATS);

  useEffect(() => {
    apiFetch<Stats>("/api/admin/stats", {
      headers: { "X-Dev-Admin": "true" },
    })
      .then(setStats)
      .catch(() => setStats(MOCK_STATS));
  }, []);

  const cards = [
    { label: "Innowacje w bazie", value: stats.innovations, icon: BookOpen, bg: "bg-mint" },
    { label: "Zarejestrowani użytkownicy", value: stats.users, icon: Users, bg: "bg-sage" },
    { label: "Aktywni testerzy", value: stats.testers, icon: ClipboardCheck, bg: "bg-butter" },
    { label: "Oczekujące zgłoszenia", value: stats.pending_testers, icon: Clock, bg: "bg-paper" },
    { label: "Wyszukiwania łącznie", value: stats.searches, icon: Search, bg: "bg-sage" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-deep">Statystyki platformy</h1>
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
