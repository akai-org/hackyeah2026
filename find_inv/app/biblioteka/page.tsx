"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Search, SlidersHorizontal } from "lucide-react";

import { CutoutText } from "@/components/cutout-text";
import { BackendInnovationCard, type BackendInnovation } from "@/components/backend-innovation-card";
import { apiFetch } from "@/lib/api";
import { TAXONOMY_TAGS } from "@/data/mock";

const STATUS_OPTIONS = [
  { value: "", label: "Wszystkie" },
  { value: "active", label: "Aktywne" },
  { value: "unmaintained", label: "Nieaktualne" },
  { value: "archived", label: "Archiwum" },
];

function BiblotekaContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [items, setItems] = useState<BackendInnovation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = "Biblioteka innowacji – HubMI";
    return () => { document.title = "HubMI – znajdź rozwiązanie, które już działa"; };
  }, []);

  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [status, setStatus] = useState(searchParams.get("status") ?? "");
  const [selectedTags, setSelectedTags] = useState<string[]>(
    searchParams.get("tags")?.split(",").filter(Boolean) ?? [],
  );
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (status) params.set("status", status);
    if (selectedTags.length) params.set("tags", selectedTags.join(","));
    params.set("limit", "50");

    apiFetch<BackendInnovation[]>(`/api/innovations?${params}`)
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [search, status, selectedTags]);

  function toggleTag(tag: string) {
    setSelectedTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]);
  }

  return (
    <div className="mx-auto max-w-content px-4 py-16 sm:px-6">
      <CutoutText as="h1" size="section" text="Biblioteka innowacji" />
      <p className="mt-4 max-w-[60ch] text-lg">
        Sprawdzone innowacje społeczne z Małopolski — programy i inicjatywy wdrożone przez gminy, NGO i OPS.
      </p>

      {/* Wyszukiwarka */}
      <div className="mt-8 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-3.5 size-4 text-muted" aria-hidden="true" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Szukaj innowacji…"
            aria-label="Szukaj innowacji"
            className="w-full rounded-ui border-(length:--bw) border-deep bg-surface py-3 pl-10 pr-4"
          />
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          aria-label="Filtruj po statusie"
          className="rounded-ui border-(length:--bw) border-deep bg-surface px-4 py-3"
        >
          {STATUS_OPTIONS.map(({ value, label }) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        <button
          onClick={() => setShowFilters((f) => !f)}
          aria-expanded={showFilters}
          className="inline-flex items-center gap-2 rounded-ui border-(length:--bw) border-deep bg-surface px-4 py-3 font-bold hover:bg-sage"
        >
          <SlidersHorizontal className="size-4" aria-hidden="true" />
          Tagi
          {selectedTags.length > 0 && (
            <span className="rounded-full bg-leaf px-1.5 py-0.5 text-xs text-surface">
              {selectedTags.length}
            </span>
          )}
        </button>
      </div>

      {showFilters && (
        <div className="mt-4 rounded-ui border-(length:--bw) border-sage bg-paper p-4">
          <p className="text-sm font-bold text-muted mb-3">Filtruj po tagach</p>
          <ul className="flex flex-wrap gap-2" role="group" aria-label="Tagi">
            {TAXONOMY_TAGS.map((tag) => (
              <li key={tag}>
                <button
                  type="button"
                  onClick={() => toggleTag(tag)}
                  aria-pressed={selectedTags.includes(tag)}
                  className={`rounded-full border-2 px-3 py-1 text-sm font-bold transition-colors ${
                    selectedTags.includes(tag)
                      ? "border-leaf bg-leaf text-surface"
                      : "border-deep bg-surface text-deep hover:bg-sage"
                  }`}
                >
                  {tag}
                </button>
              </li>
            ))}
          </ul>
          {selectedTags.length > 0 && (
            <button
              onClick={() => setSelectedTags([])}
              className="mt-3 text-sm text-alert underline"
            >
              Wyczyść filtry
            </button>
          )}
        </div>
      )}

      {/* Wyniki */}
      <div className="mt-4">
        {loading ? (
          <ul className="mt-6 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <li key={i} className="h-64 animate-pulse rounded-ui border-(length:--bw) border-sage bg-sage" />
            ))}
          </ul>
        ) : items.length === 0 ? (
          <p className="mt-8 text-lg text-muted">
            Brak innowacji spełniających kryteria. Zmień filtry lub{" "}
            <button onClick={() => { setSearch(""); setStatus(""); setSelectedTags([]); }} className="underline text-deep">
              wyczyść wyszukiwanie
            </button>
            .
          </p>
        ) : (
          <>
            <p className="mt-2 text-sm text-muted">{items.length} innowacji</p>
            <ul className="mt-6 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {items.map((inn) => (
                <li key={inn.id} className="flex">
                  <BackendInnovationCard innovation={inn} headingLevel="h2" />
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}

export default function LibraryPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-content px-4 py-16 sm:px-6"><p className="text-lg text-muted">Wczytuję…</p></div>}>
      <BiblotekaContent />
    </Suspense>
  );
}
