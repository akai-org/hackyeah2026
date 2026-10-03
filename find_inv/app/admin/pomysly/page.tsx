"use client";

import { useEffect, useState } from "react";
import { CheckCircle, Clock, Tag, X } from "lucide-react";
import { apiFetch, apiPost } from "@/lib/api";
import { cn } from "@/lib/utils";

interface Idea {
  id: number;
  title: string;
  essence: string;
  for_whom: string | null;
  tags: string[];
  author_name: string | null;
  author_email: string | null;
  status: "pending" | "reviewed" | "rejected";
  created_at: string | null;
}

const STATUS_LABEL: Record<string, { label: string; className: string }> = {
  pending:  { label: "Nowy",       className: "bg-butter text-ink" },
  reviewed: { label: "Przejrzany", className: "bg-mint text-deep" },
  rejected: { label: "Odrzucony",  className: "bg-paper text-muted" },
};

export default function PomyslyPage() {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [filter, setFilter] = useState("");
  const [pending, setPending] = useState<number | null>(null);

  function load() {
    const params = filter ? `?status=${filter}` : "";
    apiFetch<Idea[]>(`/api/admin/ideas${params}`, { headers: { "X-Dev-Admin": "true" } })
      .then((d) => setIdeas(d ?? []))
      .catch(() => {});
  }

  useEffect(load, [filter]);

  async function setStatus(id: number, status: "reviewed" | "rejected") {
    setPending(id);
    try {
      await apiPost(`/api/admin/ideas/${id}/status`, { status });
      setIdeas((prev) => prev.map((i) => i.id === id ? { ...i, status } : i));
    } finally {
      setPending(null);
    }
  }

  const counts = {
    all: ideas.length,
    pending: ideas.filter((i) => i.status === "pending").length,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-deep">Pomysły z Kreatora</h1>
        <p className="text-sm text-muted">{counts.pending} nowych</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {[
          { value: "", label: "Wszystkie" },
          { value: "pending", label: "Nowe" },
          { value: "reviewed", label: "Przejrzane" },
          { value: "rejected", label: "Odrzucone" },
        ].map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setFilter(value)}
            className={cn(
              "rounded-ui border-(length:--bw) border-deep px-4 py-2 text-sm font-bold",
              filter === value ? "bg-deep text-surface" : "bg-surface text-deep hover:bg-sage",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {ideas.length === 0 ? (
        <p className="py-12 text-center text-muted">Brak pomysłów w tej kategorii.</p>
      ) : (
        <ul className="space-y-4">
          {ideas.map((idea) => {
            const badge = STATUS_LABEL[idea.status];
            const date = idea.created_at
              ? new Date(idea.created_at).toLocaleDateString("pl-PL", { day: "numeric", month: "short", year: "numeric" })
              : "—";
            return (
              <li key={idea.id} className="rounded-ui border-(length:--bw) border-deep bg-surface p-5 shadow-paper">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={cn("rounded-full border border-deep px-2 py-0.5 text-xs font-bold", badge.className)}>
                        {badge.label}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-muted">
                        <Clock className="size-3" aria-hidden="true" />
                        {date}
                      </span>
                    </div>
                    <h2 className="mt-2 font-bold text-deep">{idea.title}</h2>
                    <p className="mt-1 text-sm">{idea.essence}</p>
                    {idea.for_whom && (
                      <p className="mt-1 text-sm text-muted">Dla kogo: {idea.for_whom}</p>
                    )}
                    {idea.tags.length > 0 && (
                      <ul className="mt-2 flex flex-wrap gap-1.5" aria-label="Tagi">
                        {idea.tags.map((tag) => (
                          <li key={tag} className="inline-flex items-center gap-1 rounded-full border border-leaf bg-paper px-2 py-0.5 text-xs text-leaf">
                            <Tag className="size-2.5" aria-hidden="true" />
                            {tag}
                          </li>
                        ))}
                      </ul>
                    )}
                    {idea.author_name && (
                      <p className="mt-2 text-xs text-muted">
                        Zgłosił: {idea.author_name}{idea.author_email ? ` (${idea.author_email})` : ""}
                      </p>
                    )}
                  </div>
                  {idea.status === "pending" && (
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => setStatus(idea.id, "reviewed")}
                        disabled={pending === idea.id}
                        aria-label={`Oznacz jako przejrzany: ${idea.title}`}
                        title="Przejrzany"
                        className="inline-flex size-9 items-center justify-center rounded-ui border-(length:--bw) border-deep bg-mint hover:bg-leaf hover:text-surface disabled:opacity-40"
                      >
                        <CheckCircle className="size-4" aria-hidden="true" />
                      </button>
                      <button
                        onClick={() => setStatus(idea.id, "rejected")}
                        disabled={pending === idea.id}
                        aria-label={`Odrzuć: ${idea.title}`}
                        title="Odrzuć"
                        className="inline-flex size-9 items-center justify-center rounded-ui border-(length:--bw) border-deep bg-paper hover:bg-alert hover:text-surface disabled:opacity-40"
                      >
                        <X className="size-4" aria-hidden="true" />
                      </button>
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
