"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Archive, CircleAlert, CircleCheck, Clock, CloudOff, type LucideIcon } from "lucide-react";

import type { InnovationStatus } from "@/data/admin.mock";
import { TAG_LABELS, type Tag } from "@/data/mock";
import type { Result } from "@/lib/admin-api";
import { ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";

// ---------- Ładowanie danych z panelu ----------

type State<T> = { data: T | null; offline: boolean; error: string | null; loading: boolean };

export function errorMessage(error: unknown): string {
  if (error instanceof ApiError && error.status === 403) return "Brak uprawnień administratora. Zaloguj się ponownie jako admin.";
  if (error instanceof ApiError) return `Serwer odrzucił żądanie (${error.message}). Spróbuj jeszcze raz.`;
  return "Coś poszło nie tak. Odśwież stronę.";
}

/**
 * Wczytuje dane i pozwala je lokalnie poprawić po akcji (bez ponownego pobierania całości).
 * Zmiana `key` (np. filtrów) pobiera dane od nowa.
 */
export function useAdminData<T>(load: () => Promise<Result<T>>, key = "") {
  const [state, setState] = useState<State<T>>({ data: null, offline: false, error: null, loading: true });
  const loadRef = useRef(load);
  loadRef.current = load;

  const reload = useCallback(async () => {
    setState((current) => ({ ...current, loading: true }));
    try {
      const result = await loadRef.current();
      setState({ data: result.data, offline: result.offline, error: null, loading: false });
    } catch (error) {
      setState((current) => ({ ...current, error: errorMessage(error), loading: false }));
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload, key]);

  const update = useCallback((fn: (data: T) => T) => {
    setState((current) => (current.data === null ? current : { ...current, data: fn(current.data) }));
  }, []);

  return { ...state, reload, update };
}

// ---------- Komunikaty ----------

export function OfflineNote({ offline }: { offline: boolean }) {
  if (!offline) return null;
  return (
    <p className="mb-6 flex items-start gap-3 rounded-ui border-2 border-deep bg-sage px-4 py-3">
      <CloudOff aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-deep" />
      Serwer nie odpowiada. Pokazuję kopię danych demo, zmiany znikną po odświeżeniu.
    </p>
  );
}

export function ErrorNote({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="mb-6 flex items-start gap-3 rounded-ui border-2 border-alert bg-surface px-4 py-3 font-bold text-alert">
      <CircleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
      {message}
    </p>
  );
}

export function LoadingRows({ label }: { label: string }) {
  return (
    <div role="status" aria-label={label} className="space-y-3">
      {[0, 1, 2, 3].map((row) => (
        <div key={row} className="h-14 animate-pulse rounded-ui bg-sage" />
      ))}
    </div>
  );
}

// ---------- Status innowacji: ikona + słowo ----------

export const STATUS_META: Record<InnovationStatus, { label: string; icon: LucideIcon; className: string }> = {
  pending: { label: "Do weryfikacji", icon: Clock, className: "bg-butter text-deep" },
  active: { label: "Aktywna", icon: CircleCheck, className: "bg-mint text-ink" },
  unmaintained: { label: "Nieaktualna", icon: CircleAlert, className: "bg-paper text-ink" },
  archived: { label: "Zarchiwizowana", icon: Archive, className: "bg-sage text-ink" },
};

export function StatusBadge({ status, className }: { status: InnovationStatus; className?: string }) {
  const meta = STATUS_META[status];
  const Icon = meta.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border-2 border-deep px-2.5 py-0.5 text-sm font-bold whitespace-nowrap",
        meta.className,
        className,
      )}
    >
      <Icon aria-hidden="true" className="size-4 shrink-0" strokeWidth={2.25} />
      {meta.label}
    </span>
  );
}

export function tagLabel(tag: string): string {
  return TAG_LABELS[tag as Tag] ?? tag.replaceAll("_", " ");
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pl-PL", { day: "numeric", month: "short", year: "numeric" });
}
