"use client";

import { useId, useState } from "react";
import { Archive, CircleAlert, CircleCheck, Loader2, MapPin, RotateCcw, Search } from "lucide-react";

import { CutoutText } from "@/components/cutout-text";
import {
  ErrorNote,
  LoadingRows,
  OfflineNote,
  STATUS_META,
  StatusBadge,
  errorMessage,
  formatDate,
  tagLabel,
  useAdminData,
} from "@/components/admin/shared";
import { Toast, useToast } from "@/components/toast";
import { Button } from "@/components/ui/button";
import type { AdminInnovation, InnovationStatus } from "@/data/admin.mock";
import { TAXONOMY_TAGS } from "@/data/mock";
import { getInnovations, setInnovationStatus, type InnovationAction, type InnovationFilters } from "@/lib/admin-api";
import { cn } from "@/lib/utils";

const fieldClass =
  "mt-2 min-h-12 w-full rounded-ui border-(length:--bw) border-deep bg-surface px-4 text-base text-ink placeholder:text-muted";

const ACTIONS: Array<{ action: InnovationAction; label: string; done: string; icon: typeof CircleCheck; hideFor: InnovationStatus }> = [
  { action: "approve", label: "Zatwierdź", done: "zatwierdzona", icon: CircleCheck, hideFor: "active" },
  { action: "flag-unmaintained", label: "Nieaktualna", done: "oznaczona jako nieaktualna", icon: CircleAlert, hideFor: "unmaintained" },
  { action: "archive", label: "Archiwizuj", done: "zarchiwizowana", icon: Archive, hideFor: "archived" },
];

function Actions({
  item,
  busy,
  onAction,
}: {
  item: AdminInnovation;
  busy: string | null;
  onAction: (item: AdminInnovation, action: InnovationAction) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {ACTIONS.filter((a) => a.hideFor !== item.status).map(({ action, label, icon: Icon }) => {
        const pending = busy === `${item.id}:${action}`;
        return (
          <Button
            key={action}
            type="button"
            variant={action === "approve" ? "primary" : "secondary"}
            disabled={busy !== null}
            onClick={() => onAction(item, action)}
            className="min-h-12 px-3 text-base"
          >
            {pending ? <Loader2 aria-hidden="true" className="animate-spin" /> : <Icon aria-hidden="true" />}
            {label}
            <span className="sr-only">: {item.title}</span>
          </Button>
        );
      })}
    </div>
  );
}

