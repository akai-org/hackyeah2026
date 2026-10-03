"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Check, Archive, AlertCircle, Download, Search, ExternalLink } from "lucide-react";
import { apiFetch, apiPost } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Innovation {
  id: number;
  title: string;
  short_desc: string;
  status: string;
  category: string | null;
  tags: string[];
}

const STATUS_LABEL: Record<string, { label: string; className: string }> = {
  active: { label: "Aktywna", className: "bg-mint text-deep" },
  archived: { label: "Archiwum", className: "bg-paper text-muted" },
  unmaintained: { label: "Nieaktualna", className: "bg-butter text-ink" },
};

export default function InnowacjePage() {
  const [items, setItems] = useState<Innovation[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [pending, setPending] = useState<number | null>(null);

  function load() {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (statusFilter) params.set("status", statusFilter);
    apiFetch<Innovation[]>(`/api/admin/innovations?${params}`, {
      headers: { "X-Dev-Admin": "true" },
    })
      .then(setItems)
      .catch(() => {});
  }

  useEffect(load, [search, statusFilter]);

  async function setStatus(id: number, action: "approve" | "archive" | "flag-unmaintained") {
    setPending(id);
    try {
      await apiPost(`/api/admin/innovations/${id}/${action}`, {});
      const statusMap = { approve: "active", archive: "archived", "flag-unmaintained": "unmaintained" };
      setItems((prev) => prev.map((i) => i.id === id ? { ...i, status: statusMap[action] } : i));
    } finally {
      setPending(null);
    }
  }

  function exportCsv() {
    const header = ["ID", "Tytuł", "Status", "Kategoria", "Tagi"];
    const rows = items.map((inn) => [
      inn.id,
      `"${inn.title.replace(/"/g, '""')}"`,
      inn.status,
      inn.category ?? "",
      `"${inn.tags.join(", ")}"`,
    ]);
    const csv = [header.join(";"), ...rows.map((r) => r.join(";"))].join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `innowacje_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-deep">Zarządzanie innowacjami</h1>
        {items.length > 0 && (
          <Button variant="secondary" onClick={exportCsv} className="gap-2 text-sm">
            <Download className="size-4" aria-hidden="true" />
            Eksportuj CSV
          </Button>
        )}
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-3 size-4 text-muted" aria-hidden="true" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Szukaj innowacji…"
            aria-label="Szukaj innowacji"
            className="rounded-ui border-(length:--bw) border-deep bg-surface py-2 pl-9 pr-4 text-sm"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          aria-label="Filtruj po statusie"
          className="rounded-ui border-(length:--bw) border-deep bg-surface px-4 py-2 text-sm"
        >
          <option value="">Wszystkie statusy</option>
          <option value="active">Aktywne</option>
          <option value="archived">Archiwum</option>
          <option value="unmaintained">Nieaktualne</option>
        </select>
      </div>

      <div className="mt-6 overflow-x-auto">
        <p className="mb-3 text-sm text-muted">{items.length} innowacji</p>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b-2 border-deep text-left">
              <th className="py-3 pr-4 font-bold text-muted">Tytuł</th>
              <th className="py-3 pr-4 font-bold text-muted">Status</th>
              <th className="py-3 pr-4 font-bold text-muted">Kategoria</th>
              <th className="py-3 font-bold text-muted">Akcje</th>
            </tr>
          </thead>
          <tbody>
            {items.map((inn) => (
              <tr key={inn.id} className="border-b border-sage hover:bg-paper">
                <td className="py-3 pr-4">
                  <div className="flex items-start gap-2">
                    <div>
                      <p className="font-bold text-deep">{inn.title}</p>
                      <p className="text-muted line-clamp-1">{inn.short_desc}</p>
                    </div>
                    <Link
                      href={`/biblioteka/${inn.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Otwórz ${inn.title} w bibliotece`}
                      className="mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded text-muted hover:text-leaf"
                    >
                      <ExternalLink className="size-4" aria-hidden="true" />
                    </Link>
                  </div>
                </td>
                <td className="py-3 pr-4">
                  <span className={cn(
                    "inline-flex items-center rounded-full border border-deep px-2 py-0.5 text-xs font-bold",
                    STATUS_LABEL[inn.status]?.className ?? "bg-paper",
                  )}>
                    {STATUS_LABEL[inn.status]?.label ?? inn.status}
                  </span>
                </td>
                <td className="py-3 pr-4 text-muted">{inn.category ?? "—"}</td>
                <td className="py-3">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setStatus(inn.id, "approve")}
                      disabled={pending === inn.id || inn.status === "active"}
                      aria-label={`Zatwierdź ${inn.title}`}
                      title="Zatwierdź"
                      className="inline-flex size-8 items-center justify-center rounded-ui border-(length:--bw) border-deep bg-mint hover:bg-leaf hover:text-surface disabled:opacity-40"
                    >
                      <Check className="size-4" aria-hidden="true" />
                    </button>
                    <button
                      onClick={() => setStatus(inn.id, "archive")}
                      disabled={pending === inn.id || inn.status === "archived"}
                      aria-label={`Archiwizuj ${inn.title}`}
                      title="Archiwizuj"
                      className="inline-flex size-8 items-center justify-center rounded-ui border-(length:--bw) border-deep bg-paper hover:bg-sage disabled:opacity-40"
                    >
                      <Archive className="size-4" aria-hidden="true" />
                    </button>
                    <button
                      onClick={() => setStatus(inn.id, "flag-unmaintained")}
                      disabled={pending === inn.id || inn.status === "unmaintained"}
                      aria-label={`Oznacz jako nieaktywną ${inn.title}`}
                      title="Oznacz jako nieaktywną"
                      className="inline-flex size-8 items-center justify-center rounded-ui border-(length:--bw) border-deep bg-butter hover:bg-alert hover:text-surface disabled:opacity-40"
                    >
                      <AlertCircle className="size-4" aria-hidden="true" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={4} className="py-8 text-center text-muted">
                  Brak innowacji spełniających kryteria
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