export function AdminInnovationsView({ initialStatus = "" }: { initialStatus?: string }) {
  const ids = useId();
  const [filters, setFilters] = useState<InnovationFilters>({ status: initialStatus });
  const [draftSearch, setDraftSearch] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const toast = useToast();

  const { data, offline, error, loading, update } = useAdminData(() => getInnovations(filters), JSON.stringify(filters));

  function applyFilters(next: InnovationFilters) {
    setFilters(next);
  }

  async function handleAction(item: AdminInnovation, action: InnovationAction) {
    setBusy(`${item.id}:${action}`);
    setActionError(null);
    try {
      const { data: updated } = await setInnovationStatus(item.id, action);
      update((current) => ({
        ...current,
        items: current.items.map((row) => (row.id === updated.id ? { ...row, ...updated } : row)),
      }));
      toast.show(`„${item.title}” ${ACTIONS.find((a) => a.action === action)!.done}.`);
    } catch (err) {
      setActionError(errorMessage(err));
    } finally {
      setBusy(null);
    }
  }

  const items = data?.items ?? [];
  const hasFilters = Boolean(filters.status || filters.tags || filters.search);

  return (
    <section aria-labelledby={`${ids}-tytul`}>
      <CutoutText as="h1" size="section" text="Innowacje" id={`${ids}-tytul`} />
      <p className="mt-3 mb-8 max-w-[60ch] text-lg">
        Zatwierdzaj nowe zgłoszenia, oznaczaj nieaktualne opisy i archiwizuj zakończone projekty.
      </p>

      <form
        role="search"
        aria-label="Filtruj innowacje"
        onSubmit={(event) => {
          event.preventDefault();
          applyFilters({ ...filters, search: draftSearch.trim() });
        }}
        className="mb-8 grid gap-4 border-(length:--bw) border-deep bg-surface p-5 md:grid-cols-[1fr_auto_auto_auto] md:items-end"
      >
        <div>
          <label htmlFor={`${ids}-szukaj`} className="block font-bold text-deep">
            Szukaj po nazwie lub miejscu
          </label>
          <input
            id={`${ids}-szukaj`}
            type="search"
            value={draftSearch}
            onChange={(event) => setDraftSearch(event.target.value)}
            placeholder="np. senior, Tarnów"
            className={fieldClass}
          />
        </div>
        <div>
          <label htmlFor={`${ids}-status`} className="block font-bold text-deep">
            Status
          </label>
          <select
            id={`${ids}-status`}
            value={filters.status ?? ""}
            onChange={(event) => applyFilters({ ...filters, status: event.target.value })}
            className={cn(fieldClass, "cursor-pointer md:w-52")}
          >
            <option value="">Wszystkie</option>
            {(Object.keys(STATUS_META) as InnovationStatus[]).map((status) => (
              <option key={status} value={status}>
                {STATUS_META[status].label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor={`${ids}-tag`} className="block font-bold text-deep">
            Tag
          </label>
          <select
            id={`${ids}-tag`}
            value={filters.tags ?? ""}
            onChange={(event) => applyFilters({ ...filters, tags: event.target.value })}
            className={cn(fieldClass, "cursor-pointer md:w-56")}
          >
            <option value="">Wszystkie tagi</option>
            {TAXONOMY_TAGS.map((tag) => (
              <option key={tag} value={tag}>
                {tagLabel(tag)}
              </option>
            ))}
          </select>
        </div>
        <Button type="submit">
          <Search aria-hidden="true" />
          Szukaj
        </Button>
      </form>

      <OfflineNote offline={offline} />
      <ErrorNote message={error ?? actionError} />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p aria-live="polite" className="font-bold text-deep">
          {loading ? "Wczytuję…" : `Znaleziono: ${items.length}`}
        </p>
        {hasFilters && (
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              setDraftSearch("");
              applyFilters({});
            }}
          >
            <RotateCcw aria-hidden="true" />
            Wyczyść filtry
          </Button>
        )}
      </div>

      {loading && !data ? (
        <LoadingRows label="Wczytuję innowacje" />
      ) : items.length === 0 ? (
        <div className="border-(length:--bw) border-deep bg-surface p-8">
          <CutoutText as="p" size="section" text="Nic tu nie ma" />
          <p className="mt-3">Żadna innowacja nie pasuje do filtrów. Zmień status albo wyczyść filtry.</p>
        </div>
      ) : (
        <>
          {/* Szeroki ekran: tabela. */}
          <div className="hidden overflow-x-auto border-(length:--bw) border-deep bg-surface lg:block">
            <table className="w-full border-collapse text-left">
              <caption className="sr-only">Innowacje w Bibliotece, {items.length} pozycji</caption>
              <thead className="bg-sage">
                <tr>
                  <th scope="col" className="px-4 py-3 font-bold text-deep">Innowacja</th>
                  <th scope="col" className="px-4 py-3 font-bold text-deep">Status</th>
                  <th scope="col" className="px-4 py-3 font-bold text-deep">Dodano</th>
                  <th scope="col" className="px-4 py-3 font-bold text-deep">Akcje</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className={cn("border-t-2 border-sage align-top", item.status === "pending" && "bg-butter/30")}>
                    <th scope="row" className="max-w-md px-4 py-4 text-left font-normal">
                      <span className="block font-bold text-deep">{item.title}</span>
                      <span className="mt-1 block text-muted">{item.short_desc}</span>
                      <span className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
                        <span className="inline-flex items-center gap-1">
                          <MapPin aria-hidden="true" className="size-4" />
                          {item.where_implemented || "brak danych"}
                        </span>
                        {item.tags.slice(0, 3).map((tag) => (
                          <span key={tag} className="rounded-full border border-deep bg-mint px-2">
                            {tagLabel(tag)}
                          </span>
                        ))}
                      </span>
                    </th>
                    <td className="px-4 py-4">
                      <StatusBadge status={item.status} />
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap tabular-nums">{formatDate(item.created_at)}</td>
                    <td className="px-4 py-4">
                      <Actions item={item} busy={busy} onAction={handleAction} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Wąski ekran: karty. */}
          <ul className="space-y-4 lg:hidden">
            {items.map((item) => (
              <li key={item.id} className="border-(length:--bw) border-deep bg-surface p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <h2 className="text-lg font-bold text-deep">{item.title}</h2>
                  <StatusBadge status={item.status} />
                </div>
                <p className="mt-2 text-muted">{item.short_desc}</p>
                <p className="mt-2 flex items-center gap-1 text-sm text-muted">
                  <MapPin aria-hidden="true" className="size-4" />
                  {item.where_implemented || "brak danych"} · dodano {formatDate(item.created_at)}
                </p>
                <div className="mt-4">
                  <Actions item={item} busy={busy} onAction={handleAction} />
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      <Toast message={toast.message} onClose={toast.hide} />
    </section>
  );
}
